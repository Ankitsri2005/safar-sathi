"""Tests for the AI service anomaly detection."""

import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from app import (
    extract_features,
    train_model,
    features_to_vector,
    get_reasons,
    get_recommended_action,
    normalize_feature,
    haversine,
    bearing,
    FEATURE_NAMES,
    scaler,
)


class TestHaversine:
    def test_same_point(self):
        assert haversine(27.3, 88.6, 27.3, 88.6) == 0.0

    def test_known_distance(self):
        d = haversine(27.3, 88.6, 27.4, 88.6)
        assert 5 < d < 20  # ~11 km


class TestBearing:
    def test_north(self):
        b = bearing(27.0, 88.0, 28.0, 88.0)
        assert 350 < b or b < 10

    def test_east(self):
        b = bearing(27.0, 88.0, 27.0, 89.0)
        assert 80 < b < 100


class TestNormalizeFeature:
    def test_zero(self):
        assert normalize_feature("max_speed", 0) == 0.0

    def test_at_max(self):
        assert normalize_feature("max_speed", 20) == 1.0

    def test_midpoint(self):
        v = normalize_feature("max_speed", 10)
        assert 0.4 < v < 0.6

    def test_clamped_above(self):
        assert normalize_feature("max_speed", 50) == 1.0

    def test_clamped_below(self):
        assert normalize_feature("max_speed", -5) == 0.0


class TestReasons:
    def test_generates_reasons(self):
        contributions = [
            {"feature": "max_speed", "value": 15.0, "contribution_score": 0.8, "is_anomalous": True},
            {"feature": "route_adherence_score", "value": 0.2, "contribution_score": 0.7, "is_anomalous": True},
        ]
        reasons = get_reasons({}, contributions, 0.85)
        assert len(reasons) >= 1
        assert any("speed" in r.lower() for r in reasons)

    def test_fallback_reason(self):
        reasons = get_reasons({}, [], 0.95)
        assert len(reasons) == 1

    def test_no_anomalous_features(self):
        reasons = get_reasons({}, [{"is_anomalous": False}], 0.7)
        assert len(reasons) == 1


class TestRecommendedAction:
    def test_critical(self):
        assert "Immediate" in get_recommended_action("critical")

    def test_low(self):
        assert "No action" in get_recommended_action("low")


class TestModelTraining:
    def test_train_and_predict(self):
        model, sc = train_model()
        assert model is not None
        assert hasattr(model, "predict")

    def test_model_version(self):
        from app import MODEL_VERSION
        assert "isolation-forest" in MODEL_VERSION


class TestFeaturesToVector:
    def test_correct_shape(self):
        features = {name: 0.5 for name in FEATURE_NAMES}
        vec = features_to_vector(features)
        assert vec.shape == (1, len(FEATURE_NAMES))
