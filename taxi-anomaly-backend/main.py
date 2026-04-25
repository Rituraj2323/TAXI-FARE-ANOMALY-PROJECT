from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, anomalies
from services.model import anomaly_service

app = FastAPI(title="Taxi Anomaly System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["anomalies"])

@app.on_event("startup")
async def startup_event():
    # Load dataset and train the Isolation Forest model
    anomaly_service.load_and_train()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Taxi Anomaly System API"}
