"""
Trip Success Prediction Model.
Predicts whether a proposed truck-load assignment will be completed successfully
without cancellations, severe delivery delays, or critical operational breakdowns.
"""

from typing import Dict, Any
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler


class TripSuccessModel:
    """
    Supervised model predicting the likelihood of clean and on-time trip completion.
    """

    def __init__(self):
        self.classifier = GradientBoostingClassifier(n_estimators=100, random_state=42, max_depth=5)
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names = [
            "trip_distance_km",
            "capacity_utilization",
            "historical_completion_rate",
            "historical_delay_rate",
            "expected_waiting_time_hours",
            "is_fragile_or_refrigerated"
        ]

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Trains the trip execution success classifier using recorded delivery outcomes.
        """
        X_scaled = self.scaler.fit_transform(X)
        self.classifier.fit(X_scaled, y)
        self.is_fitted = True

    def predict_proba(self, feature_dict: Dict[str, Any]) -> float:
        """
        Predicts the probability (0.0 to 1.0) of reliable, timely trip completion.
        """
        raw_features = np.array([[
            float(feature_dict.get("trip_distance_km", 450.0)),
            float(feature_dict.get("capacity_utilization", 0.82)),
            float(feature_dict.get("historical_completion_rate", 0.94)),
            float(feature_dict.get("historical_delay_rate", 0.12)),
            float(feature_dict.get("expected_waiting_time_hours", 2.0)),
            float(1.0 if feature_dict.get("is_fragile_or_refrigerated", False) else 0.0)
        ]])

        if not self.is_fitted:
            # Calibrated baseline
            base = float(feature_dict.get("historical_completion_rate", 0.92))
            delay_penalty = float(feature_dict.get("historical_delay_rate", 0.10)) * 0.4
            prob = np.clip(base - delay_penalty, 0.50, 0.99)
            return round(float(prob), 4)

        scaled = self.scaler.transform(raw_features)
        probs = self.classifier.predict_proba(scaled)[0]
        prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
        return round(float(np.clip(prob, 0.10, 0.99)), 4)
