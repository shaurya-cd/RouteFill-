"""
Feature Engineering Service.
Transforms raw geospatial, vehicle, operational, and financial parameters into
curated numerical feature representations required by the machine learning models.
"""

import math
from typing import Dict, Any


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes Great Circle geographic distance in kilometers using the Haversine formula.
    """
    R = 6371.0  # Earth's mean radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def compute_route_similarity(
    origin1_lat: float, origin1_lon: float, dest1_lat: float, dest1_lon: float,
    origin2_lat: float, origin2_lon: float, dest2_lat: float, dest2_lon: float
) -> float:
    """
    Computes directional alignment and spatial overlap between two routes using cosine vector similarity.
    Returns a score between 0.0 (orthogonal or opposite) and 1.0 (identical bearing and corridor).
    """
    v1_x = dest1_lon - origin1_lon
    v1_y = dest1_lat - origin1_lat
    v2_x = dest2_lon - origin2_lon
    v2_y = dest2_lat - origin2_lat

    mag1 = math.sqrt(v1_x * v1_x + v1_y * v1_y)
    mag2 = math.sqrt(v2_x * v2_x + v2_y * v2_y)

    if mag1 == 0 or mag2 == 0:
        return 0.5

    dot = (v1_x * v2_x) + (v1_y * v2_y)
    cos_theta = dot / (mag1 * mag2)
    # Scale from [-1, 1] to [0, 1]
    normalized_similarity = (cos_theta + 1.0) / 2.0
    return round(float(normalized_similarity), 3)


def engineer_candidate_features(truck: Dict[str, Any], load: Dict[str, Any], history: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Assembles comprehensive engineered features for a specific Truck and candidate Load pair.
    """
    history = history or {}

    # Locations
    truck_curr_lat = float(truck.get("current_latitude", 19.0760))
    truck_curr_lon = float(truck.get("current_longitude", 72.8777))
    pickup_lat = float(load.get("pickup_latitude", 19.0760))
    pickup_lon = float(load.get("pickup_longitude", 72.8777))
    drop_lat = float(load.get("drop_latitude", 28.7041))
    drop_lon = float(load.get("drop_longitude", 77.1025))

    pickup_distance_km = haversine_distance(truck_curr_lat, truck_curr_lon, pickup_lat, pickup_lon)
    trip_distance_km = haversine_distance(pickup_lat, pickup_lon, drop_lat, drop_lon)
    if trip_distance_km == 0:
        trip_distance_km = 10.0

    capacity = float(truck.get("capacity_tons", 10.0))
    weight = float(load.get("weight_tons", 8.0))
    capacity_utilization = round(min(1.0, weight / max(capacity, 0.1)), 3)

    offered_revenue = float(load.get("offered_price", 20000.0))
    offered_price_per_km = round(offered_revenue / trip_distance_km, 2)

    # Benchmark rate per km ~ INR 32-38
    market_benchmark_per_km = 34.0
    price_to_market_ratio = round(offered_price_per_km / market_benchmark_per_km, 3)

    # Operational costs estimation
    fuel_rate_per_km = 14.5  # Typical Indian heavy transport fuel burn
    toll_rate_per_km = 2.2
    estimated_fuel_cost = round((pickup_distance_km + trip_distance_km) * fuel_rate_per_km, 2)
    estimated_toll_cost = round(trip_distance_km * toll_rate_per_km, 2)

    route_similarity = compute_route_similarity(
        truck_curr_lat, truck_curr_lon, drop_lat, drop_lon,
        pickup_lat, pickup_lon, drop_lat, drop_lon
    )

    return {
        "pickup_distance_km": pickup_distance_km,
        "trip_distance_km": trip_distance_km,
        "capacity_utilization": capacity_utilization,
        "offered_revenue": offered_revenue,
        "offered_price_per_km": offered_price_per_km,
        "price_to_market_ratio": price_to_market_ratio,
        "route_similarity": route_similarity,
        "estimated_fuel_cost": estimated_fuel_cost,
        "estimated_toll_cost": estimated_toll_cost,
        "expected_waiting_time_hours": float(load.get("expected_waiting_hours", 2.0)),
        "truck_capacity_tons": capacity,
        "owner_historical_acceptance_rate": float(history.get("acceptance_rate", 0.75)),
        "historical_completion_rate": float(history.get("completion_rate", 0.95)),
        "historical_delay_rate": float(history.get("delay_rate", 0.10)),
        "historical_toll_multiplier": float(history.get("toll_multiplier", 1.05)),
        "historical_fuel_variance": float(history.get("fuel_variance", 1.02)),
        "is_fragile_or_refrigerated": bool(load.get("is_fragile_or_refrigerated", False))
    }
