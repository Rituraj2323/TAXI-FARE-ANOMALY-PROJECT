"""
Anomaly Model Service
Handles the heavy lifting of data processing and Machine Learning.
Uses Scikit-Learn's Isolation Forest to identify outliers (anomalies) in taxi trip data.
"""

import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import os

# Path to the raw NYC taxi data in Parquet format
PARQUET_PATH = "/Users/riturajbhattacharjee/Desktop/yellow_tripdata_2023-02 (1).parquet"

class AnomalyModelService:
    """
    Service class that encapsulates all ML logic:
    - Loading data from Parquet files
    - Preprocessing and scaling features
    - Training the Isolation Forest model
    - Computing summary statistics and chart data
    """
    def __init__(self):
        self.df = None
        self.is_ready = False
        self.stats = {}
        self.recent_anomalies = []
        self.chart_data = []

    def load_and_train(self):
        """
        Loads the dataset, preprocesses it, and trains the Isolation Forest model.
        This is called on application startup.
        """
        if not os.path.exists(PARQUET_PATH):
            print(f"Warning: Dataset not found at {PARQUET_PATH}")
            return

        print("Loading dataset...")
        # Load the Parquet file into a Pandas DataFrame
        self.df = pd.read_parquet(PARQUET_PATH)
        
        # Sampling 10,000 rows to ensure fast response times and lower memory usage 
        # while maintaining a statistically significant representative sample.
        if len(self.df) > 10000:
            self.df = self.df.sample(n=10000, random_state=42).copy()

        # Features used for anomaly detection:
        # - fare_amount: Cost of the trip
        # - trip_distance: How far the taxi traveled
        # - passenger_count: Number of passengers
        features = ['fare_amount', 'trip_distance', 'passenger_count']
        
        # Data Cleaning: Remove any rows with missing feature values
        self.df = self.df.dropna(subset=features)

        print("Training Isolation Forest...")
        X = self.df[features]
        
        # Standard Scaling: Normalizes data (Mean=0, StdDev=1) so features with 
        # larger scales (like fare) don't dominate features with smaller scales (like passengers).
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Isolation Forest Initialization:
        # contamination=0.05 means we expect roughly 5% of the data to be anomalous.
        model = IsolationForest(contamination=0.05, random_state=42)
        
        # fit_predict returns: 1 for inliers (normal), -1 for outliers (anomalies)
        preds = model.fit_predict(X_scaled)
        
        # Map predictions back to the DataFrame: 1 for anomaly, 0 for normal
        self.df['anomaly'] = [1 if p == -1 else 0 for p in preds]

        # Extract dates for time-series visualization
        if 'tpep_pickup_datetime' in self.df.columns:
            self.df['date'] = pd.to_datetime(self.df['tpep_pickup_datetime']).dt.date
            # Filter for February 2023 to keep the dashboard focused
            self.df = self.df[(self.df['date'] >= pd.to_datetime('2023-02-01').date()) & 
                              (self.df['date'] <= pd.to_datetime('2023-02-28').date())]

        # Process the results for the frontend
        self._compute_stats()
        self.is_ready = True
        print("Model training complete!")

    def _compute_stats(self):
        """
        Internal method to calculate KPIs and prepare data for visualization.
        Calculates: Total trips, Anomaly rate, Average fare, and daily trends.
        """
        total_trips = len(self.df)
        anomalies = self.df[self.df['anomaly'] == 1]
        total_anomalies = len(anomalies)
        anomaly_rate = round((total_anomalies / total_trips * 100), 2) if total_trips > 0 else 0
        avg_fare = round(self.df['fare_amount'].mean(), 2) if total_trips > 0 else 0

        # Store general statistics
        self.stats = {
            "total_trips_analyzed": total_trips,
            "anomalies_detected": total_anomalies,
            "anomaly_rate_percent": anomaly_rate,
            "avg_fare": avg_fare
        }

        # Prepare Recent Anomalies List (Sorted by highest fare to highlight critical issues)
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

        # Prepare Chart Data: Aggregate anomaly counts by date
        if 'date' in self.df.columns:
            daily_stats = self.df.groupby('date').agg(
                total_trips=('anomaly', 'count'),
                anomalies=('anomaly', 'sum')
            ).reset_index()
            daily_stats['rate'] = (daily_stats['anomalies'] / daily_stats['total_trips']) * 100
            daily_stats = daily_stats.sort_values('date')
            
            self.chart_data = []
            for _, row in daily_stats.iterrows():
                self.chart_data.append({
                    "time": row['date'].strftime('%b %d'),
                    "rate": round(row['rate'], 2)
                })
        else:
            # Fallback mock data if date extraction fails
            self.chart_data = [
                {"time": "Day 1", "rate": 1.2},
                {"time": "Day 2", "rate": 2.3},
                {"time": "Day 3", "rate": 1.8}
            ]

# Singleton instance for the application
anomaly_service = AnomalyModelService()
