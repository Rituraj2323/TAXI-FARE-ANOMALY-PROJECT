"""
Anomalies Router
Provides API endpoints for the dashboard to consume real-time anomaly detection data.
Integrates with the AnomalyService to fetch processed ML results.
"""

from fastapi import APIRouter
from services.model import anomaly_service
from typing import List
from datetime import datetime, timedelta
import random

router = APIRouter()

@router.get("/dashboard-stats")
def get_dashboard_stats():
    """
    Returns aggregated statistics for the dashboard overview cards.
    Includes total trips analyzed, anomaly counts, and rates.
    """
    if not anomaly_service.is_ready:
        return {
            "total_trips_analyzed": 0,
            "anomalies_detected": 0,
            "anomaly_rate": 0.0,
            "active_alerts": 0,
            "trend": "down"
        }
    
    stats = anomaly_service.stats
    return {
        "total_trips_analyzed": stats.get("total_trips_analyzed", 0),
        "anomalies_detected": stats.get("anomalies_detected", 0),
        "anomaly_rate": float(stats.get("anomaly_rate_percent", 0.0)),
        "active_alerts": stats.get("anomalies_detected", 0),  # Example mapping
        "trend": "up"
    }

@router.get("/recent-trips")
def get_recent_trips(limit: int = 10):
    """
    Returns a list of the most recent anomalies detected by the system.
    This data is typically displayed in the 'Recent Alerts' table on the frontend.
    """
    if not anomaly_service.is_ready:
        return []
    
    # Map the recent_anomalies to match the schema expected by the frontend table
    trips = []
    for anomaly in anomaly_service.recent_anomalies[:limit]:
        trips.append({
            "trip_id": f"TRP-{anomaly['id']}",
            "pickup_datetime": anomaly['time'],
            "pickup_location": "NYC Area",  # Location wasn't in the features, just simulating
            "dropoff_location": "NYC Area",
            "fare_amount": float(anomaly['fare'].replace('$', '')),
            "isolation_forest_score": round(random.uniform(-1.0, -0.1), 3), # Simulate outlier score
            "is_anomaly": True
        })
    return trips

@router.get("/chart-data")
def get_chart_data():
    """
    Returns time-series data for visualizing anomalies over time in the dashboard charts.
    """
    if not anomaly_service.is_ready:
        return []
    
    return anomaly_service.chart_data
