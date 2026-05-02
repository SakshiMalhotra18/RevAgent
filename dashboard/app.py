import sys
from pathlib import Path
from typing import Any

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

sys.path.append(str(Path(__file__).parent.parent))

from agent.ingest import run_ingest
from agent.detect import run_detect
from agent.analyze import run_analyze, PROVIDER


st.set_page_config(
    page_title="RevAgent — Revenue Intelligence",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
        :root {
            --bg: #0b1220;
            --panel: #111827;
            --panel-2: #0f172a;
            --border: #243041;
            --text: #f8fafc;
            --muted: #94a3b8;
            --green: #10b981;
            --yellow: #f59e0b;
            --red: #ef4444;
            --blue: #3b82f6;
        }

        .stApp {
            background: linear-gradient(180deg, #08111f 0%, #0b1220 100%);
        }

        .block-container {
            padding-top: 1.2rem;
            padding-bottom: 1.2rem;
            padding-left: 1.4rem;
            padding-right: 1.4rem;
            max-width: 100%;
        }

        [data-testid="stSidebar"] {
            background: linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.95) 100%);
            border-right: 1px solid rgba(148,163,184,0.12);
        }

        /* Hide Streamlit chrome */
        [data-testid="stToolbar"],
        [data-testid="stDecoration"],
        [data-testid="stStatusWidget"],
        header {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
        }

        /* Tabs */
        button[data-baseweb="tab"] {
            color: #cbd5e1 !important;
            font-weight: 600 !important;
            border-radius: 10px 10px 0 0 !important;
        }

        button[data-baseweb="tab"][aria-selected="true"] {
            color: #ffffff !important;
        }

        .section-header {
            font-size: 1.45rem;
            font-weight: 800;
            color: var(--text);
            margin-top: 0.35rem;
            margin-bottom: 0.85rem;
            letter-spacing: -0.02em;
        }

        .welcome-title {
            font-size: 2.5rem;
            font-weight: 900;
            color: var(--text);
            margin-bottom: 0.2rem;
            letter-spacing: -0.03em;
        }

        .welcome-subtitle {
            font-size: 1.05rem;
            color: var(--muted);
            margin-bottom: 1.25rem;
        }

        .hero {
            border: 1px solid rgba(148,163,184,0.14);
            background: linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.92) 100%);
            border-radius: 22px;
            padding: 1.25rem 1.25rem 1rem 1.25rem;
            margin-bottom: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.18);
        }

        .sample-card {
            border: 1px solid rgba(148,163,184,0.15);
            border-radius: 18px;
            padding: 1rem;
            background: rgba(17,24,39,0.92);
            box-shadow: 0 4px 16px rgba(0,0,0,0.14);
            min-height: 110px;
        }

        .sample-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 0.45rem;
        }

        .sample-body {
            color: var(--muted);
            font-size: 0.93rem;
            line-height: 1.55;
        }

        .small-muted {
            color: var(--muted);
            font-size: 0.92rem;
        }

        .badge {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 800;
            color: white;
            margin-bottom: 0.55rem;
            letter-spacing: 0.01em;
        }

        .tag {
            display: inline-block;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            font-size: 0.78rem;
            margin-right: 0.35rem;
            margin-top: 0.25rem;
            background: #1e293b;
            color: #e2e8f0 !important;
            border: 1px solid rgba(148,163,184,0.14);
        }

        .report-card {
            border: 1px solid rgba(148,163,184,0.14);
            border-radius: 18px;
            padding: 1rem 1rem 0.9rem 1rem;
            background: linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(15,23,42,0.96) 100%);
            margin-bottom: 0.95rem;
            box-shadow: 0 6px 18px rgba(0,0,0,0.14);
            color: var(--text);
        }

        .report-title {
            font-size: 1.03rem;
            font-weight: 800;
            color: var(--text) !important;
            margin-bottom: 0.35rem;
            line-height: 1.45;
        }

        .report-evidence {
            color: var(--muted) !important;
            font-size: 0.93rem;
            line-height: 1.55;
            margin-bottom: 0.45rem;
        }

        .report-impact {
            color: #cbd5e1 !important;
            font-size: 0.92rem;
            line-height: 1.5;
            margin-top: 0.45rem;
        }

        .metric-caption {
            color: var(--muted);
            font-size: 0.84rem;
            margin-top: -0.35rem;
        }

        .alert-card {
            border: 1px solid rgba(148,163,184,0.14);
            border-radius: 16px;
            padding: 0.9rem 1rem;
            background: rgba(15,23,42,0.92);
            margin-bottom: 0.7rem;
        }

        .alert-title {
            color: var(--text);
            font-weight: 700;
            margin-bottom: 0.2rem;
        }

        .alert-sub {
            color: var(--muted);
            font-size: 0.9rem;
        }

        .sidebar-brand {
            font-size: 2rem;
            font-weight: 900;
            color: white;
            letter-spacing: -0.03em;
            margin-bottom: 0.2rem;
        }

        .sidebar-tagline {
            color: var(--muted);
            font-size: 0.95rem;
            margin-bottom: 1rem;
        }

        .provider-pill {
            border-radius: 14px;
            padding: 0.8rem 0.9rem;
            font-weight: 700;
            border: 1px solid rgba(148,163,184,0.1);
        }

        .provider-green {
            background: rgba(16,185,129,0.14);
            color: #6ee7b7;
        }

        .provider-yellow {
            background: rgba(245,158,11,0.14);
            color: #fcd34d;
        }

        .download-note {
            color: var(--muted);
            font-size: 0.92rem;
            margin-top: 0.2rem;
            margin-bottom: 1rem;
        }

        /* Fix light tables in dark theme */
        .stDataFrame, .stTable {
            border-radius: 14px;
            overflow: hidden;
        }
    </style>
    """,
    unsafe_allow_html=True,
)


def init_session_state() -> None:
    """
    Initialize session state keys.
    """
    defaults = {
        "df": None,
        "anomalies": None,
        "report": None,
        "analysis_run": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def format_currency(val: Any) -> str:
    """
    Format numeric value as currency string.
    """
    try:
        return f"${float(val):,.0f}"
    except Exception:
        return "$0"


def format_pct(val: Any) -> str:
    """
    Format numeric ratio as percentage string.
    """
    try:
        val = float(val)
        if abs(val) <= 1.5:
            val *= 100
        return f"{val:.1f}%"
    except Exception:
        return "0.0%"


def get_severity_color(severity: str) -> str:
    """
    Map anomaly severity to color.
    """
    mapping = {
        "high": "#ef4444",
        "medium": "#f59e0b",
        "low": "#64748b",
    }
    return mapping.get(str(severity).lower(), "#64748b")


def get_urgency_color(urgency: str) -> str:
    """
    Map action urgency to color.
    """
    mapping = {
        "now": "#ef4444",
        "this_week": "#f59e0b",
        "monitor": "#64748b",
    }
    return mapping.get(str(urgency).lower(), "#64748b")


def save_uploaded_files(rev, ads, traffic) -> None:
    """
    Save uploaded CSV files into data/raw/.
    """
    raw_dir = Path("data/raw")
    raw_dir.mkdir(parents=True, exist_ok=True)

    files = [
        (rev, "revenue.csv"),
        (ads, "ad_spend.csv"),
        (traffic, "traffic.csv"),
    ]

    for uploaded_file, target_name in files:
        if uploaded_file is not None:
            with open(raw_dir / target_name, "wb") as f:
                f.write(uploaded_file.getbuffer())


def generate_sample_csvs() -> dict[str, bytes]:
    """
    Generate inline sample CSV files for download.
    """
    dates = pd.date_range("2026-03-01", periods=14, freq="D")

    revenue_df = pd.DataFrame(
        {
            "date": dates.strftime("%Y-%m-%d"),
            "revenue": [12000, 12150, 11800, 11600, 9500, 9600, 9700, 11850, 12050, 12200, 12300, 12180, 12220, 12400],
            "refunds": [500, 520, 510, 540, 820, 840, 860, 560, 550, 530, 520, 510, 505, 500],
            "new_customers": [80, 82, 78, 76, 55, 56, 57, 74, 79, 81, 83, 80, 82, 84],
            "churned_customers": [15, 15, 16, 16, 18, 18, 19, 16, 15, 15, 15, 16, 15, 14],
        }
    )

    ad_df = pd.DataFrame(
        {
            "date": dates.strftime("%Y-%m-%d"),
            "google_spend": [1400, 1420, 1390, 1410, 25, 20, 18, 1395, 1415, 1430, 1445, 1450, 1438, 1460],
            "meta_spend": [900, 910, 890, 905, 10, 12, 9, 895, 905, 915, 920, 918, 910, 925],
            "total_spend": [2300, 2330, 2280, 2315, 35, 32, 27, 2290, 2320, 2345, 2365, 2368, 2348, 2385],
        }
    )

    traffic_df = pd.DataFrame(
        {
            "date": dates.strftime("%Y-%m-%d"),
            "sessions": [3200, 3250, 3180, 3150, 2300, 2250, 2280, 3100, 3190, 3240, 3260, 3275, 3255, 3290],
            "conversions": [125, 127, 121, 118, 70, 69, 68, 116, 120, 124, 126, 127, 125, 128],
            "conversion_rate": [0.0391, 0.0391, 0.0381, 0.0375, 0.0304, 0.0307, 0.0298, 0.0374, 0.0376, 0.0383, 0.0387, 0.0388, 0.0384, 0.0389],
        }
    )

    return {
        "revenue.csv": revenue_df.to_csv(index=False).encode("utf-8"),
        "ad_spend.csv": ad_df.to_csv(index=False).encode("utf-8"),
        "traffic.csv": traffic_df.to_csv(index=False).encode("utf-8"),
    }


def run_pipeline() -> None:
    """
    Run ingest, detect, analyze, and save outputs in session state.
    """
    try:
        df = run_ingest()
    except Exception as exc:
        st.error(f"Data error: {exc}. Check CSV format.")
        return

    try:
        anomalies = run_detect()
    except Exception as exc:
        st.error(f"Detection error: {exc}")
        return

    report = None
    try:
        report = run_analyze()
    except Exception as exc:
        st.warning(f"AI analysis failed. Showing raw anomalies only. Details: {exc}")

    st.session_state.df = df
    st.session_state.anomalies = anomalies if anomalies is not None else []
    st.session_state.report = report
    st.session_state.analysis_run = True


def render_sidebar():
    """
    Render sidebar and return uploads + button state.
    """
    with st.sidebar:
        st.markdown("<div class='sidebar-brand'>RevAgent</div>", unsafe_allow_html=True)
        st.markdown("<div class='sidebar-tagline'>Daily AI analyst for founders</div>", unsafe_allow_html=True)
        st.divider()

        revenue_file = st.file_uploader("Upload revenue.csv", type=["csv"], key="revenue_upload")
        ad_file = st.file_uploader("Upload ad_spend.csv", type=["csv"], key="ad_upload")
        traffic_file = st.file_uploader("Upload traffic.csv", type=["csv"], key="traffic_upload")

        run_clicked = st.button("Run Analysis", type="primary", use_container_width=True)

        st.divider()

        if PROVIDER == "groq":
            st.markdown(
                "<div class='provider-pill provider-green'>LLM: Groq (llama-3.1-8b)</div>",
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                "<div class='provider-pill provider-yellow'>LLM: Mock (rule-based)</div>",
                unsafe_allow_html=True,
            )

        st.divider()
        st.caption("Built with Streamlit + Groq")

    return revenue_file, ad_file, traffic_file, run_clicked


def render_welcome() -> None:
    """
    Render welcome screen before upload/run.
    """
    st.markdown(
        """
        <div class='hero'>
            <div class='welcome-title'>Revenue Intelligence for Startups</div>
            <div class='welcome-subtitle'>Upload your CSVs to get your daily AI analyst report</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    c1, c2, c3 = st.columns(3)

    with c1:
        st.markdown(
            """
            <div class='sample-card'>
                <div class='sample-title'>revenue.csv</div>
                <div class='sample-body'>date, revenue, refunds, new_customers, churned_customers</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c2:
        st.markdown(
            """
            <div class='sample-card'>
                <div class='sample-title'>ad_spend.csv</div>
                <div class='sample-body'>date, google_spend, meta_spend, total_spend</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:
        st.markdown(
            """
            <div class='sample-card'>
                <div class='sample-title'>traffic.csv</div>
                <div class='sample-body'>date, sessions, conversions, conversion_rate</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<div class='download-note'><b>Don't have real data?</b> Download sample CSVs below</div>", unsafe_allow_html=True)

    samples = generate_sample_csvs()
    d1, d2, d3 = st.columns(3)
    with d1:
        st.download_button("Download sample revenue.csv", data=samples["revenue.csv"], file_name="revenue.csv", mime="text/csv")
    with d2:
        st.download_button("Download sample ad_spend.csv", data=samples["ad_spend.csv"], file_name="ad_spend.csv", mime="text/csv")
    with d3:
        st.download_button("Download sample traffic.csv", data=samples["traffic.csv"], file_name="traffic.csv", mime="text/csv")


def _get_anomaly_dates(anomalies) -> list[pd.Timestamp]:
    """
    Extract anomaly dates from anomaly list.
    """
    if not anomalies:
        return []

    dates = sorted(
        {
            pd.to_datetime(a["date"])
            for a in anomalies
            if isinstance(a, dict) and a.get("date")
        }
    )
    return dates


def render_overview(df: pd.DataFrame, anomalies: list[dict], report: dict | None) -> None:
    """
    Render overview tab.
    """
    st.markdown("<div class='section-header'>Overview</div>", unsafe_allow_html=True)

    if report and report.get("summary"):
        st.info(f"**AI Summary**  \n{report['summary']}")
    else:
        st.info("**AI Summary**  \nAI analysis unavailable. Showing metrics and anomalies only.")

    if df is None or df.empty:
        st.warning("No processed data available.")
        return

    last_row = df.iloc[-1]
    prev_7 = df.iloc[-8] if len(df) >= 8 else df.iloc[0]

    col1, col2, col3, col4 = st.columns(4)

    net_rev_delta = float(last_row["net_revenue"]) - float(prev_7["net_revenue"])
    refund_rate_delta = (float(last_row["refund_rate"]) - float(prev_7["refund_rate"])) * 100
    cac_delta = float(last_row["CAC"]) - float(prev_7["CAC"])
    churn_delta = (float(last_row["churn_rate"]) - float(prev_7["churn_rate"])) * 100

    with col1:
        st.metric("Net Revenue", format_currency(last_row["net_revenue"]), f"{net_rev_delta:+,.0f}")
        st.markdown("<div class='metric-caption'>vs 7 days ago</div>", unsafe_allow_html=True)

    with col2:
        st.metric("Refund Rate", format_pct(last_row["refund_rate"]), f"{refund_rate_delta:+.1f}%", delta_color="inverse")
        st.markdown("<div class='metric-caption'>Higher is worse</div>", unsafe_allow_html=True)

    with col3:
        st.metric("CAC", format_currency(last_row["CAC"]), f"{cac_delta:+,.0f}", delta_color="inverse")
        st.markdown("<div class='metric-caption'>Higher is worse</div>", unsafe_allow_html=True)

    with col4:
        st.metric("Churn Rate", format_pct(last_row["churn_rate"]), f"{churn_delta:+.1f}%", delta_color="inverse")
        st.markdown("<div class='metric-caption'>Higher is worse</div>", unsafe_allow_html=True)

    st.markdown("<div class='section-header'>Anomaly Alerts</div>", unsafe_allow_html=True)

    if anomalies:
        st.warning(f"⚠ {len(anomalies)} anomalies detected in last 7 days")
        for anomaly in anomalies:
            severity = anomaly.get("severity", "low").upper()
            metric = anomaly.get("metric", "")
            direction = anomaly.get("direction", "")
            change_pct = abs(float(anomaly.get("change_pct", 0)))
            st.markdown(
                f"""
                <div class='alert-card'>
                    <span class='badge' style='background:{get_severity_color(anomaly.get("severity", "low"))};'>{severity}</span>
                    <div class='alert-title'>{metric}</div>
                    <div class='alert-sub'>{direction} {change_pct:.1f}% vs rolling average</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
    else:
        st.success("No anomalies detected. Metrics look healthy.")


def _add_anomaly_markers(fig, anomaly_dates: list[pd.Timestamp]):
    """
    Add anomaly markers and region shading.
    """
    if not anomaly_dates:
        return

    for date in anomaly_dates:
        fig.add_vline(x=date, line_dash="dash", line_color="#ef4444", line_width=1)

    if len(anomaly_dates) >= 2:
        fig.add_vrect(
            x0=min(anomaly_dates),
            x1=max(anomaly_dates),
            fillcolor="#ef4444",
            opacity=0.08,
            line_width=0,
        )


def render_charts(df: pd.DataFrame, anomalies: list[dict]) -> None:
    """
    Render charts tab.
    """
    st.markdown("<div class='section-header'>Charts</div>", unsafe_allow_html=True)

    if df is None or df.empty:
        st.warning("No chart data available.")
        return

    chart_df = df.copy()
    chart_df["date"] = pd.to_datetime(chart_df["date"])
    anomaly_dates = _get_anomaly_dates(anomalies)

    fig1 = px.line(chart_df, x="date", y="net_revenue", title="Net Revenue — 90 Day Trend")
    _add_anomaly_markers(fig1, anomaly_dates)
    fig1.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(255,255,255,0.02)",
        title_font_size=18,
    )
    fig1.update_yaxes(showgrid=True, gridcolor="rgba(255,255,255,0.06)")
    st.plotly_chart(fig1, use_container_width=True)

    fig2 = px.line(chart_df, x="date", y="refund_rate", title="Refund Rate Trend")
    _add_anomaly_markers(fig2, anomaly_dates)
    fig2.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(255,255,255,0.02)",
        title_font_size=18,
    )
    fig2.update_yaxes(showgrid=True, gridcolor="rgba(255,255,255,0.06)")
    st.plotly_chart(fig2, use_container_width=True)

    fig3 = make_subplots(specs=[[{"secondary_y": True}]])
    fig3.add_trace(
        go.Bar(
            x=chart_df["date"],
            y=chart_df["total_spend"],
            name="Total Spend",
            marker_color="rgba(148,163,184,0.55)",
        ),
        secondary_y=False,
    )
    fig3.add_trace(
        go.Scatter(
            x=chart_df["date"],
            y=chart_df["net_revenue"],
            name="Net Revenue",
            mode="lines",
            line=dict(color="#60a5fa", width=3),
        ),
        secondary_y=True,
    )
    fig3.update_layout(
        title="Ad Spend vs Net Revenue",
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(255,255,255,0.02)",
        title_font_size=18,
    )
    fig3.update_yaxes(title_text="Total Spend", secondary_y=False, showgrid=True, gridcolor="rgba(255,255,255,0.06)")
    fig3.update_yaxes(title_text="Net Revenue", secondary_y=True, showgrid=False)
    st.plotly_chart(fig3, use_container_width=True)

    rolling_mean = chart_df["CAC"].rolling(window=30, min_periods=1).mean()
    fig4 = go.Figure()
    fig4.add_trace(go.Scatter(x=chart_df["date"], y=chart_df["CAC"], mode="lines", name="CAC", line=dict(color="#34d399", width=3)))
    fig4.add_trace(
        go.Scatter(
            x=chart_df["date"],
            y=rolling_mean,
            mode="lines",
            name="30-Day Mean",
            line=dict(color="#f59e0b", dash="dash", width=2),
        )
    )
    fig4.update_layout(
        title="Customer Acquisition Cost",
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(255,255,255,0.02)",
        title_font_size=18,
    )
    fig4.update_yaxes(showgrid=True, gridcolor="rgba(255,255,255,0.06)")
    st.plotly_chart(fig4, use_container_width=True)


def render_report(report: dict | None) -> None:
    """
    Render AI report tab.
    """
    st.markdown("<div class='section-header'>AI Report</div>", unsafe_allow_html=True)

    if not report:
        st.warning("AI analysis failed. Showing raw anomalies only.")
        return

    st.markdown("### WHAT CHANGED")
    changes_df = pd.DataFrame(report.get("changes", []))
    if not changes_df.empty:
        st.dataframe(changes_df, use_container_width=True, hide_index=True)
    else:
        st.info("No changes returned.")

    st.markdown("### WHY IT HAPPENED (Drivers)")
    for driver in report.get("drivers", []):
        confidence = str(driver.get("confidence", "low")).lower()
        badge_color = get_severity_color("high" if confidence == "high" else "medium" if confidence == "medium" else "low")
        tags = "".join([f"<span class='tag'>{m}</span>" for m in driver.get("supporting_metrics", [])])

        st.markdown(
            f"""
            <div class='report-card'>
                <span class='badge' style='background:{badge_color};'>{confidence.upper()}</span>
                <div class='report-title'>{driver.get("hypothesis", "")}</div>
                <div class='report-evidence'>{driver.get("evidence", "")}</div>
                <div>{tags}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("### PRIORITY ACTIONS")
    for action in report.get("actions", []):
        urgency = str(action.get("urgency", "monitor")).lower()
        badge_color = get_urgency_color(urgency)

        st.markdown(
            f"""
            <div class='report-card'>
                <span class='badge' style='background:{badge_color};'>{urgency.upper()}</span>
                <div class='report-title'>{action.get("action", "")}</div>
                <div><span class='tag'>{action.get("owner", "")}</span></div>
                <div class='report-impact'>{action.get("expected_impact", "")}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("### WATCH LIST")
    watch_df = pd.DataFrame(report.get("watch_list", []))
    if not watch_df.empty:
        st.dataframe(watch_df, use_container_width=True, hide_index=True)
    else:
        st.info("No watch list returned.")

    st.markdown("### Downloads")
    latest_report_path = Path("data/processed/latest_report.json")
    metrics_path = Path("data/processed/metrics.csv")

    c1, c2 = st.columns(2)
    with c1:
        if latest_report_path.exists():
            st.download_button(
                "Download JSON Report",
                data=latest_report_path.read_bytes(),
                file_name="latest_report.json",
                mime="application/json",
            )
    with c2:
        if metrics_path.exists():
            st.download_button(
                "Download CSV Data",
                data=metrics_path.read_bytes(),
                file_name="metrics.csv",
                mime="text/csv",
            )


def render_raw(df: pd.DataFrame) -> None:
    """
    Render raw data tab.
    """
    st.markdown("<div class='section-header'>Raw Data</div>", unsafe_allow_html=True)

    if df is None or df.empty:
        st.warning("No processed data available.")
        return

    start_date = pd.to_datetime(df["date"]).min().date()
    end_date = pd.to_datetime(df["date"]).max().date()

    st.markdown(
        f"Processed dataset with all KPIs. **{len(df)} rows** from **{start_date}** to **{end_date}**."
    )
    st.dataframe(df, use_container_width=True)

    metrics_path = Path("data/processed/metrics.csv")
    if metrics_path.exists():
        st.download_button(
            "Download metrics.csv",
            data=metrics_path.read_bytes(),
            file_name="metrics.csv",
            mime="text/csv",
        )


init_session_state()

revenue_file, ad_file, traffic_file, run_clicked = render_sidebar()

if run_clicked:
    if not all([revenue_file, ad_file, traffic_file]):
        st.warning("Please upload all 3 CSV files")
    else:
        save_uploaded_files(revenue_file, ad_file, traffic_file)
        with st.spinner("Running analysis..."):
            run_pipeline()

if not st.session_state.analysis_run:
    render_welcome()
else:
    df = st.session_state.df
    anomalies = st.session_state.anomalies or []
    report = st.session_state.report

    tab1, tab2, tab3, tab4 = st.tabs(["Overview", "Charts", "AI Report", "Raw Data"])

    with tab1:
        render_overview(df, anomalies, report)

    with tab2:
        render_charts(df, anomalies)

    with tab3:
        render_report(report)

    with tab4:
        render_raw(df)