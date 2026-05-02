# from __future__ import annotations
# from agent.preprocess import run_preprocess
# from pathlib import Path
# from typing import Optional

# import pandas as pd

# try:
#     from agent.preprocess import run_preprocess
# except ImportError:
#     run_preprocess = None


# RAW_DIR = Path("data/raw")
# PROCESSED_DIR = Path("data/processed")
# OUTPUT_PATH = PROCESSED_DIR / "metrics.csv"


# def _load_csv(file_path: Path, file_label: str) -> pd.DataFrame:
#     """
#     Load a CSV, parse date column, and print row count.
#     """
#     if not file_path.exists():
#         raise FileNotFoundError(f"Missing required file: {file_path}")

#     df = pd.read_csv(file_path)
#     if "date" not in df.columns:
#         raise ValueError(f"{file_label} must contain a 'date' column.")

#     df = df.copy()
#     df["date"] = pd.to_datetime(df["date"], errors="coerce")
#     df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

#     print(f"Loaded {file_path.name} — {len(df)} rows")
#     return df


# def _prepare_inputs(
#     revenue_df: pd.DataFrame,
#     ad_spend_df: pd.DataFrame,
#     traffic_df: pd.DataFrame,
# ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
#     """
#     Standardize expected input columns.
#     """
#     revenue_expected = [
#         "date",
#         "revenue",
#         "refunds",
#         "new_customers",
#         "churned_customers",
#     ]
#     ad_expected = [
#         "date",
#         "google_spend",
#         "meta_spend",
#         "total_spend",
#     ]
#     traffic_expected = [
#         "date",
#         "sessions",
#         "conversions",
#         "conversion_rate",
#     ]

#     missing_revenue = set(revenue_expected) - set(revenue_df.columns)
#     missing_ad = set(ad_expected) - set(ad_spend_df.columns)
#     missing_traffic = set(traffic_expected) - set(traffic_df.columns)

#     if missing_revenue:
#         raise ValueError(f"revenue.csv missing columns: {sorted(missing_revenue)}")
#     if missing_ad:
#         raise ValueError(f"ad_spend.csv missing columns: {sorted(missing_ad)}")
#     if missing_traffic:
#         raise ValueError(f"traffic.csv missing columns: {sorted(missing_traffic)}")

#     revenue_df = revenue_df[revenue_expected].copy()
#     ad_spend_df = ad_spend_df[ad_expected].copy()
#     traffic_df = traffic_df[traffic_expected].copy()

#     numeric_cols = {
#         "revenue": revenue_df,
#         "refunds": revenue_df,
#         "new_customers": revenue_df,
#         "churned_customers": revenue_df,
#         "google_spend": ad_spend_df,
#         "meta_spend": ad_spend_df,
#         "total_spend": ad_spend_df,
#         "sessions": traffic_df,
#         "conversions": traffic_df,
#         "conversion_rate": traffic_df,
#     }

#     for col, df in numeric_cols.items():
#         if col in df.columns:
#             df[col] = pd.to_numeric(df[col], errors="coerce")

#     return revenue_df, ad_spend_df, traffic_df


# def _compute_kpis(df: pd.DataFrame) -> pd.DataFrame:
#     """
#     Compute RevAgent KPI columns.
#     """
#     df = df.copy()

#     # Fill low-risk missing values
#     for col in [
#         "revenue",
#         "refunds",
#         "new_customers",
#         "churned_customers",
#         "google_spend",
#         "meta_spend",
#         "total_spend",
#         "sessions",
#         "conversions",
#     ]:
#         if col in df.columns:
#             df[col] = df[col].fillna(0)

#     # Ensure total spend exists
#     if "total_spend" not in df.columns or df["total_spend"].isna().all():
#         df["total_spend"] = df["google_spend"].fillna(0) + df["meta_spend"].fillna(0)

#     # Net revenue
#     df["net_revenue"] = (df["revenue"] - df["refunds"]).round(4)

#     # Refund rate
#     df["refund_rate"] = (
#         df["refunds"] / df["revenue"].replace(0, pd.NA)
#     ).fillna(0).round(4)

#     # Stable CAC: rolling 7-day spend / rolling 7-day new customers
#     rolling_7d_total_spend = df["total_spend"].rolling(window=7, min_periods=1).sum()
#     rolling_7d_new_customers = df["new_customers"].rolling(window=7, min_periods=1).sum()

#     df["CAC"] = (
#         rolling_7d_total_spend
#         / rolling_7d_new_customers.replace(0, pd.NA)
#     ).fillna(0).round(4)

#     # Active customer base proxy for churn
#     df["active_customers_30d"] = (
#         df["new_customers"].rolling(window=30, min_periods=7).sum()
#     )

#     df["churn_rate"] = (
#         df["churned_customers"]
#         / df["active_customers_30d"].replace(0, pd.NA)
#     ).fillna(0).clip(lower=0, upper=1).round(4)

#     # Prefer recalculated conversion rate for consistency
#     df["conversion_rate"] = (
#         df["conversions"] / df["sessions"].replace(0, pd.NA)
#     ).fillna(0).round(4)

#     # 7-day growth metrics
#     df["revenue_growth_7d"] = (
#         (df["net_revenue"] - df["net_revenue"].shift(7))
#         / df["net_revenue"].shift(7).replace(0, pd.NA)
#     ).fillna(0).round(4)

#     df["spend_change_7d"] = (
#         (df["total_spend"] - df["total_spend"].shift(7))
#         / df["total_spend"].shift(7).replace(0, pd.NA)
#     ).fillna(0).round(4)

#     return df



# def run_ingest() -> pd.DataFrame:
#     """
#     Load source CSVs, merge them, compute KPI columns, optionally preprocess,
#     save metrics.csv, and return the processed dataframe.
#     """
#     revenue_path = RAW_DIR / "revenue.csv"
#     ad_spend_path = RAW_DIR / "ad_spend.csv"
#     traffic_path = RAW_DIR / "traffic.csv"

#     revenue_df = _load_csv(revenue_path, "revenue.csv")
#     ad_spend_df = _load_csv(ad_spend_path, "ad_spend.csv")
#     traffic_df = _load_csv(traffic_path, "traffic.csv")

#     revenue_df, ad_spend_df, traffic_df = _prepare_inputs(
#         revenue_df,
#         ad_spend_df,
#         traffic_df,
#     )

#     df = revenue_df.merge(ad_spend_df, on="date", how="inner")
#     df = df.merge(traffic_df, on="date", how="inner")
#     df = df.sort_values("date").reset_index(drop=True)

#     print(f"Merged dataframe shape: {df.shape}")

#     df = _compute_kpis(df)

#     df = run_preprocess(df)
    
#     # Optional conditional stabilization layer
#     if callable(run_preprocess):
#         df = run_preprocess(df)

#     # Final sort / formatting
#     df = df.sort_values("date").reset_index(drop=True)

#     print(f"Min date: {df['date'].min().strftime('%Y-%m-%d')}")
#     print(f"Max date: {df['date'].max().strftime('%Y-%m-%d')}")
#     print(f"Total rows: {len(df)}")
#     print("\nFirst 5 rows:")
#     print(df.head())

#     PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

#     output_df = df.copy()
#     output_df["date"] = output_df["date"].dt.strftime("%Y-%m-%d")
#     output_df.to_csv(OUTPUT_PATH, index=False)

#     print(f"\nSaved to {OUTPUT_PATH} — {len(output_df)} rows")
#     return output_df


# if __name__ == "__main__":
#     run_ingest()











###newwwwww

from __future__ import annotations

from pathlib import Path

import pandas as pd

from agent.preprocess import run_preprocess


RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")
OUTPUT_PATH = PROCESSED_DIR / "metrics.csv"


def _load_csv(file_path: Path, file_label: str) -> pd.DataFrame:
    """
    Load a CSV, parse date column, and print row count.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Missing required file: {file_path}")

    df = pd.read_csv(file_path)
    if "date" not in df.columns:
        raise ValueError(f"{file_label} must contain a 'date' column.")

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

    print(f"Loaded {file_path.name} — {len(df)} rows")
    return df


def _prepare_inputs(
    revenue_df: pd.DataFrame,
    ad_spend_df: pd.DataFrame,
    traffic_df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Standardize expected input columns and coerce numerics.
    """
    revenue_expected = [
        "date",
        "revenue",
        "refunds",
        "new_customers",
        "churned_customers",
    ]
    ad_expected = [
        "date",
        "google_spend",
        "meta_spend",
        "total_spend",
    ]
    traffic_expected = [
        "date",
        "sessions",
        "conversions",
        "conversion_rate",
    ]

    missing_revenue = set(revenue_expected) - set(revenue_df.columns)
    missing_ad = set(ad_expected) - set(ad_spend_df.columns)
    missing_traffic = set(traffic_expected) - set(traffic_df.columns)

    if missing_revenue:
        raise ValueError(f"revenue.csv missing columns: {sorted(missing_revenue)}")
    if missing_ad:
        raise ValueError(f"ad_spend.csv missing columns: {sorted(missing_ad)}")
    if missing_traffic:
        raise ValueError(f"traffic.csv missing columns: {sorted(missing_traffic)}")

    revenue_df = revenue_df[revenue_expected].copy()
    ad_spend_df = ad_spend_df[ad_expected].copy()
    traffic_df = traffic_df[traffic_expected].copy()

    for col in ["revenue", "refunds", "new_customers", "churned_customers"]:
        revenue_df[col] = pd.to_numeric(revenue_df[col], errors="coerce")

    for col in ["google_spend", "meta_spend", "total_spend"]:
        ad_spend_df[col] = pd.to_numeric(ad_spend_df[col], errors="coerce")

    for col in ["sessions", "conversions", "conversion_rate"]:
        traffic_df[col] = pd.to_numeric(traffic_df[col], errors="coerce")

    return revenue_df, ad_spend_df, traffic_df


def _compute_kpis(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute RevAgent KPI columns from merged raw inputs.
    """
    out = df.copy()

    # Fill low-risk missing values
    for col in [
        "revenue",
        "refunds",
        "new_customers",
        "churned_customers",
        "google_spend",
        "meta_spend",
        "total_spend",
        "sessions",
        "conversions",
    ]:
        if col in out.columns:
            out[col] = out[col].fillna(0)

    # Ensure total_spend exists
    if "total_spend" not in out.columns or out["total_spend"].isna().all():
        out["total_spend"] = out["google_spend"].fillna(0) + out["meta_spend"].fillna(0)

    # Base KPIs
    out["net_revenue"] = (out["revenue"] - out["refunds"]).round(4)

    out["refund_rate"] = (
        out["refunds"] / out["revenue"].replace(0, pd.NA)
    ).fillna(0).round(4)

    # Rolling CAC
    rolling_7d_total_spend = out["total_spend"].rolling(window=7, min_periods=1).sum()
    rolling_7d_new_customers = out["new_customers"].rolling(window=7, min_periods=1).sum()

    out["CAC"] = (
        rolling_7d_total_spend / rolling_7d_new_customers.replace(0, pd.NA)
    ).fillna(0).round(4)

    # Active customer base proxy
    out["active_customers_30d"] = (
        out["new_customers"].rolling(window=30, min_periods=7).sum()
    )

    out["churn_rate"] = (
        out["churned_customers"] / out["active_customers_30d"].replace(0, pd.NA)
    ).fillna(0).clip(lower=0, upper=1).round(4)

    # Recalculate conversion rate from raw traffic
    out["conversion_rate"] = (
        out["conversions"] / out["sessions"].replace(0, pd.NA)
    ).fillna(0).round(4)

    # Growth metrics
    out["revenue_growth_7d"] = (
        (out["net_revenue"] - out["net_revenue"].shift(7))
        / out["net_revenue"].shift(7).replace(0, pd.NA)
    ).fillna(0).round(4)

    out["spend_change_7d"] = (
        (out["total_spend"] - out["total_spend"].shift(7))
        / out["total_spend"].shift(7).replace(0, pd.NA)
    ).fillna(0).round(4)

    return out


def run_ingest() -> pd.DataFrame:
    """
    Load source CSVs, merge them, compute KPI columns, preprocess,
    save metrics.csv, and return the processed dataframe.
    """
    revenue_path = RAW_DIR / "revenue.csv"
    ad_spend_path = RAW_DIR / "ad_spend.csv"
    traffic_path = RAW_DIR / "traffic.csv"

    revenue_df = _load_csv(revenue_path, "revenue.csv")
    ad_spend_df = _load_csv(ad_spend_path, "ad_spend.csv")
    traffic_df = _load_csv(traffic_path, "traffic.csv")

    revenue_df, ad_spend_df, traffic_df = _prepare_inputs(
        revenue_df,
        ad_spend_df,
        traffic_df,
    )

    df = revenue_df.merge(ad_spend_df, on="date", how="inner")
    df = df.merge(traffic_df, on="date", how="inner")
    df = df.sort_values("date").reset_index(drop=True)

    print(f"Merged dataframe shape: {df.shape}")

    df = _compute_kpis(df)
    df = run_preprocess(df)

    df = df.sort_values("date").reset_index(drop=True)

    print(f"Min date: {df['date'].min().strftime('%Y-%m-%d')}")
    print(f"Max date: {df['date'].max().strftime('%Y-%m-%d')}")
    print(f"Total rows: {len(df)}")
    print("\nFirst 5 rows:")
    print(df.head())

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    output_df = df.copy()
    output_df["date"] = output_df["date"].dt.strftime("%Y-%m-%d")
    output_df.to_csv(OUTPUT_PATH, index=False)

    print(f"\nSaved to {OUTPUT_PATH} — {len(output_df)} rows")
    return output_df


if __name__ == "__main__":
    run_ingest()