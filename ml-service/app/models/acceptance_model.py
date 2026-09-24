"""
Owner Acceptance Prediction Model.
Predicts the probability that a truck owner will accept a recommended load
based on financial incentive, detour distance, waiting friction, and historical acceptance behavior.
"""

from typing import Dict, Any
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


class AcceptanceModel:
    """
    Supervised classification model forecasting load acceptance likelihood.
    """

    def __init__(self):
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=6)
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names = [
            "pickup_distance_km",
            "route_similarity",
            "capacity_utilization",
            "offered_price_per_km",
            "expected_waiting_time_hours",
            "owner_historical_acceptance_rate",
            "price_to_market_ratio"
        ]

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Trains the acceptance probability classifier on historical recommendation outcome records.
        """
        X_scaled = self.scaler.fit_transform(X)
        self.classifier.fit(X_scaled, y)
        self.is_fitted = True

    def predict_proba(self, feature_dict: Dict[str, Any]) -> float:
        """
        Predicts the probability (0.0 to 1.0) that the truck owner accepts this load recommendation.
        """
        raw_features = np.array([[
            float(feature_dict.get("pickup_distance_km", 20.0)),
            float(feature_dict.get("route_similarity", 0.85)),
            float(feature_dict.get("capacity_utilization", 0.80)),
            float(feature_dict.get("offered_price_per_km", 35.0)),
            float(feature_dict.get("expected_waiting_time_hours", 2.0)),
            float(feature_dict.get("owner_historical_acceptance_rate", 0.70)),
            float(feature_dict.get("price_to_market_ratio", 1.05))
        ]])

        if not self.is_fitted:
            # Calibrated cold-start heuristic
            dist_penalty = max(0.0, (float(feature_dict.get("pickup_distance_km", 20)) - 10) * 0.005)
            price_boost = (float(feature_dict.get("price_to_market_ratio", 1.0)) - 1.0) * 0.3
            hist_base = float(feature_dict.get("owner_historical_acceptance_rate", 0.75))
            prob = np.clip(hist_base + price_boost - dist_penalty, 0.05, 0.98)
            return round(float(prob), 4)

        scaled = self.scaler.transform(raw_features)
        probs = self.classifier.predict_proba(scaled)[0]
        prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
        return round(float(np.clip(prob, 0.01, 0.99)), 4)
