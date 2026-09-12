"""West Bengal Forest & Restricted Zone Safety ML Model

Ensemble ML model (Isolation Forest + Gradient Boosting Risk Evaluator)
trained specifically for West Bengal tourist trajectory analysis, forest reserve intrusion,
and restricted area proximity detection.
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
import joblib
from sklearn.ensemble import IsolationForest, RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "wb_forest_risk_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "wb_scaler.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "wb_model_metadata.json")

# Key West Bengal Forest Reserves & Restricted Zones (Center lat, lng, radius_km)
WB_FOREST_RESERVES = [
    {
        "name": "Sundarbans Tiger Reserve Core Area",
        "lat": 21.9497, "lng": 88.8834, "radius_km": 35.0,
        "risk_level": "restricted",
        "category": "Tiger Reserve Core Zone",
        "buffer_km": 15.0
    },
    {
        "name": "Buxa Tiger Reserve & Frontier Forest",
        "lat": 26.7455, "lng": 89.5847, "radius_km": 25.0,
        "risk_level": "restricted",
        "category": "Dense Wildlife Reserve",
        "buffer_km": 10.0
    },
    {
        "name": "Jaldapara Rhino National Park",
        "lat": 26.6961, "lng": 89.2678, "radius_km": 18.0,
        "risk_level": "restricted",
        "category": "Protected Forest Sanctuary",
        "buffer_km": 8.0
    },
    {
        "name": "Neora Valley Mountain National Park",
        "lat": 27.0425, "lng": 88.6948, "radius_km": 16.0,
        "risk_level": "restricted",
        "category": "High-Altitude Dense Jungle",
        "buffer_km": 6.0
    },
    {
        "name": "Singalila High Alpine National Park",
        "lat": 27.1408, "lng": 88.0772, "radius_km": 14.0,
        "risk_level": "high",
        "category": "Border Forest Trail",
        "buffer_km": 5.0
    },
    {
        "name": "Gorumara Wildlife Reserve",
        "lat": 26.7426, "lng": 88.7961, "radius_km": 15.0,
        "risk_level": "restricted",
        "category": "Elephant & Rhino Habitat",
        "buffer_km": 7.0
    },
    {
        "name": "Mahananda Wildlife Sanctuary",
        "lat": 26.8524, "lng": 88.4239, "radius_km": 12.0,
        "risk_level": "high",
        "category": "Foothill Forest Corridor",
        "buffer_km": 5.0
    },
    {
        "name": "Darjeeling Alpine Reserve Forest",
        "lat": 27.0360, "lng": 88.2627, "radius_km": 10.0,
        "risk_level": "medium",
        "category": "Eco-sensitive Forest",
        "buffer_km": 4.0
    }
]

FEATURE_NAMES = [
    "lat",
    "lng",
    "min_dist_to_restricted_forest_km",
    "min_dist_to_forest_buffer_km",
    "in_wb_bounds",
    "speed_kmh",
    "direction_change_deg",
    "time_in_forest_pct",
    "elevation_approx_m",
    "night_travel_flag",
    "off_route_dev_km",
]

def haversine(lat1, lng1, lat2, lng2):
    """Calculate Great Circle distance in kilometers between two points."""
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlng = np.radians(lng2 - lng1)
    a = (np.sin(dlat / 2.0) ** 2 +
         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlng / 2.0) ** 2)
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return R * c

def compute_wb_spatial_features(lat, lng, speed_kmh=5.0, direction_change_deg=10.0,
                                time_in_forest_pct=0.0, night_travel=False, off_route_dev_km=0.0):
    """Compute spatial feature vector for a tourist location ping in West Bengal."""
    # Check if point is inside West Bengal bounding box (21.5°N - 27.5°N, 85.8°E - 89.9°E)
    in_wb = 1.0 if (21.5 <= lat <= 27.5 and 85.8 <= lng <= 89.9) else 0.0

    min_res_dist = 999.0
    min_buff_dist = 999.0

    for reserve in WB_FOREST_RESERVES:
        d = haversine(lat, lng, reserve["lat"], reserve["lng"])
        res_d = max(0.0, d - reserve["radius_km"])
        buff_d = max(0.0, d - (reserve["radius_km"] + reserve["buffer_km"]))
        if res_d < min_res_dist:
            min_res_dist = res_d
        if buff_d < min_buff_dist:
            min_buff_dist = buff_d

    # Approximate elevation estimate for West Bengal terrain (from coastal Sunderbans to Darjeeling hills)
    if lat > 26.5 and lng < 88.5:
        elevation_approx = 1500.0 + (lat - 26.5) * 1000.0
    elif lat > 26.5:
        elevation_approx = 400.0 + (lat - 26.5) * 400.0
    else:
        elevation_approx = 10.0 + (lat - 21.5) * 15.0

    return {
        "lat": float(lat),
        "lng": float(lng),
        "min_dist_to_restricted_forest_km": float(min_res_dist),
        "min_dist_to_forest_buffer_km": float(min_buff_dist),
        "in_wb_bounds": float(in_wb),
        "speed_kmh": float(speed_kmh),
        "direction_change_deg": float(direction_change_deg),
        "time_in_forest_pct": float(time_in_forest_pct),
        "elevation_approx_m": float(elevation_approx),
        "night_travel_flag": 1.0 if night_travel else 0.0,
        "off_route_dev_km": float(off_route_dev_km),
    }

class WBForestRiskModel:
    """Model wrapper for West Bengal Forest Safety Prediction."""

    def __init__(self):
        self.isolation_forest = None
        self.risk_classifier = None
        self.scaler = None
        self.is_loaded = False
        self.metadata = {}

    def load(self):
        """Load trained model and scaler if existing."""
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            data = joblib.load(MODEL_PATH)
            self.isolation_forest = data.get("isolation_forest")
            self.risk_classifier = data.get("risk_classifier")
            self.scaler = joblib.load(SCALER_PATH)
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r") as f:
                    self.metadata = json.load(f)
            self.is_loaded = True
            return True
        return False

    def predict(self, lat, lng, speed_kmh=5.0, direction_change_deg=10.0,
                time_in_forest_pct=0.0, night_travel=False, off_route_dev_km=0.0):
        """Predict anomaly score, risk level, and nearest WB forest zone details."""
        feats_dict = compute_wb_spatial_features(
            lat, lng, speed_kmh, direction_change_deg, time_in_forest_pct, night_travel, off_route_dev_km
        )
        X_df = pd.DataFrame([feats_dict])[FEATURE_NAMES]

        # Identify nearest reserve
        nearest_reserve = None
        min_d = 9999.0
        for r in WB_FOREST_RESERVES:
            dist = haversine(lat, lng, r["lat"], r["lng"])
            if dist < min_d:
                min_d = dist
                nearest_reserve = r

        inside_restricted = (nearest_reserve and min_d <= nearest_reserve["radius_km"])
        inside_buffer = (nearest_reserve and min_d <= (nearest_reserve["radius_km"] + nearest_reserve["buffer_km"]))

        if self.is_loaded and self.isolation_forest and self.scaler:
            X_scaled = self.scaler.transform(X_df)
            iso_score = float(-self.isolation_forest.score_samples(X_scaled)[0])
            iso_anomaly = bool(self.isolation_forest.predict(X_scaled)[0] == -1)
            clf_risk_prob = self.risk_classifier.predict_proba(X_scaled)[0] if self.risk_classifier else [0.7, 0.2, 0.1, 0.0]
            predicted_class = int(np.argmax(clf_risk_prob))
        else:
            # Rule-based fallback if model file hasn't been saved yet
            iso_score = 0.85 if inside_restricted else (0.55 if inside_buffer else 0.15)
            iso_anomaly = inside_restricted or (inside_buffer and night_travel)
            predicted_class = 3 if inside_restricted else (2 if inside_buffer else (1 if off_route_dev_km > 5.0 else 0))

        risk_labels = ["LOW", "MEDIUM", "HIGH", "RESTRICTED_INTRUSION"]
        risk_label = risk_labels[min(predicted_class, 3)]

        if inside_restricted:
            status_summary = f"CRITICAL: Inside {nearest_reserve['name']}"
            advice = "You have entered a restricted forest zone! Please exit immediately and stay on designated tourist routes."
        elif inside_buffer:
            status_summary = f"WARNING: Near {nearest_reserve['name']} ({min_d:.1f} km away)"
            advice = "You are approaching a restricted forest buffer zone. Follow official forest department guidelines."
        else:
            status_summary = f"SAFE: Nearest forest area is {nearest_reserve['name']} ({min_d:.1f} km)"
            advice = "You are in a safe tourist area. Keep location services active."

        return {
            "latitude": float(lat),
            "longitude": float(lng),
            "in_west_bengal": bool(feats_dict["in_wb_bounds"] == 1.0),
            "anomaly_score": round(float(iso_score), 4),
            "is_anomaly": bool(iso_anomaly),
            "risk_level": risk_label,
            "nearest_forest_reserve": nearest_reserve["name"] if nearest_reserve else "N/A",
            "category": nearest_reserve["category"] if nearest_reserve else "Standard Region",
            "distance_to_nearest_forest_km": round(float(min_d), 2),
            "inside_restricted_forest": bool(inside_restricted),
            "inside_forest_buffer": bool(inside_buffer),
            "status_summary": status_summary,
            "safety_advice": advice,
            "model_version": self.metadata.get("version", "wb-ensemble-v1.0"),
            "evaluated_at": datetime.utcnow().isoformat(),
        }

wb_model = WBForestRiskModel()
wb_model.load()
