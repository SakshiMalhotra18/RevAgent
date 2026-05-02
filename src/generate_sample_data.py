from pathlib import Path
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

np.random.seed(42)

output_dir = Path("data/raw")
output_dir.mkdir(parents=True, exist_ok=True)

start_date = datetime(2026, 1, 1)
days = 90
dates = [start_date + timedelta(days=i) for i in range(days)]

revenue_rows = []
ad_rows = []
traffic_rows = []

for i, d in enumerate(dates):
    anomaly = 59 <= i <= 65

    google = max(0, 1400 + np.random.normal(0, 80))
    meta = max(0, 900 + np.random.normal(0, 60))

    if anomaly:
        google = np.random.uniform(0, 30)
        meta = np.random.uniform(0, 20)

    total_spend = round(google + meta, 2)

    sessions = int(3200 + (i * 8) + np.random.normal(0, 120))
    if anomaly:
        sessions = int(sessions * 0.72)

    conv_rate = 0.038 + np.random.normal(0, 0.0015)
    if anomaly:
        conv_rate *= 0.90

    conversions = int(sessions * conv_rate)

    new_customers = max(5, int(conversions * 0.65))
    churned = max(2, int(new_customers * 0.20))

    revenue = 12000 + (new_customers * 95) + np.random.normal(0, 250)
    refunds = revenue * 0.045

    if anomaly:
        revenue *= 0.86
        refunds *= 1.22

    revenue_rows.append({
        "date": d.strftime("%Y-%m-%d"),
        "revenue": round(revenue, 2),
        "refunds": round(refunds, 2),
        "new_customers": new_customers,
        "churned_customers": churned
    })

    ad_rows.append({
        "date": d.strftime("%Y-%m-%d"),
        "google_spend": round(google, 2),
        "meta_spend": round(meta, 2),
        "total_spend": total_spend
    })

    traffic_rows.append({
        "date": d.strftime("%Y-%m-%d"),
        "sessions": sessions,
        "conversions": conversions,
        "conversion_rate": round(conversions / sessions, 4)
    })

pd.DataFrame(revenue_rows).to_csv("data/raw/revenue.csv", index=False)
pd.DataFrame(ad_rows).to_csv("data/raw/ad_spend.csv", index=False)
pd.DataFrame(traffic_rows).to_csv("data/raw/traffic.csv", index=False)

print("CSV files created in data/raw/")