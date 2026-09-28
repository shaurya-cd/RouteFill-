"""
RouteFill AI - Machine Learning Microservice.
Provides dead-mileage forecasting, owner acceptance prediction, trip success estimation,
and net real-world profit regression.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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

# CORS configuration
raw_cors = os.getenv("CORS_ORIGIN", "*")
allowed_origins = [o.strip() for o in raw_cors.split(",") if o.strip()]
if "*" in allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches unhandled exceptions to prevent internal code trace leakage.
    """
    print(f"[ERROR] ML Service Exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "ML Inference Service Error", "detail": str(exc)}
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
