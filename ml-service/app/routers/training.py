"""
Training Router.
Provides administrative endpoints to trigger model retraining using historical outcome records.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/train", tags=["Model Training"])


class RetrainRequest(BaseModel):
    version_tag: Optional[str] = Field(None, description="Optional custom tag for new model version")
    outcomes: Optional[List[Dict[str, Any]]] = Field(None, description="Feedback outcome records from DB")


@router.post("")
async def trigger_retraining(payload: RetrainRequest, request: Request):
    """
    Retrains Dead Mileage, Acceptance, Success, and Profit models, updates active artifacts,
    and returns cross-validation evaluation metrics.
    """
    training_service = request.app.state.training_service
    prediction_service = request.app.state.prediction_service

    metrics = training_service.train_and_save(
        custom_outcomes=payload.outcomes,
        version_tag=payload.version_tag
    )

    # Reload active models in memory for prediction service
    prediction_service.load_models()

    return {
        "status": "SUCCESS",
        "message": f"Successfully retrained models to version {metrics['model_version']}",
        "metrics": metrics
    }
