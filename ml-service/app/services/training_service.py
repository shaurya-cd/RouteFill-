"""
Training Service.
Trains and evaluates all four Scikit-learn models using historical operational outcomes.
Saves serialized Joblib model bundles versioned for auditability and reproducibility.
"""

import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score
import joblib

from app.models.dead_mileage_model import DeadMileageModel
from app.models.acceptance_model import AcceptanceModel
from app.models.success_model import TripSuccessModel
from app.models.profit_model import ProfitModel


class TrainingService:
    """
    Manages continuous retraining of the machine learning ensemble.
    """

    def __init__(self, artifacts_dir: str = "trained_models"):
        self.artifacts_dir = artifacts_dir
        os.makedirs(self.artifacts_dir, exist_ok=True)

    def generate_synthetic_historical_data(self, n_samples: int = 1200) -> Dict[str, pd.DataFrame]:
        """
        Generates realistic synthetic historical logistics records for initial model training
        incorporating freight corridors, tolls, and real-world operational trade-offs.
        """
        np.random.seed(42)

        # 1. Dead Mileage dataset
        dm_dest_lat = np.random.uniform(12.0, 31.0, n_samples)
        dm_dest_lon = np.random.uniform(72.0, 88.0, n_samples)
        dm_hour = np.random.uniform(0, 24, n_samples)
        dm_dow = np.random.randint(0, 7, n_samples)
        dm_loads_nearby = np.random.poisson(3.0, n_samples)
        dm_hist_rate = np.random.uniform(0.15, 0.75, n_samples)
        dm_hist_km = np.random.uniform(100, 700, n_samples)
        dm_cap = np.random.choice([7.0, 10.0, 16.0, 25.0, 40.0], n_samples)

        # Ground truth formulation
        dm_logits = (
            -0.8 * dm_loads_nearby +
            1.8 * dm_hist_rate +
            0.002 * dm_hist_km +
            (dm_dow >= 5) * 0.4 - 0.5
        )
        dm_probs = 1.0 / (1.0 + np.exp(-dm_logits))
        dm_y_prob = (np.random.rand(n_samples) < dm_probs).astype(int)
        dm_y_dist = np.maximum(0, dm_hist_km * dm_probs + np.random.normal(0, 40, n_samples))

        df_dm = pd.DataFrame({
            "dest_latitude": dm_dest_lat,
            "dest_longitude": dm_dest_lon,
            "completion_hour": dm_hour,
            "day_of_week": dm_dow,
            "nearby_available_loads_count": dm_loads_nearby,
            "historical_corridor_empty_rate": dm_hist_rate,
            "historical_avg_empty_km": dm_hist_km,
            "truck_capacity_tons": dm_cap,
            "y_prob": dm_y_prob,
            "y_dist": dm_y_dist
        })

        # 2. Acceptance, Success, and Profit dataset
        pickup_dist = np.random.exponential(25.0, n_samples)
        trip_dist = np.random.uniform(120, 1400, n_samples)
        sim = np.random.uniform(0.4, 0.98, n_samples)
        cap_util = np.random.uniform(0.5, 1.0, n_samples)
        market_per_km = np.random.uniform(30.0, 42.0, n_samples)
        price_ratio = np.random.normal(1.02, 0.15, n_samples)
        offered_price_per_km = market_per_km * price_ratio
        offered_rev = offered_price_per_km * trip_dist
        wait_hours = np.random.exponential(2.5, n_samples)
        owner_hist_acc = np.random.uniform(0.45, 0.95, n_samples)
        truck_cap = np.random.choice([7.0, 10.0, 16.0, 25.0, 40.0], n_samples)
        toll_mult = np.random.normal(1.05, 0.08, n_samples)
        fuel_var = np.random.normal(1.02, 0.05, n_samples)
        hist_comp = np.random.uniform(0.85, 0.99, n_samples)
        hist_delay = np.random.uniform(0.04, 0.25, n_samples)
        is_fragile = np.random.choice([0, 1], n_samples, p=[0.8, 0.2])

        # Fuel and toll
        fuel_cost = (pickup_dist + trip_dist) * 14.5 * fuel_var
        toll_cost = trip_dist * 2.2 * toll_mult

        # Acceptance truth
        acc_logits = (
            -0.035 * pickup_dist +
            2.5 * sim +
            3.0 * (price_ratio - 1.0) -
            0.15 * wait_hours +
            1.5 * (owner_hist_acc - 0.5)
        )
        acc_probs = 1.0 / (1.0 + np.exp(-acc_logits))
        y_accepted = (np.random.rand(n_samples) < acc_probs).astype(int)

        # Success truth
        succ_logits = (
            2.5 * (hist_comp - 0.8) -
            3.0 * hist_delay -
            0.0008 * trip_dist -
            0.5 * is_fragile +
            0.8
        )
        succ_probs = 1.0 / (1.0 + np.exp(-succ_logits))
        y_completed = (np.random.rand(n_samples) < succ_probs).astype(int)

        # Realized profit truth
        unforeseen_friction = np.random.exponential(600, n_samples) + (wait_hours * 220)
        actual_profit = offered_rev - fuel_cost - toll_cost - (trip_dist * 3.2) - unforeseen_friction

        df_candidates = pd.DataFrame({
            "pickup_distance_km": pickup_dist,
            "trip_distance_km": trip_dist,
            "route_similarity": sim,
            "capacity_utilization": cap_util,
            "offered_price_per_km": offered_price_per_km,
            "price_to_market_ratio": price_ratio,
            "offered_revenue": offered_rev,
            "estimated_fuel_cost": fuel_cost,
            "estimated_toll_cost": toll_cost,
            "expected_waiting_time_hours": wait_hours,
            "owner_historical_acceptance_rate": owner_hist_acc,
            "truck_capacity_tons": truck_cap,
            "historical_toll_multiplier": toll_mult,
            "historical_fuel_variance": fuel_var,
            "historical_completion_rate": hist_comp,
            "historical_delay_rate": hist_delay,
            "is_fragile_or_refrigerated": is_fragile,
            "y_accepted": y_accepted,
            "y_completed": y_completed,
            "actual_profit": actual_profit
        })

        return {"dead_mileage": df_dm, "candidates": df_candidates}

    def train_and_save(
        self,
        custom_outcomes: Optional[List[Dict[str, Any]]] = None,
        version_tag: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Trains the full model suite on historical data, serializes Joblib files,
        and computes comprehensive validation metrics.
        """
        raw_version = version_tag or f"v1.{int(datetime.now().timestamp()) % 10000}"
        version = os.path.basename(raw_version) or "v1.0"
        save_path = os.path.join(self.artifacts_dir, version)
        os.makedirs(save_path, exist_ok=True)

        synth = self.generate_synthetic_historical_data()
        df_dm = synth["dead_mileage"]
        df_cand = synth["candidates"]

        # Incorporate custom outcomes if provided from PostgreSQL feedback
        if custom_outcomes and len(custom_outcomes) > 5:
            custom_rows = []
            for item in custom_outcomes:
                custom_rows.append({
                    "pickup_distance_km": float(item.get("actual_distance_km", 25.0)),
                    "trip_distance_km": float(item.get("actual_distance_km", 450.0)),
                    "route_similarity": float(item.get("route_similarity", 0.85)),
                    "capacity_utilization": float(item.get("capacity_utilization", 0.8)),
                    "offered_price_per_km": float(item.get("offered_price_per_km", 34.0)),
                    "price_to_market_ratio": 1.05,
                    "offered_revenue": float(item.get("offered_revenue", 22000.0)),
                    "estimated_fuel_cost": float(item.get("actual_fuel_cost", 6000.0)),
                    "estimated_toll_cost": float(item.get("actual_toll_cost", 1100.0)),
                    "expected_waiting_time_hours": float(item.get("actual_waiting_time_minutes", 120.0)) / 60.0,
                    "owner_historical_acceptance_rate": 0.8,
                    "truck_capacity_tons": 10.0,
                    "historical_toll_multiplier": 1.05,
                    "historical_fuel_variance": 1.02,
                    "historical_completion_rate": 0.95,
                    "historical_delay_rate": 0.08,
                    "is_fragile_or_refrigerated": 0,
                    "y_accepted": 1 if item.get("was_accepted") else 0,
                    "y_completed": 1 if item.get("was_completed") else 0,
                    "actual_profit": float(item.get("actual_profit", 9500.0))
                })
            df_custom = pd.DataFrame(custom_rows)
            df_cand = pd.concat([df_cand, df_custom], ignore_index=True)

        # 1. Train Dead Mileage Model
        dm_features = [
            "dest_latitude", "dest_longitude", "completion_hour", "day_of_week",
            "nearby_available_loads_count", "historical_corridor_empty_rate",
            "historical_avg_empty_km", "truck_capacity_tons"
        ]
        X_dm = df_dm[dm_features].values
        y_dm_prob = df_dm["y_prob"].values
        y_dm_dist = df_dm["y_dist"].values

        dm_model = DeadMileageModel()
        dm_model.fit(X_dm, y_dm_prob, y_dm_dist)

        # 2. Train Acceptance Model
        acc_features = [
            "pickup_distance_km", "route_similarity", "capacity_utilization",
            "offered_price_per_km", "expected_waiting_time_hours",
            "owner_historical_acceptance_rate", "price_to_market_ratio"
        ]
        X_acc = df_cand[acc_features].values
        y_acc = df_cand["y_accepted"].values
        X_train_acc, X_test_acc, y_train_acc, y_test_acc = train_test_split(
            X_acc, y_acc, test_size=0.2, random_state=42
        )
        acc_model = AcceptanceModel()
        acc_model.fit(X_train_acc, y_train_acc)
        acc_preds = (acc_model.classifier.predict_proba(acc_model.scaler.transform(X_test_acc))[:, 1] >= 0.5).astype(int)
        acc_accuracy = float(accuracy_score(y_test_acc, acc_preds))

        # 3. Train Trip Success Model
        succ_features = [
            "trip_distance_km", "capacity_utilization", "historical_completion_rate",
            "historical_delay_rate", "expected_waiting_time_hours", "is_fragile_or_refrigerated"
        ]
        X_succ = df_cand[succ_features].values
        y_succ = df_cand["y_completed"].values
        X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(
            X_succ, y_succ, test_size=0.2, random_state=42
        )
        succ_model = TripSuccessModel()
        succ_model.fit(X_train_s, y_train_s)
        succ_preds = (succ_model.classifier.predict_proba(succ_model.scaler.transform(X_test_s))[:, 1] >= 0.5).astype(int)
        succ_accuracy = float(accuracy_score(y_test_s, succ_preds))

        # 4. Train Profit Model
        prof_features = [
            "offered_revenue", "trip_distance_km", "estimated_fuel_cost",
            "estimated_toll_cost", "expected_waiting_time_hours", "truck_capacity_tons",
            "historical_toll_multiplier", "historical_fuel_variance"
        ]
        X_prof = df_cand[prof_features].values
        y_prof = df_cand["actual_profit"].values
        X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(
            X_prof, y_prof, test_size=0.2, random_state=42
        )
        prof_model = ProfitModel()
        prof_model.fit(X_train_p, y_train_p)
        prof_preds = prof_model.regressor.predict(prof_model.scaler.transform(X_test_p))
        prof_mae = float(mean_absolute_error(y_test_p, prof_preds))
        prof_r2 = float(r2_score(y_test_p, prof_preds))

        # Save artifacts
        joblib.dump(dm_model, os.path.join(save_path, "dead_mileage_model.joblib"))
        joblib.dump(acc_model, os.path.join(save_path, "acceptance_model.joblib"))
        joblib.dump(succ_model, os.path.join(save_path, "success_model.joblib"))
        joblib.dump(prof_model, os.path.join(save_path, "profit_model.joblib"))

        # Update active pointer
        with open(os.path.join(self.artifacts_dir, "current_version.txt"), "w") as f:
            f.write(version)

        return {
            "model_version": version,
            "acceptance_accuracy": round(acc_accuracy, 4),
            "success_accuracy": round(succ_accuracy, 4),
            "profit_mae": round(prof_mae, 2),
            "profit_r2": round(prof_r2, 4),
            "samples_trained": len(df_cand),
            "timestamp": datetime.now().isoformat()
        }
