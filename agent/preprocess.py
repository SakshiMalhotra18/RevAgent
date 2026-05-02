# from __future__ import annotations

# import numpy as np
# import pandas as pd


# def _safe_numeric(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
#     """
#     Coerce listed columns to numeric if they exist.
#     """
#     df = df.copy()
#     for col in columns:
#         if col in df.columns:
#             df[col] = pd.to_numeric(df[col], errors="coerce")
#     return df


# def _winsorize_upper(series: pd.Series, upper_q: float = 0.99) -> pd.Series:
#     """
#     Winsorize only the upper tail of a series.
#     """
#     s = series.copy()
#     non_null = s.dropna()
#     if non_null.empty:
#         return s

#     upper = non_null.quantile(upper_q)
#     return s.clip(upper=upper)


# def _fill_stable(series: pd.Series) -> pd.Series:
#     """
#     Forward fill, backward fill, then median fill.
#     Keeps the series usable across different input datasets.
#     """
#     s = series.copy()
#     s = s.ffill().bfill()
#     if s.isna().any():
#         median_val = s.median()
#         if pd.isna(median_val):
#             median_val = 0
#         s = s.fillna(median_val)
#     return s


# def run_preprocess(df: pd.DataFrame) -> pd.DataFrame:
#     """
#     Generic preprocessing layer for RevAgent.

#     This function is designed to work across different input datasets as long
#     as the expected RevAgent KPI columns exist.

#     It conditionally stabilizes only these noisy metrics:
#     - refund_rate
#     - CAC
#     - churn_rate

#     It also adds:
#     - weekday
#     - is_weekend

#     Existing columns are preserved. Clean helper columns are added when useful.
#     """
#     if df is None or df.empty:
#         return df

#     out = df.copy()

#     # -----------------------------
#     # Basic date hygiene
#     # -----------------------------
#     if "date" not in out.columns:
#         raise ValueError("run_preprocess() requires a 'date' column.")

#     out["date"] = pd.to_datetime(out["date"], errors="coerce")
#     out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

#     # -----------------------------
#     # Numeric hygiene
#     # -----------------------------
#     out = _safe_numeric(
#         out,
#         [
#             "revenue",
#             "refunds",
#             "new_customers",
#             "churned_customers",
#             "total_spend",
#             "refund_rate",
#             "CAC",
#             "churn_rate",
#         ],
#     )

#     # -----------------------------
#     # Calendar helpers
#     # -----------------------------
#     out["weekday"] = out["date"].dt.day_name()
#     out["is_weekend"] = out["date"].dt.weekday >= 5

#     # =========================================================
#     # A) REFUND RATE
#     # refund_rate_raw = refunds / revenue
#     # if revenue < 5000 -> NaN
#     # winsorize upper tail at 99th percentile
#     # overwrite refund_rate
#     # =========================================================
#     if {"refunds", "revenue"}.issubset(out.columns):
#         out["refund_rate_raw"] = out["refunds"] / out["revenue"].replace(0, np.nan)

#         out["refund_rate_clean"] = np.where(
#             out["revenue"] >= 5000,
#             out["refund_rate_raw"],
#             np.nan,
#         )

#         out["refund_rate_clean"] = pd.Series(out["refund_rate_clean"], index=out.index)
#         out["refund_rate_clean"] = _winsorize_upper(out["refund_rate_clean"], upper_q=0.95)
#         out["refund_rate_clean"] = _fill_stable(out["refund_rate_clean"]).clip(lower=0)

#         out["refund_rate"] = out["refund_rate_clean"].round(4)

#     # =========================================================
#     # B) CAC
#     # rolling_7d_spend / rolling_7d_new_customers
#     # if rolling_7d_new_customers < 5 -> NaN
#     # overwrite CAC
#     # =========================================================
#     if {"total_spend", "new_customers"}.issubset(out.columns):
#         out["rolling_7d_spend"] = out["total_spend"].rolling(window=7, min_periods=1).sum()
#         out["rolling_7d_new_customers"] = out["new_customers"].rolling(window=7, min_periods=1).sum()

#         out["CAC_clean"] = np.where(
#             out["rolling_7d_new_customers"] >= 5,
#             out["rolling_7d_spend"] / out["rolling_7d_new_customers"].replace(0, np.nan),
#             np.nan,
#         )

#         out["CAC_clean"] = pd.Series(out["CAC_clean"], index=out.index)
#         out["CAC_clean"] = _fill_stable(out["CAC_clean"]).clip(lower=0)

#         out["CAC"] = out["CAC_clean"].round(4)

#     # =========================================================
#     # C) CHURN RATE
#     # active_customers_30d = rolling 30-day sum of new_customers
#     # if active_customers_30d < 50 -> NaN
#     # first 60 rows = NaN
#     # overwrite churn_rate
#     # =========================================================
#     if {"new_customers", "churned_customers"}.issubset(out.columns):
#         out["active_customers_30d"] = out["new_customers"].rolling(window=30, min_periods=1).sum()

#         out["churn_rate_clean"] = np.where(
#             out["active_customers_30d"] >= 50,
#             out["churned_customers"] / out["active_customers_30d"].replace(0, np.nan),
#             np.nan,
#         )

#         out["churn_rate_clean"] = pd.Series(out["churn_rate_clean"], index=out.index)

#         # Suppress unstable early period
#         if len(out) > 60:
#             out.loc[out.index[:60], "churn_rate_clean"] = np.nan

#         out["churn_rate_clean"] = out["churn_rate_clean"].ffill()
#         out["churn_rate_clean"] = out["churn_rate_clean"].clip(lower=0, upper=1)

#         out["churn_rate"] = out["churn_rate_clean"].round(4)

#     return out





########NEWWWWWWWWWWW


from __future__ import annotations

import numpy as np
import pandas as pd


def _safe_numeric(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """
    Coerce listed columns to numeric if they exist.
    """
    out = df.copy()
    for col in columns:
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce")
    return out


def _winsorize_upper(series: pd.Series, upper_q: float = 0.95) -> pd.Series:
    """
    Winsorize only the upper tail of a series.
    """
    s = series.copy()
    non_null = s.dropna()
    if non_null.empty:
        return s

    upper = non_null.quantile(upper_q)
    return s.clip(upper=upper)


def _fill_stable(series: pd.Series) -> pd.Series:
    """
    Forward fill, backward fill, then median fill.
    Safe for metrics where early NaNs should not be preserved.
    """
    s = series.copy()
    s = s.ffill().bfill()

    if s.isna().any():
        median_val = s.median()
        if pd.isna(median_val):
            median_val = 0
        s = s.fillna(median_val)

    return s


def run_preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generic preprocessing layer for RevAgent.

    Goals:
    - keep schema compatible with frontend/API
    - stabilize only noisy metrics
    - work across different input datasets
    - preserve most original columns untouched

    Metrics stabilized:
    - refund_rate
    - CAC
    - churn_rate

    Added helper columns:
    - weekday
    - is_weekend
    - refund_rate_raw
    - refund_rate_clean
    - rolling_7d_spend
    - rolling_7d_new_customers
    - CAC_clean
    - active_customers_30d
    - churn_rate_clean
    """
    if df is None or df.empty:
        return df

    out = df.copy()

    if "date" not in out.columns:
        raise ValueError("run_preprocess() requires a 'date' column.")

    # -----------------------------
    # Date hygiene
    # -----------------------------
    out["date"] = pd.to_datetime(out["date"], errors="coerce")
    out = out.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

    # -----------------------------
    # Numeric hygiene
    # -----------------------------
    out = _safe_numeric(
        out,
        [
            "revenue",
            "refunds",
            "new_customers",
            "churned_customers",
            "google_spend",
            "meta_spend",
            "total_spend",
            "sessions",
            "conversions",
            "conversion_rate",
            "net_revenue",
            "refund_rate",
            "CAC",
            "churn_rate",
            "revenue_growth_7d",
            "spend_change_7d",
        ],
    )

    # -----------------------------
    # Calendar helpers
    # -----------------------------
    out["weekday"] = out["date"].dt.day_name()
    out["is_weekend"] = out["date"].dt.weekday >= 5

    # =========================================================
    # A) refund_rate stabilization
    # =========================================================
    if {"refunds", "revenue"}.issubset(out.columns):
        out["refund_rate_raw"] = out["refunds"] / out["revenue"].replace(0, np.nan)

        out["refund_rate_clean"] = np.where(
            out["revenue"] >= 5000,
            out["refund_rate_raw"],
            np.nan,
        )

        out["refund_rate_clean"] = pd.Series(out["refund_rate_clean"], index=out.index)
        out["refund_rate_clean"] = _winsorize_upper(out["refund_rate_clean"], upper_q=0.95)
        out["refund_rate_clean"] = _fill_stable(out["refund_rate_clean"]).clip(lower=0)

        out["refund_rate"] = out["refund_rate_clean"].round(4)

    # =========================================================
    # B) CAC stabilization
    # =========================================================
    if {"total_spend", "new_customers"}.issubset(out.columns):
        out["rolling_7d_spend"] = out["total_spend"].rolling(window=7, min_periods=1).sum()
        out["rolling_7d_new_customers"] = out["new_customers"].rolling(window=7, min_periods=1).sum()

        out["CAC_clean"] = np.where(
            out["rolling_7d_new_customers"] >= 5,
            out["rolling_7d_spend"] / out["rolling_7d_new_customers"].replace(0, np.nan),
            np.nan,
        )

        out["CAC_clean"] = pd.Series(out["CAC_clean"], index=out.index)
        out["CAC_clean"] = _fill_stable(out["CAC_clean"]).clip(lower=0)

        out["CAC"] = out["CAC_clean"].round(4)

    # =========================================================
    # C) churn_rate stabilization
    # =========================================================
    if {"new_customers", "churned_customers"}.issubset(out.columns):
        out["active_customers_30d"] = out["new_customers"].rolling(window=30, min_periods=1).sum()

        out["churn_rate_clean"] = np.where(
            out["active_customers_30d"] >= 50,
            out["churned_customers"] / out["active_customers_30d"].replace(0, np.nan),
            np.nan,
        )

        out["churn_rate_clean"] = pd.Series(out["churn_rate_clean"], index=out.index)

        # suppress unstable early history
        if len(out) > 60:
            out.loc[out.index[:60], "churn_rate_clean"] = np.nan

        # keep early NaNs; only forward fill once real values begin
        out["churn_rate_clean"] = out["churn_rate_clean"].ffill()
        out["churn_rate_clean"] = out["churn_rate_clean"].clip(lower=0, upper=1)

        out["churn_rate"] = out["churn_rate_clean"].round(4)

    return out