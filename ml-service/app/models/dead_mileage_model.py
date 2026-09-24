"""
Dead Mileage Prediction Model.
Predicts whether a truck will travel empty after dropping off a load
and forecasts the anticipated empty distance based on destination and corridor patterns.
"""

from typing import Dict, Any, Tuple
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler


class DeadMileageModel:
    """
    Two-stage model:
    1. Classifier: Estimates probability of an empty return trip (dead mileage).
    2. Regressor: Predicts expected empty travel distance (km) if dead mileage occurs.
    """

    def __init__(self):
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=6)
        self.regressor = GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5)
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names = [
            "dest_latitude",
            "dest_longitude",
            "completion_hour",
            "day_of_week",
            "nearby_available_loads_count",
            "historical_corridor_empty_rate",
            "historical_avg_empty_km",
            "truck_capacity_tons"
        ]

    def fit(self, X: np.ndarray, y_prob: np.ndarray, y_dist: np.ndarray) -> None:
        """
        Trains both the dead mileage classification model and empty distance regression model.
        """
        X_scaled = self.scaler.fit_transform(X)
        self.classifier.fit(X_scaled, y_prob)
        self.regressor.fit(X_scaled, y_dist)
        self.is_fitted = True

    def predict(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts dead mileage probability, risk tier, and predicted empty distance in kilometers.
        """
        raw_features = np.array([[
            float(feature_dict.get("dest_latitude", 20.0)),
            float(feature_dict.get("dest_longitude", 75.0)),
            float(feature_dict.get("completion_hour", 14.0)),
            float(feature_dict.get("day_of_week", 2.0)),
            float(feature_dict.get("nearby_available_loads_count", 2.0)),
            float(feature_dict.get("historical_corridor_empty_rate", 0.4)),
            float(feature_dict.get("historical_avg_empty_km", 250.0)),
            float(feature_dict.get("truck_capacity_tons", 10.0))
        ]])

        if not self.is_fitted:
            # Fallback heuristic if not yet trained
            prob = float(np.clip(feature_dict.get("historical_corridor_empty_rate", 0.45), 0.05, 0.95))
            dist = float(feature_dict.get("historical_avg_empty_km", 280.0))
        else:
            scaled = self.scaler.transform(raw_features)
            prob_arr = self.classifier.predict_proba(scaled)[0]
            prob = float(prob_arr[1]) if len(prob_arr) > 1 else float(prob_arr[0])
            dist = float(max(0.0, self.regressor.predict(scaled)[0]))

        risk_level = "LOW"
        if prob >= 0.70:
            risk_level = "HIGH"
        elif prob >= 0.35:
            risk_level = "MEDIUM"

        return {
            "dead_mileage_probability": round(prob, 4),
            "risk_level": risk_level,
            "predicted_empty_distance_km": round(dist, 1)
        }
