"""
Anomalies Views (Django REST Framework)
This module handles all data retrieval and processing for anomalies.
It communicates with MongoDB to fetch trip records and provides complex 
aggregations for the dashboard.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from core.db import get_collection
from apps.batch.services import _load_model
import pandas as pd


class AnomalyListView(APIView):
    """
    GET /api/anomalies
    Provides a paginated and filterable list of detected anomalies.
    Used by the 'Anomaly Explorer' tab on the frontend.
    """

    def get(self, request):
        anomalies = get_collection('anomalies')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        skip = (page - 1) * page_size

        # Default filter: only return records flagged as anomalies
        query = {'is_anomaly': True}

        # Dynamic Range Filtering: Fare Amount
        min_fare = request.query_params.get('min_fare')
        max_fare = request.query_params.get('max_fare')
        if min_fare or max_fare:
            query['fare_amount'] = {}
            if min_fare:
                query['fare_amount']['$gte'] = float(min_fare)
            if max_fare:
                query['fare_amount']['$lte'] = float(max_fare)

        # Dynamic Range Filtering: Date
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from or date_to:
            query['pickup_date'] = {}
            if date_from:
                query['pickup_date']['$gte'] = date_from
            if date_to:
                query['pickup_date']['$lte'] = date_to

        # Zone Filtering
        zone = request.query_params.get('zone')
        if zone and zone.lower() != 'all':
            query['zone'] = zone

        total = anomalies.count_documents(query)
        # Fetch results sorted by anomaly_score (most suspicious first)
        cursor = anomalies.find(query, {'_id': 0}).sort(
            'anomaly_score', -1 
        ).skip(skip).limit(page_size)
        results = list(cursor)

        return Response({
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'results': results,
        })


class TopKAnomalyView(APIView):
    """
    GET /api/anomalies/topk
    Returns the 'K' most suspicious trips in the entire database.
    Useful for investigators to find the most extreme outliers immediately.
    """

    def get(self, request):
        anomalies = get_collection('anomalies')
        k = int(request.query_params.get('k', 50))
        k = min(k, 500)  # Safety cap to prevent large memory overhead

        cursor = anomalies.find(
            {'is_anomaly': True}, {'_id': 0}
        ).sort('anomaly_score', -1).limit(k)

        return Response({'k': k, 'results': list(cursor)})


class AnomalyStatsView(APIView):
    """
    GET /api/anomalies/stats
    Calculates aggregated KPI metrics for the Dashboard overview cards.
    Utilizes MongoDB Aggregation pipelines for high-performance calculations.
    """

    def get(self, request):
        rides = get_collection('rides')
        anomalies = get_collection('anomalies')

        total_trips = rides.count_documents({})
        total_anomalies = anomalies.count_documents({'is_anomaly': True})
        
        # Calculate percentage of trips that are anomalous
        anomaly_rate = round(
            (total_anomalies / total_trips * 100) if total_trips > 0 else 0, 2
        )

        # Average fare across the entire dataset using MongoDB aggregation
        pipeline = [{'$group': {'_id': None, 'avg_fare': {'$avg': '$fare_amount'}}}]
        avg_result = list(rides.aggregate(pipeline))
        avg_fare = round(avg_result[0]['avg_fare'], 2) if avg_result else 0

        # Average anomaly score (severity index)
        score_pipeline = [
            {'$match': {'is_anomaly': True}},
            {'$group': {'_id': None, 'avg_score': {'$avg': '$anomaly_score'}}}
        ]
        score_result = list(anomalies.aggregate(score_pipeline))
        avg_score = round(score_result[0]['avg_score'], 4) if score_result else 0

        return Response({
            'total_trips_analyzed': total_trips,
            'anomalies_detected': total_anomalies,
            'anomaly_rate_percent': anomaly_rate,
            'avg_fare': avg_fare,
            'avg_anomaly_score': avg_score,
            'active_alerts': total_anomalies,
        })


class ChartDataView(APIView):
    """
    GET /api/anomalies/chart-data
    Processes time-series data for the dashboard trend charts.
    Groups trip and anomaly counts by day.
    """

    def get(self, request):
        rides = get_collection('rides')
        anomalies = get_collection('anomalies')

        # Aggregate total trips and average fare per day
        total_pipeline = [
            {'$group': {
                '_id': '$pickup_date',
                'total': {'$sum': 1},
                'avg_fare': {'$avg': '$fare_amount'}
            }},
            {'$sort': {'_id': 1}}
        ]
        total_by_day = {r['_id']: r for r in rides.aggregate(total_pipeline)}

        # Aggregate detected anomalies per day
        anomaly_pipeline = [
            {'$match': {'is_anomaly': True}},
            {'$group': {'_id': '$pickup_date', 'anomalies': {'$sum': 1}}},
            {'$sort': {'_id': 1}}
        ]
        anomaly_by_day = {r['_id']: r['anomalies'] for r in anomalies.aggregate(anomaly_pipeline)}

        # Merge statistics into a unified result set
        results = []
        for date, day_data in sorted(total_by_day.items()):
            if not date:
                continue
            total = day_data['total']
            anom = anomaly_by_day.get(date, 0)
            rate = round((anom / total * 100) if total > 0 else 0, 2)
            results.append({
                'date': date,
                'total_trips': total,
                'anomalies': anom,
                'anomaly_rate': rate,
                'avg_fare': round(day_data.get('avg_fare', 0), 2),
            })

        return Response(results)


class AnomalyDistributionView(APIView):
    """
    GET /api/anomalies/distribution
    Returns a simple count of Normal vs Anomalous trips for Pie Chart visualization.
    """

    def get(self, request):
        anomalies = get_collection('anomalies')
        total = anomalies.count_documents({})
        anom = anomalies.count_documents({'is_anomaly': True})
        normal = total - anom
        return Response([
            {'name': 'Normal', 'value': normal},
            {'name': 'Anomaly', 'value': anom},
        ])


class PassengerCheckView(APIView):
    """
    POST /api/anomalies/check
    The 'Heart' of the Passenger Portal. 
    Performs real-time, stateless Machine Learning inference using a pre-trained model bundle.
    """

    def post(self, request):
        # Extract inputs from user
        fare = request.data.get('fare_amount')
        dist = request.data.get('trip_distance')
        passengers = request.data.get('passenger_count', 1)

        if fare is None or dist is None:
            return Response({'error': 'fare_amount and trip_distance are required.'}, status=400)

        # Validation and Type Casting
        try:
            fare = float(fare)
            dist = float(dist)
            passengers = int(passengers)
        except ValueError:
            return Response({'error': 'Invalid numerical inputs.'}, status=400)

        if dist <= 0 or fare <= 0:
            return Response({'error': 'Distance and Fare must be > 0.'}, status=400)

        # Basic feature engineering (matching the model's training requirements)
        dist_km = dist * 1.60934
        fare_per_km = fare / max(dist_km, 0.1)
        duration_min = (dist / 15.0) * 60  # Estimate duration assuming 15mph avg speed
        fare_per_min = fare / max(duration_min, 0.5)

        # Load the pre-trained Isolation Forest model bundle (Model + Scaler + Metadata)
        try:
            model_data = _load_model()
        except FileNotFoundError:
            return Response({'error': 'Model not trained yet.'}, status=503)

        model = model_data['model']
        scaler = model_data['scaler']
        features = model_data['features']

        # Construct a DataFrame with the exact same structure used during training
        trip_df = pd.DataFrame([{
            'fare_amount': fare,
            'trip_distance': dist,
            'trip_duration_min': duration_min,
            'fare_per_km': fare_per_km,
            'fare_per_min': fare_per_min,
            'passenger_count': passengers
        }])

        # Scale features using the fitted StandardScaler from training
        X = trip_df[features].fillna(0)
        X_scaled = scaler.transform(X)

        # Get raw anomaly score from Isolation Forest
        raw_score = float(model.score_samples(X_scaled)[0])
        
        # Normalize the raw score into a human-readable 0-100 percentage
        offset = model_data.get('offset', 0)
        max_s = model_data.get('max_s', 0)
        min_s = model_data.get('min_s', -1)
        
        if raw_score >= offset:
            pct = 85.0 * (max_s - raw_score) / (max_s - offset) if max_s > offset else 0.0
        else:
            pct = 85.0 + 15.0 * (offset - raw_score) / (offset - min_s) if offset > min_s else 100.0
            
        # Advanced NYC expected fare baseline calculation (2023 TLC Rules approximation)
        # Base fare + Surcharges + Distance ($3.50/mi) + Idle Time
        expected_fare = 7.00 + (dist * 3.50) + ((duration_min * 0.5) * 0.70)
        
        score = round(min(max(pct, 0.0), 100.0), 2)
        is_anomaly = score >= 85.0 # Define threshold for flagging
        
        # Categorize the anomaly if detected
        anomaly_type = None
        if is_anomaly:
            if fare > expected_fare * 1.30:  # Flag overcharges > 30% above baseline
                anomaly_type = 'overcharge'
            elif fare < expected_fare * 0.70: # Flag unusually low fares
                anomaly_type = 'undercharge'
            else:
                anomaly_type = 'unusual_pattern'

        return Response({
            'is_anomaly': is_anomaly,
            'anomaly_type': anomaly_type,
            'expected_fare': round(expected_fare, 2),
            'score': score,
            'breakdown': {
                'fare_per_km': round(fare_per_km, 2),
                'fare_per_min': round(fare_per_min, 2),
                'estimated_duration_min': round(duration_min, 1)
            }
        })

