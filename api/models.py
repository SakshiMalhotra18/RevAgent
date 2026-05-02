from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from api.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    company_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DailyMetric(Base):
    __tablename__ = "daily_metrics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, index=True)
    
    # Raw Data Equivalents
    revenue = Column(Float, default=0.0)
    refunds = Column(Float, default=0.0)
    new_customers = Column(Integer, default=0)
    churned_customers = Column(Integer, default=0)
    google_spend = Column(Float, default=0.0)
    meta_spend = Column(Float, default=0.0)
    total_spend = Column(Float, default=0.0)
    sessions = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)

    # Processed / Calculated Fields
    net_revenue = Column(Float, default=0.0)
    refund_rate = Column(Float, default=0.0)
    cac = Column(Float, default=0.0)
    churn_rate = Column(Float, default=0.0)

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric_name = Column(String, index=True)
    date = Column(Date, index=True)
    severity = Column(String)
    change_pct = Column(Float)
    direction = Column(String)
    event_duration_days = Column(Integer, default=1)
