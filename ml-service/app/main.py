"""
RouteFill AI - Machine Learning Microservice.
Provides dead-mileage forecasting, owner acceptance prediction, trip success estimation,
and net real-world profit regression.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import prediction, training
from app.services.prediction_service import PredictionService
from app.services.training_service import TrainingService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initializes ML services and artifact stores during application bootstrap.
    """
    app.state.training_service = TrainingService()
    app.state.prediction_service = PredictionService()
    yield


app = FastAPI(
    title="RouteFill AI - ML Microservice",
    description="Machine Learning inference and retraining engine for intelligent truck load matching.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction.router)
app.include_router(training.router)


@app.get("/health", tags=["System"])
async def health_check():
    """
    Microservice heartbeat check.
    """
    return {
        "status": "HEALTHY",
        "service": "RouteFill AI - ML Engine",
        "active_model_version": getattr(app.state.prediction_service, "version", "v1.0")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
