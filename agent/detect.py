"""
RevAgent Anomaly Detection — Phase 2 Upgrade
=============================================
Replaces the basic rolling-average threshold approach with a
dual-method statistical engine:

  1. Z-Score  — flags rows where deviation from rolling mean
                exceeds N standard deviations. Good for normally
                distributed metrics (net_revenue, CAC).

  2. IQR      — flags rows where value falls outside
                Q1 - k*IQR / Q3 + k*IQR. Robust against outliers
                and skewed distributions (refund_rate, churn_rate).

Both methods apply the same business-context guardrails and
direction rules as before, then compress consecutive events
into single business events to reduce alert noise.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Literal

import numpy as np
import pandas as pd

from agent.ingest import run_ingest


PROCESSED_PATH = Path("data/processed/metrics.csv")

VALID_MODES: list[str] = ["recent_issues", "historical_patterns"]

# ── Detection config ──────────────────────────────────────────────────────────
# Z-score: flag if |z| > threshold (lower = more sensitive)
ZSCORE_THRESHOLDS: dict[str, float] = {
    "net_revenue": 1.8,
    "refund_rate": 2.0,
    "CAC": 1.8,
    "churn_rate": 2.0,
}

# IQR: flag if value outside Q1 - k*IQR or Q3 + k*IQR
IQR_K: dict[str, float] = {
    "net_revenue": 1.5,
    "refund_rate": 1.5,
    "CAC": 1.5,
    "churn_rate": 1.5,
}

# Rolling window for computing stats
ROLLING_WINDOW = 30
MIN_PERIODS = 7

# For recent mode: look back this many days
RECENT_WINDOW_DAYS = 7
RECENT_FALLBACK_DAYS = 14


# ── Loaders ───────────────────────────────────────────────────────────────────

def load_metrics() -> pd.DataFrame:
    """Load processed metrics.csv from disk."""
    if not PROCESSED_PATH.exists():
        raise FileNotFoundError(
            "metrics.csv not found. Run /api/upload first."
        )
    df = pd.read_csv(PROCESSED_PATH)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    return df


# ── Direction rules ───────────────────────────────────────────────────────────

def _passes_direction_rule(metric: str, change_pct: float) -> bool:
    """
    Only flag business-negative anomalies.
    Revenue dropping is bad; costs/rates rising are bad.
    """
    if metric == "net_revenue":
        return change_pct < 0
    if metric in {"refund_rate", "CAC", "churn_rate"}:
        return change_pct > 0
    return True


# ── Business significance guards ─────────────────────────────────────────────

def _passes_business_guard(metric: str, row: pd.Series) -> bool:
    """Ignore anomalies that are statistically significant but business-trivial."""
    if metric == "net_revenue":
        rolling_mean = row.get(f"{metric}_rolling_mean", 0)
        current = row.get(metric, 0)
        if abs(float(current) - float(rolling_mean)) < 5000:
            return False
        if float(current) < 1000:
            return False

    elif metric == "refund_rate":
        if row.get("refunds", 0) < 500:
            return False
        if row.get("revenue", 0) < 3000:
            return False

    elif metric == "CAC":
        if row.get("new_customers", 0) < 5:
            return False
        if row.get("total_spend", 0) < 100:
            return False

    elif metric == "churn_rate":
        if row.get("churned_customers", 0) < 3:
            return False
        if row.get("active_customers_30d", 0) < 30:
            return False

    return True


# ── Signal preparation ────────────────────────────────────────────────────────

def _prepare_signals(df: pd.DataFrame, metric: str) -> pd.DataFrame:
    """
    Add rolling mean, rolling std, rolling IQR bounds, and change_pct
    for a given metric column.
    """
    temp = df.copy()

    rolling = temp[metric].rolling(window=ROLLING_WINDOW, min_periods=MIN_PERIODS)

    temp[f"{metric}_rolling_mean"] = rolling.mean()
    temp[f"{metric}_rolling_std"]  = rolling.std()

    # IQR bounds using expanding quantiles (more stable than rolling quantile)
    q1 = temp[metric].expanding(min_periods=MIN_PERIODS).quantile(0.25)
    q3 = temp[metric].expanding(min_periods=MIN_PERIODS).quantile(0.75)
    iqr = q3 - q1
    k = IQR_K.get(metric, 1.5)
    temp[f"{metric}_iqr_lower"] = q1 - k * iqr
    temp[f"{metric}_iqr_upper"] = q3 + k * iqr

    # % change vs rolling mean
    temp[f"{metric}_change_pct"] = (
        (temp[metric] - temp[f"{metric}_rolling_mean"])
        / temp[f"{metric}_rolling_mean"].replace(0, pd.NA)
        * 100
    ).fillna(0)

    return temp


# ── Core detection ────────────────────────────────────────────────────────────

def _detect_zscore(temp: pd.DataFrame, metric: str) -> pd.DataFrame:
    """Return rows flagged by Z-score method."""
    std = temp[f"{metric}_rolling_std"]
    mean = temp[f"{metric}_rolling_mean"]
    threshold = ZSCORE_THRESHOLDS.get(metric, 2.0)

    z = (temp[metric] - mean) / std.replace(0, pd.NA)
    return temp[z.abs() >= threshold].copy()


def _detect_iqr(temp: pd.DataFrame, metric: str) -> pd.DataFrame:
    """Return rows flagged by IQR method."""
    lower = temp[f"{metric}_iqr_lower"]
    upper = temp[f"{metric}_iqr_upper"]
    return temp[
        (temp[metric] < lower) | (temp[metric] > upper)
    ].copy()


def detect_for_metric(
    df: pd.DataFrame,
    metric: str,
    method: Literal["zscore", "iqr", "both"] = "both",
) -> list[dict]:
    """
    Detect anomalies for a single metric using Z-score, IQR, or both.
    Applies direction rules + business significance guards.
    """
    if metric not in df.columns:
        return []

    temp = _prepare_signals(df, metric)
    anomalies: list[dict] = []

    if method == "zscore":
        flagged = _detect_zscore(temp, metric)
    elif method == "iqr":
        flagged = _detect_iqr(temp, metric)
    else:
        # Union of both methods
        z_flagged = _detect_zscore(temp, metric)
        iqr_flagged = _detect_iqr(temp, metric)
        flagged = pd.concat([z_flagged, iqr_flagged]).drop_duplicates()

    for _, row in flagged.iterrows():
        current = row[metric]
        mean = row[f"{metric}_rolling_mean"]
        change_pct = row[f"{metric}_change_pct"]

        if pd.isna(current) or pd.isna(mean):
            continue
        if abs(float(mean)) < 1e-6:
            continue
        if not _passes_direction_rule(metric, float(change_pct)):
            continue
        if not _passes_business_guard(metric, row):
            continue

        # Severity based on z-score magnitude if available
        std_val = row.get(f"{metric}_rolling_std", 0)
        if std_val and not pd.isna(std_val) and float(std_val) > 0:
            z = abs((float(current) - float(mean)) / float(std_val))
            if z >= 3.0:
                severity = "high"
            elif z >= 2.0:
                severity = "medium"
            else:
                severity = "low"
        else:
            abs_pct = abs(float(change_pct))
            severity = "high" if abs_pct >= 40 else "medium" if abs_pct >= 20 else "low"

        anomalies.append({
            "date": pd.to_datetime(row["date"]).strftime("%Y-%m-%d"),
            "metric": metric,
            "current_value": round(float(current), 4),
            "rolling_mean": round(float(mean), 4),
            "change_pct": round(float(change_pct), 2),
            "direction": "up" if float(change_pct) > 0 else "down",
            "severity": severity,
            "business_impact": "negative",
        })

    return anomalies


# ── Compression ───────────────────────────────────────────────────────────────

def compress_anomalies(anomalies: list[dict]) -> list[dict]:
    """
    Compress consecutive same-metric anomaly rows (within 3-day gaps)
    into single business events. Applies per-metric caps, then returns
    top-10 by magnitude.
    """
    if not anomalies:
        return []

    def _to_dt(x: str) -> datetime:
        return datetime.strptime(x, "%Y-%m-%d")

    def _score(e: dict) -> float:
        return abs(float(e["change_pct"]))

    ordered = sorted(anomalies, key=lambda x: (x["metric"], x["date"]))
    compressed: list[dict] = []
    group: list[dict] = []

    for row in ordered:
        if not group:
            group = [row]
            continue
        last = group[-1]
        same = row["metric"] == last["metric"]
        gap = (_to_dt(row["date"]) - _to_dt(last["date"])).days
        if same and gap <= 3:
            group.append(row)
        else:
            worst = max(group, key=_score)
            compressed.append({
                **worst,
                "event_start": group[0]["date"],
                "event_end": group[-1]["date"],
                "event_duration_days": (
                    (_to_dt(group[-1]["date"]) - _to_dt(group[0]["date"])).days + 1
                ),
            })
            group = [row]

    if group:
        worst = max(group, key=_score)
        compressed.append({
            **worst,
            "event_start": group[0]["date"],
            "event_end": group[-1]["date"],
            "event_duration_days": (
                (_to_dt(group[-1]["date"]) - _to_dt(group[0]["date"])).days + 1
            ),
        })

    # Per-metric caps
    caps = {"refund_rate": 3, "net_revenue": 3, "CAC": 2, "churn_rate": 2}
    by_metric: dict[str, list[dict]] = defaultdict(list)
    for ev in compressed:
        by_metric[ev["metric"]].append(ev)

    capped: list[dict] = []
    for metric, events in by_metric.items():
        cap = caps.get(metric, 2)
        capped.extend(sorted(events, key=_score, reverse=True)[:cap])

    return sorted(capped, key=_score, reverse=True)[:10]


def print_anomaly_report(anomalies: list[dict]) -> None:
    """Print terminal-friendly anomaly summary."""
    print("=== ANOMALY REPORT ===")
    if not anomalies:
        print("No anomalies found.")
        return
    dates = sorted(a["date"] for a in anomalies)
    print(f"Period : {dates[0]} -> {dates[-1]}")
    print(f"Total  : {len(anomalies)}\n")
    for a in anomalies:
        print(
            f"[{a['severity'].upper():6}] {a['metric']:<20} "
            f"{a['direction']:>4} {a['change_pct']:+.1f}%  "
            f"(date: {a['date']})"
        )
        if "event_start" in a:
            print(f"         Event: {a['event_start']} -> {a['event_end']} "
                  f"({a.get('event_duration_days', 1)} days)")
    print()


# ── Public runners ────────────────────────────────────────────────────────────

METRICS = ["net_revenue", "refund_rate", "CAC", "churn_rate"]


def run_detect() -> list[dict]:
    """
    Recent Issues mode.
    Scan last 7 days; fallback to last 14 if nothing found.
    Uses Z-score + IQR dual detection.
    """
    df = load_metrics()
    all_anomalies: list[dict] = []

    recent = df.tail(RECENT_WINDOW_DAYS).copy()
    for metric in METRICS:
        all_anomalies.extend(detect_for_metric(recent, metric, method="both"))

    if not all_anomalies:
        recent14 = df.tail(RECENT_FALLBACK_DAYS).copy()
        for metric in METRICS:
            all_anomalies.extend(detect_for_metric(recent14, metric, method="both"))

    all_anomalies = sorted(all_anomalies, key=lambda x: abs(x["change_pct"]), reverse=True)
    print_anomaly_report(all_anomalies)
    return all_anomalies


def run_detect_full() -> list[dict]:
    """
    Historical Patterns mode.
    Scan full dataset, compress into business events.
    Uses Z-score + IQR dual detection.
    """
    df = run_ingest()
    raw: list[dict] = []
    for metric in METRICS:
        raw.extend(detect_for_metric(df, metric, method="both"))
    raw = sorted(raw, key=lambda x: abs(float(x["change_pct"])), reverse=True)
    compressed = compress_anomalies(raw)
    print_anomaly_report(compressed)
    return compressed


def run_detect_mode(mode: str = "recent_issues") -> list[dict]:
    """Route to the correct detect runner based on mode."""
    if mode not in VALID_MODES:
        print(f"WARNING: Invalid mode '{mode}'. Defaulting to recent_issues.")
        mode = "recent_issues"
    return run_detect_full() if mode == "historical_patterns" else run_detect()


if __name__ == "__main__":
    run_detect()