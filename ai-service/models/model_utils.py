"""Model persistence utilities for the AI service.

Handles saving and loading trained Isolation Forest models.
"""

import os
import json
import pickle
from datetime import datetime
from pathlib import Path

MODELS_DIR = Path(__file__).parent


def save_model(model, scaler, metadata=None):
    """Save trained model and scaler to disk."""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    model_path = MODELS_DIR / f"model_{timestamp}.pkl"
    meta_path = MODELS_DIR / f"model_{timestamp}_meta.json"

    with open(model_path, "wb") as f:
        pickle.dump({"model": model, "scaler": scaler}, f)

    meta = {
        "version": f"isolation-forest-{timestamp}",
        "saved_at": datetime.utcnow().isoformat(),
        "n_estimators": model.n_estimators,
        "contamination": model.contamination,
        "n_features_in": model.n_features_in_,
        **(metadata or {}),
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    # Write a "latest" pointer
    pointer_path = MODELS_DIR / "latest.json"
    with open(pointer_path, "w") as f:
        json.dump({"version": meta["version"], "model_file": model_path.name, "meta_file": meta_path.name}, f)

    return model_path, meta_path


def load_model():
    """Load the latest trained model from disk. Returns (model, scaler) or (None, None)."""
    pointer_path = MODELS_DIR / "latest.json"
    if not pointer_path.exists():
        return None, None

    with open(pointer_path) as f:
        pointer = json.load(f)

    model_path = MODELS_DIR / pointer["model_file"]
    if not model_path.exists():
        return None, None

    with open(model_path, "rb") as f:
        data = pickle.load(f)

    return data["model"], data["scaler"]


def list_models():
    """List all saved model versions."""
    models = []
    for p in MODELS_DIR.glob("model_*_meta.json"):
        with open(p) as f:
            meta = json.load(f)
        models.append(meta)
    return sorted(models, key=lambda m: m["saved_at"], reverse=True)
