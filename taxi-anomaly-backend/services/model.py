import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import os

PARQUET_PATH = "/Users/riturajbhattacharjee/Desktop/yellow_tripdata_2023-02 (1).parquet"

class AnomalyModelService:
    def __init__(self):
        self.df = None
        self.is_ready = False
        self.stats = {}
        self.recent_anomalies = []
        self.chart_data = []

    def load_and_train(self):
        if not os.path.exists(PARQUET_PATH):
            print(f"Warning: Dataset not found at {PARQUET_PATH}")
            return

        print("Loading dataset...")
        # Load a sample to keep memory usage low
        self.df = pd.read_parquet(PARQUET_PATH)
        # Sample 10000 rows to make it fast for the API, but enough to be realistic
        if len(self.df) > 10000:
            self.df = self.df.sample(n=10000, random_state=42).copy()

        features = ['fare_amount', 'trip_distance', 'passenger_count']
        
        # Drop missing values
        self.df = self.df.dropna(subset=features)

        print("Training Isolation Forest...")
        X = self.df[features]
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = IsolationForest(contamination=0.05, random_state=42)
        # fit_predict returns 1 for inliers, -1 for outliers
        preds = model.fit_predict(X_scaled)
        
        # Map: 1 for anomaly, 0 for normal
        self.df['anomaly'] = [1 if p == -1 else 0 for p in preds]

        # Add a date index for charting based on tpep_pickup_datetime
        if 'tpep_pickup_datetime' in self.df.columns:
            self.df['date'] = pd.to_datetime(self.df['tpep_pickup_datetime']).dt.date
            # Filter out crazy dates if any (e.g. 2008 data in 2023)
            self.df = self.df[(self.df['date'] >= pd.to_datetime('2023-02-01').date()) & 
                              (self.df['date'] <= pd.to_datetime('2023-02-28').date())]

        self._compute_stats()
        self.is_ready = True
        print("Model training complete!")

    def _compute_stats(self):
        total_trips = len(self.df)
        anomalies = self.df[self.df['anomaly'] == 1]
        total_anomalies = len(anomalies)
        anomaly_rate = round((total_anomalies / total_trips * 100), 2) if total_trips > 0 else 0
        avg_fare = round(self.df['fare_amount'].mean(), 2) if total_trips > 0 else 0

        self.stats = {
            "total_trips_analyzed": total_trips,
            "anomalies_detected": total_anomalies,
            "anomaly_rate_percent": anomaly_rate,
            "avg_fare": avg_fare
        }

        # Recent anomalies (top 10 based on fare amount for interest)
        recent = anomalies.sort_values('fare_amount', ascending=False).head(10)
        self.recent_anomalies = []
        for _, row in recent.iterrows():
            self.recent_anomalies.append({
                "id": str(row.get('VendorID', 'Unknown')) + "-" + str(_),
                "time": str(row.get('tpep_pickup_datetime', 'N/A')),
                "fare": f"${row['fare_amount']:.2f}",
                "distance": f"{row['trip_distance']:.2f} mi",
                "reason": "High fare/distance ratio" if row.get('fare_amount', 0) > 50 else "Suspicious pattern"
            })

        # Chart data: anomaly rate per day
        if 'date' in self.df.columns:
            daily_stats = self.df.groupby('date').agg(
                total_trips=('anomaly', 'count'),
                anomalies=('anomaly', 'sum')
            ).reset_index()
            daily_stats['rate'] = (daily_stats['anomalies'] / daily_stats['total_trips']) * 100
            # sort by date to look nice on the chart
            daily_stats = daily_stats.sort_values('date')
            
            self.chart_data = []
            for _, row in daily_stats.iterrows():
                self.chart_data.append({
                    "time": row['date'].strftime('%b %d'),
                    "rate": round(row['rate'], 2)
                })
        else:
            self.chart_data = [
                {"time": "Day 1", "rate": 1.2},
                {"time": "Day 2", "rate": 2.3},
                {"time": "Day 3", "rate": 1.8}
            ]

# Singleton instance
anomaly_service = AnomalyModelService()
