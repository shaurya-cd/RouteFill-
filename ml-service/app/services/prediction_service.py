"""
Prediction Service.
Orchestrates loaded machine learning models to generate real-time inferences for
dead mileage risks and multi-model candidate load scoring.
"""

import os
from typing import Dict, Any, List
import joblib

from app.models.dead_mileage_model import DeadMileageModel
from app.models.acceptance_model import AcceptanceModel
from app.models.success_model import TripSuccessModel
from app.models.profit_model import ProfitModel
from app.services.feature_service import engineer_candidate_features


class PredictionService:
    """
    Manages active model artifacts in memory and serves predictions.
    """

    def __init__(self, artifacts_dir: str = "trained_models"):
        self.artifacts_dir = artifacts_dir
        self.version = "v1.0"
        self.dead_mileage_model = DeadMileageModel()
        self.acceptance_model = AcceptanceModel()
        self.success_model = TripSuccessModel()
        self.profit_model = ProfitModel()
        self.load_models()

    def load_models(self) -> None:
        """
        Loads the latest serialized model bundle from the artifacts directory if present.
        """
        version_file = os.path.join(self.artifacts_dir, "current_version.txt")
        if os.path.exists(version_file):
            with open(version_file, "r") as f:
                self.version = f.read().strip()

        model_path = os.path.join(self.artifacts_dir, self.version)
        if os.path.exists(model_path):
            dm_file = os.path.join(model_path, "dead_mileage_model.joblib")
            acc_file = os.path.join(model_path, "acceptance_model.joblib")
            succ_file = os.path.join(model_path, "success_model.joblib")
            prof_file = os.path.join(model_path, "profit_model.joblib")

            if os.path.exists(dm_file):
                self.dead_mileage_model = joblib.load(dm_file)
            if os.path.exists(acc_file):
                self.acceptance_model = joblib.load(acc_file)
            if os.path.exists(succ_file):
                self.success_model = joblib.load(succ_file)
            if os.path.exists(prof_file):
                self.profit_model = joblib.load(prof_file)

    def predict_dead_mileage(self, trip_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts the dead mileage probability and empty distance for a completed or concluding trip.
        """
        result = self.dead_mileage_model.predict(trip_data)
        result["model_version"] = self.version
        return result

    def score_candidate_loads(
        self,
        truck: Dict[str, Any],
        candidate_loads: List[Dict[str, Any]],
        owner_history: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Scores a list of pre-filtered candidate loads against a truck using Acceptance, Success, and Profit models.
        """
        scored_candidates = []
        for load in candidate_loads:
            features = engineer_candidate_features(truck, load, owner_history)

            acceptance_prob = self.acceptance_model.predict_proba(features)
            success_prob = self.success_model.predict_proba(features)
            predicted_profit = self.profit_model.predict(features)

            scored_candidates.append({
                "load_id": load.get("id"),
                "load_identifier": load.get("identifier"),
                "features": features,
                "acceptance_probability": acceptance_prob,
                "success_probability": success_prob,
                "predicted_profit": predicted_profit,
                "model_version": self.version
            })

        return scored_candidates
