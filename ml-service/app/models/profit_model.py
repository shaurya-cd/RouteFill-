"""
Actual Profit Prediction Model.
Predicts net real-world profitability (in INR or local currency) rather than simple naive subtraction.
Factors in real-world friction such as unexpected traffic idling, tolls, loading delays, and corridor price variances.
"""

from typing import Dict, Any
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler


class ProfitModel:
    """
    Supervised regression model predicting true realized profit after all dynamic road expenses.
    """

    def __init__(self):
        self.regressor = GradientBoostingRegressor(n_estimators=120, random_state=42, max_depth=5)
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names = [
            "offered_revenue",
            "trip_distance_km",
            "estimated_fuel_cost",
            "estimated_toll_cost",
            "expected_waiting_time_hours",
            "truck_capacity_tons",
            "historical_toll_multiplier",
            "historical_fuel_variance"
        ]

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Trains the profit regression model using real recorded profit outcomes from completed trips.
        """
        X_scaled = self.scaler.fit_transform(X)
        self.regressor.fit(X_scaled, y)
        self.is_fitted = True

    def predict(self, feature_dict: Dict[str, Any]) -> float:
        """
        Predicts the realistic net profit for the load.
        """
        rev = float(feature_dict.get("offered_revenue", 25000.0))
        dist = float(feature_dict.get("trip_distance_km", 600.0))
        est_fuel = float(feature_dict.get("estimated_fuel_cost", dist * 14.5))
        est_toll = float(feature_dict.get("estimated_toll_cost", dist * 2.2))
        wait_hours = float(feature_dict.get("expected_waiting_time_hours", 2.0))
        cap = float(feature_dict.get("truck_capacity_tons", 10.0))
        toll_mult = float(feature_dict.get("historical_toll_multiplier", 1.05))
        fuel_var = float(feature_dict.get("historical_fuel_variance", 1.02))

        raw_features = np.array([[
            rev,
            dist,
            est_fuel,
            est_toll,
            wait_hours,
            cap,
            toll_mult,
            fuel_var
        ]])

        if not self.is_fitted:
            # Cold-start realistic operational estimate:
            # Revenue minus empirical fuel, tolls, wear-and-tear (INR 3.5/km), and waiting opportunity loss (INR 250/hr)
            baseline = rev - (est_fuel * fuel_var) - (est_toll * toll_mult) - (dist * 3.5) - (wait_hours * 250)
            return round(float(baseline), 2)

        scaled = self.scaler.transform(raw_features)
        pred = float(self.regressor.predict(scaled)[0])
        return round(pred, 2)
