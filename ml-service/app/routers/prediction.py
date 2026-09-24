"""
Prediction Router.
Exposes endpoints for real-time dead-mileage risk scoring and multi-model candidate load ranking.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/predict", tags=["Predictions"])


class DeadMileageRequest(BaseModel):
    dest_latitude: float = Field(..., description="Latitude of trip termination location")
    dest_longitude: float = Field(..., description="Longitude of trip termination location")
    completion_hour: Optional[float] = Field(14.0, description="Estimated completion hour (0-23)")
    day_of_week: Optional[float] = Field(2.0, description="Day of week (0=Mon, 6=Sun)")
    nearby_available_loads_count: Optional[float] = Field(3.0, description="Active loads within radius")
    historical_corridor_empty_rate: Optional[float] = Field(0.40, description="Historical corridor empty rate")
    historical_avg_empty_km: Optional[float] = Field(260.0, description="Historical avg deadhead km")
    truck_capacity_tons: Optional[float] = Field(10.0, description="Truck load capacity in tons")


class CandidateScoringRequest(BaseModel):
    truck: Dict[str, Any] = Field(..., description="Truck specifications, capacity, and current coordinates")
    candidate_loads: List[Dict[str, Any]] = Field(..., description="List of rule-filtered candidate loads")
    owner_history: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Historical driver/owner acceptance metrics")


@router.post("/dead-mileage")
async def predict_dead_mileage(payload: DeadMileageRequest, request: Request):
    """
    Computes dead-mileage probability, operational risk tier, and expected empty deadhead distance.
    """
    prediction_service = request.app.state.prediction_service
    return prediction_service.predict_dead_mileage(payload.model_dump())


@router.post("/recommendation-scores")
async def score_recommendations(payload: CandidateScoringRequest, request: Request):
    """
    Evaluates candidate loads through Acceptance, Trip Success, and Actual Profit prediction models.
    """
    prediction_service = request.app.state.prediction_service
    scores = prediction_service.score_candidate_loads(
        truck=payload.truck,
        candidate_loads=payload.candidate_loads,
        owner_history=payload.owner_history
    )
    return {
        "model_version": prediction_service.version,
        "count": len(scores),
        "scores": scores
    }
