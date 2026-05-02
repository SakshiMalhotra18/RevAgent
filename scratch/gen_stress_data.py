import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

def generate_stress_data():
    base_date = datetime.now() - timedelta(days=30)
    dates = [base_date + timedelta(days=i) for i in range(31)]
    
    # 1. Revenue Data (Dip in the last 7 days + churn/new customers)
    revenue_data = []
    for i, d in enumerate(dates):
        rev = 5000 + np.random.randint(-500, 500)
        new_cust = 50 + np.random.randint(-5, 5)
        churned = 2 + np.random.randint(0, 2)
        if i > 24: # Last 7 days
            rev = rev * 0.7 # 30% drop
            churned = 15 # Spike in churn
        revenue_data.append({
            "date": d.strftime("%Y-%m-%d"), 
            "revenue": round(rev, 2), 
            "refunds": round(rev * (0.05 if i <= 24 else 0.15), 2), # Refund spike too
            "new_customers": new_cust,
            "churned_customers": churned
        })
    
    # 2. Ad Spend (Rising CAC)
    ad_data = []
    for i, d in enumerate(dates):
        spend = 1200 + np.random.randint(-100, 100)
        if i > 24:
            spend = spend * 1.3 # 30% increase
        ad_data.append({
            "date": d.strftime("%Y-%m-%d"), 
            "google_spend": round(spend * 0.6, 2), 
            "meta_spend": round(spend * 0.4, 2),
            "total_spend": round(spend, 2)
        })
        
    # 3. Traffic (Conversion Drop)
    traffic_data = []
    for i, d in enumerate(dates):
        sessions = 5000 + np.random.randint(-200, 200)
        conversions = 150 if i <= 24 else 100
        traffic_data.append({
            "date": d.strftime("%Y-%m-%d"),
            "sessions": sessions,
            "conversions": conversions,
            "conversion_rate": round(conversions / sessions, 4)
        })

    # Save to data/raw
    raw_dir = Path("data/raw")
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    pd.DataFrame(revenue_data).to_csv(raw_dir / "revenue.csv", index=False)
    pd.DataFrame(ad_data).to_csv(raw_dir / "ad_spend.csv", index=False)
    pd.DataFrame(traffic_data).to_csv(raw_dir / "traffic.csv", index=False)
    
    print("Stress test data generated in data/raw/")

if __name__ == "__main__":
    generate_stress_data()
