"""
Django Settings for Taxi Fare Anomaly Detection System.
This configuration sets up the core infrastructure: 
- MongoDB for high-volume trip data
- JWT for secure authentication
- CORS for frontend integration
"""

import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# Security Note: This key is for development. In production, use environment variables.
SECRET_KEY = 'django-taxi-anomaly-secret-key-2024-xyz'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.authentication',
    'apps.trips',
    'apps.anomalies',
    'apps.batch',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Handles Cross-Origin Resource Sharing
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ── DATABASE ARCHITECTURE ──
# We intentionally bypass the Django ORM because NYC Taxi data is massive (millions of rows).
# MongoDB is used directly for flexibility with unstructured parquet data and high-speed aggregation.
# sqlite3 is set as a dummy 'memory' database to satisfy Django's internal requirements.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# MongoDB Connection Configuration
# Uses environment variables for flexibility during deployment (e.g., MongoDB Atlas)
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = 'taxi_anomaly_db'

# ── REST FRAMEWORK CONFIG ──
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny', # Permissive for demo; restrict for production
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# ── JWT AUTHENTICATION ──
# Configures token expiration for a balance between security and user convenience.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── CORS CONFIG ──
# Allows the React Vite frontend to communicate with this Django backend.
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

STATIC_URL = '/static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ── MACHINE LEARNING ASSETS ──
# Path to the serialized Isolation Forest model and the raw source dataset.
ML_MODEL_PATH = os.path.join(BASE_DIR, 'ml', 'isolation_forest.pkl')
PARQUET_PATH = "/Users/riturajbhattacharjee/Desktop/yellow_tripdata_2023-02 (1).parquet"
