"""
Prepare RevAgent-ready CSVs from the UCI Online Retail II dataset.

Expected raw input columns:
- InvoiceNo
- StockCode
- Description
- Quantity
- InvoiceDate
- Price
- CustomerID
- Country

Outputs:
- data/raw/real_revenue.csv
- data/raw/real_ad_spend.csv
- data/raw/real_traffic.csv
"""

from __future__ import annotations

from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd


RAW_INPUT_PATH = Path("data/raw/online_retail_ii.csv")
OUTPUT_DIR = Path("data/raw")

REVENUE_OUTPUT_PATH = OUTPUT_DIR / "real_revenue.csv"
AD_SPEND_OUTPUT_PATH = OUTPUT_DIR / "real_ad_spend.csv"
TRAFFIC_OUTPUT_PATH = OUTPUT_DIR / "real_traffic.csv"

START_DATE = pd.Timestamp("2010-12-01")
END_DATE = pd.Timestamp("2011-12-01")  # exclusive upper bound
MIN_TRANSACTIONS_PER_DAY = 5
CHURN_LOOKBACK_DAYS = 30
SEED = 42


def load_and_clean_data(input_path: Path) -> pd.DataFrame:
    """
    Load raw retail data, filter to UK and target date window, and standardize types.
    """
    if not input_path.exists():
        raise FileNotFoundError(
            f"ERROR: Raw dataset not found at {input_path}. "
            f"Place your UCI dataset there or update RAW_INPUT_PATH in this script."
        )

    df = pd.read_csv(input_path)
    df = df.copy()
    df.columns = df.columns.str.strip()

    # Normalize common UCI column name variants
    rename_map = {
        "Invoice": "InvoiceNo",
        "Invoice No": "InvoiceNo",
        "InvoiceNo": "InvoiceNo",
        "Customer ID": "CustomerID",
        "CustomerID": "CustomerID",
    }
    df = df.rename(columns=rename_map)

    required_columns = {
        "InvoiceNo",
        "StockCode",
        "Description",
        "Quantity",
        "InvoiceDate",
        "Price",
        "CustomerID",
        "Country",
    }
    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(
            f"ERROR: Missing required columns after normalization: {sorted(missing)}. "
            f"Actual columns found: {df.columns.tolist()}"
        )

    df["InvoiceNo"] = df["InvoiceNo"].astype(str).str.strip()
    df["Country"] = df["Country"].astype(str).str.strip()
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"], errors="coerce")
    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")
    df["Price"] = pd.to_numeric(df["Price"], errors="coerce")
    df["CustomerID"] = pd.to_numeric(df["CustomerID"], errors="coerce")

    df = df.dropna(
        subset=[
            "InvoiceDate",
            "Quantity",
            "Price",
            "CustomerID",
            "InvoiceNo",
            "Country",
        ]
    )

    df = df[df["Country"] == "United Kingdom"].copy()
    df = df[(df["InvoiceDate"] >= START_DATE) & (df["InvoiceDate"] < END_DATE)].copy()

    # Keep positive prices only. Refund behavior comes from cancelled invoice numbers.
    df = df[df["Price"] > 0].copy()

    df["date"] = df["InvoiceDate"].dt.floor("D")
    df["line_amount"] = df["Quantity"] * df["Price"]
    df["is_refund"] = df["InvoiceNo"].str.startswith("C")

    return df


def get_valid_dates(df: pd.DataFrame) -> pd.DatetimeIndex:
    """
    Keep only days with at least MIN_TRANSACTIONS_PER_DAY rows.
    """
    txn_counts = df.groupby("date").size()
    valid_dates = txn_counts[txn_counts >= MIN_TRANSACTIONS_PER_DAY].index
    return pd.DatetimeIndex(valid_dates).sort_values()


def build_revenue_df(df: pd.DataFrame, valid_dates: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Build revenue.csv with revenue, refunds, new_customers, and churned_customers.
    """
    daily_sales = (
        df.loc[~df["is_refund"]]
        .groupby("date", as_index=False)["line_amount"]
        .sum()
        .rename(columns={"line_amount": "revenue"})
    )

    daily_refunds = (
        df.loc[df["is_refund"]]
        .groupby("date", as_index=False)["line_amount"]
        .sum()
        .assign(line_amount=lambda x: x["line_amount"].abs())
        .rename(columns={"line_amount": "refunds"})
    )

    # First-ever purchase date uses non-refund purchases only.
    purchases = df.loc[~df["is_refund"], ["CustomerID", "date"]].drop_duplicates().copy()
    first_purchase = (
        purchases.groupby("CustomerID", as_index=False)["date"]
        .min()
        .rename(columns={"date": "first_purchase_date"})
    )

    new_customers = (
        first_purchase.groupby("first_purchase_date", as_index=False)
        .size()
        .rename(columns={"first_purchase_date": "date", "size": "new_customers"})
    )

    revenue_df = pd.DataFrame({"date": valid_dates})
    revenue_df = revenue_df.merge(daily_sales, on="date", how="left")
    revenue_df = revenue_df.merge(daily_refunds, on="date", how="left")
    revenue_df = revenue_df.merge(new_customers, on="date", how="left")

    revenue_df["revenue"] = revenue_df["revenue"].fillna(0.0)
    revenue_df["refunds"] = revenue_df["refunds"].fillna(0.0)
    revenue_df["new_customers"] = revenue_df["new_customers"].fillna(0).astype(int)

    # Rolling churn proxy:
    # customers who purchased in previous 30 days window, but not in current last 30 days window.
    purchase_dates_by_customer = (
        purchases.groupby("CustomerID")["date"]
        .apply(lambda s: sorted(pd.to_datetime(s).unique()))
        .to_dict()
    )

    churn_counts = []
    for current_date in revenue_df["date"]:
        prev_window_start = current_date - pd.Timedelta(days=60)
        prev_window_end = current_date - pd.Timedelta(days=30)
        current_window_start = current_date - pd.Timedelta(days=30)
        current_window_end = current_date

        churned_count = 0

        for customer_dates in purchase_dates_by_customer.values():
            had_prev = any(prev_window_start <= d < prev_window_end for d in customer_dates)
            had_current = any(current_window_start <= d < current_window_end for d in customer_dates)

            if had_prev and not had_current:
                churned_count += 1

        churn_counts.append(churned_count)

    revenue_df["churned_customers"] = churn_counts

    revenue_df = revenue_df.sort_values("date").reset_index(drop=True)
    revenue_df["date"] = revenue_df["date"].dt.strftime("%Y-%m-%d")
    revenue_df["revenue"] = revenue_df["revenue"].round(2)
    revenue_df["refunds"] = revenue_df["refunds"].round(2)

    return revenue_df[
        ["date", "revenue", "refunds", "new_customers", "churned_customers"]
    ]


def build_ad_spend_df(revenue_df: pd.DataFrame) -> pd.DataFrame:
    """
    Build ad_spend.csv using correlated proxy spend.
    """
    rng = np.random.default_rng(SEED)

    ad_df = revenue_df[["date", "revenue"]].copy()
    base_total = ad_df["revenue"] * 0.15

    google_noise = rng.uniform(0.95, 1.05, size=len(ad_df))
    meta_noise = rng.uniform(0.95, 1.05, size=len(ad_df))

    raw_google = base_total * 0.60 * google_noise
    raw_meta = base_total * 0.40 * meta_noise

    ad_df["google_spend"] = raw_google.round(2)
    ad_df["meta_spend"] = raw_meta.round(2)
    ad_df["total_spend"] = (ad_df["google_spend"] + ad_df["meta_spend"]).round(2)

    return ad_df[["date", "google_spend", "meta_spend", "total_spend"]]


def build_traffic_df(df: pd.DataFrame, valid_dates: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Build traffic.csv using correlated proxy traffic.
    """
    rng = np.random.default_rng(SEED)

    # Use non-refund invoices for conversions.
    sales_only = df.loc[~df["is_refund"]].copy()

    conversions = (
        sales_only.groupby("date", as_index=False)["InvoiceNo"]
        .nunique()
        .rename(columns={"InvoiceNo": "conversions"})
    )

    traffic_df = pd.DataFrame({"date": valid_dates})
    traffic_df = traffic_df.merge(conversions, on="date", how="left")
    traffic_df["conversions"] = traffic_df["conversions"].fillna(0).astype(int)

    base_sessions = traffic_df["conversions"] / 0.035
    session_noise = rng.uniform(0.92, 1.08, size=len(traffic_df))

    traffic_df["sessions"] = np.maximum(1, np.round(base_sessions * session_noise)).astype(int)
    traffic_df["conversion_rate"] = (traffic_df["conversions"] / traffic_df["sessions"]).round(4)

    traffic_df = traffic_df.sort_values("date").reset_index(drop=True)
    traffic_df["date"] = traffic_df["date"].dt.strftime("%Y-%m-%d")

    return traffic_df[["date", "sessions", "conversions", "conversion_rate"]]


def save_outputs(
    revenue_df: pd.DataFrame,
    ad_spend_df: pd.DataFrame,
    traffic_df: pd.DataFrame,
) -> None:
    """
    Save all output CSV files.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    revenue_df.to_csv(REVENUE_OUTPUT_PATH, index=False)
    ad_spend_df.to_csv(AD_SPEND_OUTPUT_PATH, index=False)
    traffic_df.to_csv(TRAFFIC_OUTPUT_PATH, index=False)


def print_summary(name: str, df: pd.DataFrame) -> None:
    """
    Print shape, date range, and head for one output dataframe.
    """
    print(f"\n{name}")
    print(f"Shape: {df.shape}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(df.head())


def main() -> None:
    """
    Main pipeline for preparing RevAgent-compatible real data files.
    """
    df = load_and_clean_data(RAW_INPUT_PATH)
    valid_dates = get_valid_dates(df)

    df = df[df["date"].isin(valid_dates)].copy()

    revenue_df = build_revenue_df(df, valid_dates)
    ad_spend_df = build_ad_spend_df(revenue_df)
    traffic_df = build_traffic_df(df, valid_dates)

    save_outputs(revenue_df, ad_spend_df, traffic_df)

    print_summary("real_revenue.csv", revenue_df)
    print_summary("real_ad_spend.csv", ad_spend_df)
    print_summary("real_traffic.csv", traffic_df)

    print("\nSaved files:")
    print(REVENUE_OUTPUT_PATH)
    print(AD_SPEND_OUTPUT_PATH)
    print(TRAFFIC_OUTPUT_PATH)


if __name__ == "__main__":
    main()