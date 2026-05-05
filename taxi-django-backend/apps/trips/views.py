"""
Trips Views (Django REST Framework)
Handles retrieval of the full taxi trip dataset.
Supports heavy-duty pagination and multi-criteria filtering.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from core.db import get_collection


class TripsListView(APIView):
    """
    GET /api/trips
    Returns a paginated list of all trips (Normal and Anomalous).
    Used by the 'All Trips' browser in the dashboard.
    """
    def get(self, request):
        rides = get_collection('rides')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        skip = (page - 1) * page_size

        # Define an empty query object to build filters dynamically
        query = {}
        
        # Filter: Fare Range
        min_fare = request.query_params.get('min_fare')
        max_fare = request.query_params.get('max_fare')
        if min_fare or max_fare:
            query['fare_amount'] = {}
            if min_fare:
                query['fare_amount']['$gte'] = float(min_fare)
            if max_fare:
                query['fare_amount']['$lte'] = float(max_fare)

        # Filter: Date Range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from or date_to:
            query['pickup_date'] = {}
            if date_from:
                query['pickup_date']['$gte'] = date_from
            if date_to:
                query['pickup_date']['$lte'] = date_to

        total = rides.count_documents(query)
        # Fetch records sorted by fare amount (highest first for discovery)
        cursor = rides.find(query, {'_id': 0}).sort('fare_amount', -1).skip(skip).limit(page_size)
        results = list(cursor)

        return Response({
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'results': results,
        })
