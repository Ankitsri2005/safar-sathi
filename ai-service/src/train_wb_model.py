"""Training Pipeline for West Bengal Forest Safety ML Model

Generates comprehensive spatial trajectory training dataset across West Bengal region coordinates,
trains an Isolation Forest + Gradient Boosting Ensemble, evaluates metrics,
and saves trained joblib model artifacts.
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
import joblib
from sklearn.ensemble import IsolationForest, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score

from src.wb_forest_risk_model import (
    WB_FOREST_RESERVES, FEATURE_NAMES, compute_wb_spatial_features,
    MODEL_DIR, MODEL_PATH, SCALER_PATH, METADATA_PATH
)

def generate_wb_training_dataset(num_samples=3000):
    """Generate realistic training trajectories in and around West Bengal."""
    np.random.seed(42)
    records = []
    target_labels = [] # 0: Low, 1: Medium, 2: High, 3: Restricted Intrusion

    # 1. Normal tourist points (Kolkata, Digha, Howrah, Siliguri town, Darjeeling town, Gangtok highway)
    urban_hubs = [
        (22.5726, 88.3639), # Kolkata
        (21.6266, 87.5074), # Digha
        (26.7271, 88.3953), # Siliguri
        (27.0410, 88.2663), # Darjeeling Town
        (25.0112, 88.1408), # Malda
        (24.0988, 88.2612), # Murshidabad
        (23.5204, 87.3119), # Durgapur
        (23.6889, 86.9661), # Asansol
    ]

    num_normal = int(num_samples * 0.55)
    for _ in range(num_normal):
        hub = urban_hubs[np.random.randint(0, len(urban_hubs))]
        lat = hub[0] + np.random.normal(0, 0.08)
        lng = hub[1] + np.random.normal(0, 0.08)
        speed = max(0.5, np.random.normal(15.0, 10.0))
        dir_change = abs(np.random.normal(5.0, 10.0))
        forest_pct = max(0.0, min(10.0, np.random.normal(2.0, 3.0)))
        night = np.random.choice([True, False], p=[0.1, 0.9])
        off_route = abs(np.random.normal(0.5, 0.8))

        feats = compute_wb_spatial_features(
            lat, lng, speed_kmh=speed, direction_change_deg=dir_change,
            time_in_forest_pct=forest_pct, night_travel=night, off_route_dev_km=off_route
        )
        records.append(feats)
        target_labels.append(0) # LOW

    # 2. Buffer zone & moderate risk points (Near Sundarbans, Near Buxa, Near Jaldapara)
    num_buffer = int(num_samples * 0.25)
    for _ in range(num_buffer):
        res = WB_FOREST_RESERVES[np.random.randint(0, len(WB_FOREST_RESERVES))]
        # Place in buffer zone
        dist_km = res["radius_km"] + np.random.uniform(1.0, res["buffer_km"])
        angle = np.random.uniform(0, 2 * np.pi)
        lat = res["lat"] + (dist_km / 111.0) * np.sin(angle)
        lng = res["lng"] + (dist_km / (111.0 * np.cos(np.radians(res["lat"])))) * np.cos(angle)

        speed = max(0.0, np.random.normal(8.0, 6.0))
        dir_change = abs(np.random.normal(25.0, 15.0))
        forest_pct = np.random.uniform(15.0, 50.0)
        night = np.random.choice([True, False], p=[0.35, 0.65])
        off_route = abs(np.random.normal(3.5, 2.0))

        feats = compute_wb_spatial_features(
            lat, lng, speed_kmh=speed, direction_change_deg=dir_change,
            time_in_forest_pct=forest_pct, night_travel=night, off_route_dev_km=off_route
        )
        records.append(feats)
        # Classify as Medium (1) or High (2) depending on night/off-route
        target_labels.append(2 if (night or off_route > 4.0) else 1)

    # 3. Restricted Forest Intrusions (Deep inside Sundarbans Core, Buxa Tiger Reserve, Neora Valley)
    num_intrusion = int(num_samples * 0.20)
    for _ in range(num_intrusion):
        res = WB_FOREST_RESERVES[np.random.randint(0, len(WB_FOREST_RESERVES))]
        # Deep inside restricted area
        dist_km = np.random.uniform(0.5, res["radius_km"] * 0.8)
        angle = np.random.uniform(0, 2 * np.pi)
        lat = res["lat"] + (dist_km / 111.0) * np.sin(angle)
        lng = res["lng"] + (dist_km / (111.0 * np.cos(np.radians(res["lat"])))) * np.cos(angle)

        speed = max(0.0, np.random.normal(3.0, 4.0))
        dir_change = abs(np.random.normal(45.0, 20.0))
        forest_pct = np.random.uniform(60.0, 100.0)
        night = np.random.choice([True, False], p=[0.5, 0.5])
        off_route = abs(np.random.normal(7.0, 3.0))

        feats = compute_wb_spatial_features(
            lat, lng, speed_kmh=speed, direction_change_deg=dir_change,
            time_in_forest_pct=forest_pct, night_travel=night, off_route_dev_km=off_route
        )
        records.append(feats)
        target_labels.append(3) # RESTRICTED INTRUSION

    df = pd.DataFrame(records)[FEATURE_NAMES]
    y = np.array(target_labels)
    return df, y

def train_and_save_wb_model():
    """Train Isolation Forest + Gradient Boosting Classifier ensemble."""
    print("=" * 60)
    print("      TRAINING WEST BENGAL FOREST SAFETY ML MODEL      ")
    print("=" * 60)

    print("[1/4] Generating West Bengal spatial training dataset...")
    df, y = generate_wb_training_dataset(num_samples=3500)
    print(f"      Total Training Samples: {len(df)}")
    print(f"      Feature Matrix Shape: {df.shape}")

    print("\n[2/4] Fitting StandardScaler & Isolation Forest (Anomaly Detector)...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df)

    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.22,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_scaled)
    iso_preds = iso_forest.predict(X_scaled)
    anomaly_count = np.sum(iso_preds == -1)
    print(f"      Isolation Forest fitted. Detected {anomaly_count} anomalies out of {len(df)} samples.")

    print("\n[3/4] Fitting Gradient Boosting Risk Classifier...")
    risk_clf = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    risk_clf.fit(X_scaled, y)
    y_pred = risk_clf.predict(X_scaled)
    acc = accuracy_score(y, y_pred)
    print(f"      Classifier Training Accuracy: {acc * 100:.2f}%")

    print("\n[4/4] Saving model artifacts to disk...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump({
        "isolation_forest": iso_forest,
        "risk_classifier": risk_clf
    }, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    metadata = {
        "model_name": "West Bengal Forest & Restricted Zone Safety Ensemble",
        "version": "wb-ensemble-v1.0",
        "trained_at": datetime.utcnow().isoformat(),
        "training_samples": len(df),
        "features": FEATURE_NAMES,
        "accuracy": float(acc),
        "num_wb_reserves_indexed": len(WB_FOREST_RESERVES)
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"      Artifact saved: {MODEL_PATH}")
    print(f"      Scaler saved: {SCALER_PATH}")
    print(f"      Metadata saved: {METADATA_PATH}")
    print("=" * 60)
    print("         TRAINING COMPLETE - WEST BENGAL MODEL READY        ")
    print("=" * 60)

    return metadata

if __name__ == "__main__":
    train_and_save_wb_model()
