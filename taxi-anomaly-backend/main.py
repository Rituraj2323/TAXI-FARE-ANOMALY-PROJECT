"""
Main entry point for the Taxi Anomaly Detection Backend.
This FastAPI application serves as the core engine for detecting fare anomalies 
using machine learning and provides API endpoints for the dashboard.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, anomalies
from services.model import anomaly_service

# Initialize FastAPI app with a descriptive title
app = FastAPI(title="Taxi Anomaly System API")

# Configure Cross-Origin Resource Sharing (CORS)
# This allows the frontend (React/Vite) to communicate with this backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all domains for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all HTTP headers
)

# Include Modular Routers
# /api/auth: Handles user authentication (Login/Signup)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# /api/anomalies: Handles anomaly detection results and data retrieval
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["anomalies"])

@app.on_event("startup")
async def startup_event():
    """
    Code to run when the application starts.
    Initializes the Machine Learning service by loading the dataset 
    and training the Isolation Forest model.
    """
    anomaly_service.load_and_train()

@app.get("/")
def read_root():
    """Health check endpoint to verify the API is running."""
    return {"message": "Welcome to the Taxi Anomaly System API"}
