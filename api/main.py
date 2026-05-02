from __future__ import annotations

import io
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any, Literal

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

# ── DB setup ────────────────────────────────────────────────────────────────
from api.database import Base, engine, get_db
from api.models import AnomalyEvent, DailyMetric, User

Base.metadata.create_all(bind=engine)  # auto-create tables on startup

# ── Agent pipeline ───────────────────────────────────────────────────────────
from agent.ingest import run_ingest
from agent.detect import run_detect, run_detect_mode
from agent.analyze import run_analyze

try:
    from agent.detect import run_detect_full
except Exception:
    run_detect_full = None

try:
    from agent.report import run_report
except Exception:
    run_report = None

# ── Filesystem paths (kept for legacy CSV support & report storage) ──────────
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
LATEST_REPORT_PATH = PROCESSED_DIR / "latest_report.json"
METRICS_PATH = PROCESSED_DIR / "metrics.csv"

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="RevAgent API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _save_upload(upload: UploadFile, target_path: Path) -> None:
    """Save an uploaded file to disk."""
    target_path.parent.mkdir(parents=True, exist_ok=True)
    with open(target_path, "wb") as f:
        f.write(upload.file.read())


def _safe_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert dataframe to JSON-safe records."""
    safe_df = df.copy()
    for col in safe_df.columns:
        if pd.api.types.is_datetime64_any_dtype(safe_df[col]):
            safe_df[col] = safe_df[col].dt.strftime("%Y-%m-%d")
    safe_df = safe_df.where(pd.notnull(safe_df), None)
    return jsonable_encoder(safe_df.to_dict(orient="records"))


def _compute_kpis(df: pd.DataFrame) -> dict[str, float]:
    """Compute dashboard KPI snapshot: latest row vs 7 days ago."""
    if df.empty:
        return {
            "net_revenue": 0.0, "net_revenue_delta": 0.0,
            "refund_rate": 0.0, "refund_rate_delta": 0.0,
            "cac": 0.0, "cac_delta": 0.0,
            "churn_rate": 0.0, "churn_rate_delta": 0.0,
        }

    current = df.iloc[-1]
    prior = df.iloc[-8] if len(df) >= 8 else df.iloc[0]

    return {
        "net_revenue": float(current["net_revenue"]),
        "net_revenue_delta": (
            round(float(current["revenue_growth_7d"]) * 100, 1)
            if "revenue_growth_7d" in df.columns
            else round(float(current["net_revenue"] - prior["net_revenue"]), 1)
        ),
        "refund_rate": float(current["refund_rate"]),
        "refund_rate_delta": round(
            (float(current["refund_rate"]) - float(prior["refund_rate"])) * 100, 1
        ),
        "cac": float(current["CAC"]),
        "cac_delta": round(float(current["CAC"] - prior["CAC"]), 1),
        "churn_rate": float(current["churn_rate"]),
        "churn_rate_delta": round(
            (float(current["churn_rate"]) - float(prior["churn_rate"])) * 100, 1
        ),
    }


def _upsert_metrics_to_db(df: pd.DataFrame, db: Session, user_id: int = 1) -> int:
    """
    Persist processed metrics DataFrame into DailyMetric table.
    Uses upsert-by-date logic: deletes existing rows for covered dates, re-inserts.
    Returns number of rows written.
    """
    if df.empty:
        return 0

    col_map = {
        "revenue": "revenue", "refunds": "refunds",
        "new_customers": "new_customers", "churned_customers": "churned_customers",
        "google_spend": "google_spend", "meta_spend": "meta_spend",
        "total_spend": "total_spend", "sessions": "sessions",
        "conversions": "conversions", "conversion_rate": "conversion_rate",
        "net_revenue": "net_revenue", "refund_rate": "refund_rate",
        "CAC": "cac", "churn_rate": "churn_rate",
    }

    # Parse dates robustly
    date_col = pd.to_datetime(df["date"], errors="coerce")
    min_date = date_col.min().date()
    max_date = date_col.max().date()

    # Delete existing rows for the covered date range for this user
    db.query(DailyMetric).filter(
        DailyMetric.user_id == user_id,
        DailyMetric.date >= min_date,
        DailyMetric.date <= max_date,
    ).delete(synchronize_session=False)
    db.flush()

    rows_written = 0
    for _, row in df.iterrows():
        row_date = pd.to_datetime(row["date"]).date() if not isinstance(row["date"], date) else row["date"]
        kwargs = {"user_id": user_id, "date": row_date}
        for df_col, db_col in col_map.items():
            if df_col in df.columns:
                kwargs[db_col] = float(row[df_col]) if pd.notna(row[df_col]) else 0.0
        db.add(DailyMetric(**kwargs))
        rows_written += 1

    db.commit()
    return rows_written


def _load_metrics_from_db(db: Session, user_id: int = 1) -> pd.DataFrame:
    """Load all DailyMetric rows for a user into a DataFrame."""
    rows = (
        db.query(DailyMetric)
        .filter(DailyMetric.user_id == user_id)
        .order_by(DailyMetric.date)
        .all()
    )
    if not rows:
        return pd.DataFrame()

    records = [
        {
            "date": r.date, "revenue": r.revenue, "refunds": r.refunds,
            "new_customers": r.new_customers, "churned_customers": r.churned_customers,
            "google_spend": r.google_spend, "meta_spend": r.meta_spend,
            "total_spend": r.total_spend, "sessions": r.sessions,
            "conversions": r.conversions, "conversion_rate": r.conversion_rate,
            "net_revenue": r.net_revenue, "refund_rate": r.refund_rate,
            "CAC": r.cac, "churn_rate": r.churn_rate,
        }
        for r in rows
    ]
    return pd.DataFrame(records)


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "version": "2.0.0"}


@app.post("/api/upload")
async def upload_files(
    revenue: UploadFile = File(...),
    ad_spend: UploadFile = File(...),
    traffic: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Accept the 3 required CSV files, save to disk (legacy path),
    AND persist the processed metrics into the database.
    """
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Read file bytes before saving so we can also parse them
    revenue_bytes = await revenue.read()
    ad_spend_bytes = await ad_spend.read()
    traffic_bytes = await traffic.read()

    # Save raw files to disk (keeps legacy pipeline intact)
    (RAW_DIR / "revenue.csv").write_bytes(revenue_bytes)
    (RAW_DIR / "ad_spend.csv").write_bytes(ad_spend_bytes)
    (RAW_DIR / "traffic.csv").write_bytes(traffic_bytes)

    # Run the ingest pipeline (reads from disk, writes metrics.csv)
    try:
        df = run_ingest()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Ingest failed: {exc}")

    # Ensure a default user exists (user_id=1 is the single-tenant default)
    if not db.query(User).filter(User.id == 1).first():
        db.add(User(id=1, email="default@revagent.io", company_name="Default"))
        db.commit()

    rows_written = _upsert_metrics_to_db(df, db, user_id=1)

    return {
        "status": "ok",
        "message": f"Files uploaded and {rows_written} metric rows saved to database.",
    }


@app.post("/api/analyze")
async def analyze(
    mode: Literal["recent_issues", "historical_patterns"] = "recent_issues",
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Run detect -> analyze and return full dashboard payload.
    Reads metrics from DB when available, falls back to CSV.
    """
    try:
        # Prefer DB-sourced metrics
        df = _load_metrics_from_db(db)
        if df.empty:
            df = run_ingest()

        anomalies = run_detect_mode(mode)
        report = run_analyze(mode=mode)

        if mode == "historical_patterns" and not anomalies:
            return {
                "status": "ok",
                "mode_used": mode,
                "report_type": "Historical Patterns",
                "message": "No historical anomalies found in dataset",
                "report": {},
                "anomalies": [],
                "anomaly_count": 0,
                "metrics_preview": _safe_records(df.tail(30)),
                "kpis": _compute_kpis(df),
            }

        if report is None:
            raise HTTPException(status_code=500, detail="Analysis returned no report")

        return {
            "status": "ok",
            "mode_used": mode,
            "report_type": report.get("report_type", "Recent Issues"),
            "report": report,
            "anomalies": anomalies,
            "anomaly_count": len(anomalies),
            "metrics_preview": _safe_records(df.tail(30)),
            "kpis": _compute_kpis(df),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {exc}")


@app.get("/api/report")
def get_report() -> Any:
    """Return latest_report.json contents."""
    if not LATEST_REPORT_PATH.exists():
        raise HTTPException(status_code=404, detail="latest_report.json not found. Run /api/analyze first.")
    with open(LATEST_REPORT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/metrics")
def get_metrics(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """
    Return all daily metrics as JSON records.
    Prefers database; falls back to metrics.csv.
    """
    df = _load_metrics_from_db(db)
    if df.empty:
        if not METRICS_PATH.exists():
            raise HTTPException(status_code=404, detail="No metrics found. Upload CSVs first.")
        df = pd.read_csv(METRICS_PATH, parse_dates=["date"])
    return _safe_records(df)


@app.get("/api/report/pdf")
def get_report_pdf() -> FileResponse:
    """Generate and return PDF if report module exists."""
    if run_report is None:
        raise HTTPException(status_code=501, detail="agent/report.py not available yet.")
    try:
        pdf_path = Path(run_report())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")
    if not pdf_path.exists():
        raise HTTPException(status_code=500, detail="PDF file was not generated.")
    return FileResponse(path=pdf_path, media_type="application/pdf", filename=pdf_path.name)