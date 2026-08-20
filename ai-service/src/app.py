"""Smart Tourist Safety — AI/ML Microservice

Anomaly detection using scikit-learn Isolation Forest.
Connects directly to PostgreSQL for feature extraction.
"""

import os
import sys
import json
import uuid
import numpy as np
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg2 import connect
from psycopg2.extras import RealDictCursor
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)

# Database connection
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "smart_tourist_safety"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
}

# Model cache
MODEL_VERSION = "isolation-forest-v1.0-scikit"
scaler = StandardScaler()
trained_model = None
FEATURE_NAMES = [
    "avg_speed", "max_speed", "speed_variance",
    "avg_direction_change", "max_direction_change",
    "avg_ping_interval_min", "max_ping_gap_min",
    "total_distance_km", "avg_distance_per_ping_km",
    "avg_distance_from_route_km", "max_distance_from_route_km",
    "route_adherence_score",
    "time_in_high_risk_pct", "time_in_restricted_pct",
    "zone_entry_count", "unique_zones_visited",
    "past_alert_count", "alert_rate_per_day",
    "stop_count", "avg_stop_duration_min", "max_stop_duration_min",
]


def get_db():
    """Get a database connection."""
    return connect(**DB_CONFIG, cursor_factory=RealDictCursor)


def haversine(lat1, lng1, lat2, lng2):
    """Distance in km between two lat/lng points."""
    R = 6371
    dlat = np.radians(lat2 - lat1)
    dlng = np.radians(lng2 - lng1)
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlng / 2) ** 2
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def bearing(lat1, lng1, lat2, lng2):
    """Bearing in degrees between two points."""
    dlng = np.radians(lng2 - lng1)
    y = np.sin(dlng) * np.cos(np.radians(lat2))
    x = np.cos(np.radians(lat1)) * np.sin(np.radians(lat2)) - np.sin(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.cos(dlng)
    return (np.degrees(np.arctan2(y, x)) + 360) % 360


def extract_features(tourist_id):
    """Extract numerical features from a tourist's location history."""
    conn = get_db()
    cur = conn.cursor()

    # Get pings from last 24h
    cur.execute("""
        SELECT lat, lng, timestamp FROM location_pings
        WHERE tourist_id = %s AND timestamp >= %s
        ORDER BY timestamp ASC
    """, (tourist_id, (datetime.utcnow() - timedelta(hours=24)).isoformat()))
    pings = cur.fetchall()

    if len(pings) < 3:
        conn.close()
        return None

    # Get tourist itinerary
    cur.execute("SELECT itinerary FROM tourists WHERE id = %s", (tourist_id,))
    row = cur.fetchone()
    itinerary = row["itinerary"] if row and row["itinerary"] else []
    if isinstance(itinerary, str):
        itinerary = json.loads(itinerary)

    # Get past alerts
    cur.execute("SELECT status FROM alerts WHERE tourist_id = %s", (tourist_id,))
    alerts = cur.fetchall()
    false_positives = [a for a in alerts if a["status"] == "false_positive"]

    # Get active zones for spatial queries
    cur.execute("SELECT id, name, risk_level, polygon_geom FROM zones WHERE is_active = true")
    zones = cur.fetchall()

    # Compute features
    lats = np.array([p["lat"] for p in pings])
    lngs = np.array([p["lng"] for p in pings])
    timestamps = np.array([p["timestamp"].timestamp() if hasattr(p["timestamp"], "timestamp") else p["timestamp"] for p in pings])

    # Speed
    speeds = [0.0]
    for i in range(1, len(pings)):
        dist = haversine(pings[i-1]["lat"], pings[i-1]["lng"], pings[i]["lat"], pings[i]["lng"])
        time_h = (timestamps[i] - timestamps[i-1]) / 3600
        speeds.append(dist / time_h if time_h > 0 else 0)

    # Direction changes
    dir_changes = []
    for i in range(2, len(pings)):
        b1 = bearing(pings[i-2]["lat"], pings[i-2]["lng"], pings[i-1]["lat"], pings[i-1]["lng"])
        b2 = bearing(pings[i-1]["lat"], pings[i-1]["lng"], pings[i]["lat"], pings[i]["lng"])
        diff = abs(b2 - b1)
        if diff > 180:
            diff = 360 - diff
        dir_changes.append(diff)

    # Ping intervals
    intervals = [(timestamps[i] - timestamps[i-1]) / 60 for i in range(1, len(pings))]

    # Distances
    distances = [0.0]
    for i in range(1, len(pings)):
        distances.append(haversine(pings[i-1]["lat"], pings[i-1]["lng"], pings[i]["lat"], pings[i]["lng"]))

    # Route deviation
    route_deviations = []
    for ping in pings:
        if not itinerary:
            route_deviations.append(0)
        else:
            min_d = min(haversine(ping["lat"], ping["lng"], s["lat"], s["lng"]) for s in itinerary)
            route_deviations.append(min_d)

    # Zone analysis
    high_risk_count = 0
    restricted_count = 0
    zone_entries = 0
    unique_zones = set()
    prev_zone = ""
    for ping in pings:
        cur.execute("""
            SELECT name, risk_level FROM zones
            WHERE is_active = true
            AND ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
        """, (ping["lng"], ping["lat"]))
        ping_zones = cur.fetchall()
        for z in ping_zones:
            unique_zones.add(z["name"])
            if z["risk_level"] == "high":
                high_risk_count += 1
            if z["risk_level"] == "restricted":
                restricted_count += 1
            if z["name"] != prev_zone:
                zone_entries += 1
                prev_zone = z["name"]

    # Stop detection
    stops = []
    stop_start = -1
    for i, s in enumerate(speeds):
        if s < 1:
            if stop_start == -1:
                stop_start = i
        else:
            if stop_start != -1 and i - stop_start >= 2:
                stops.append((stop_start, i))
            stop_start = -1

    stop_durations = []
    for start, end in stops:
        dur = (timestamps[end-1] - timestamps[start]) / 60
        stop_durations.append(dur)

    total_minutes = (timestamps[-1] - timestamps[0]) / 60 if len(timestamps) > 1 else 0
    total_hours = total_minutes / 60
    days_tracked = max(total_hours / 24, 0.5)

    features = {
        "tourist_id": tourist_id,
        "avg_speed": float(np.mean(speeds)),
        "max_speed": float(np.max(speeds)),
        "speed_variance": float(np.var(speeds)),
        "avg_direction_change": float(np.mean(dir_changes)) if dir_changes else 0,
        "max_direction_change": float(np.max(dir_changes)) if dir_changes else 0,
        "avg_ping_interval_min": float(np.mean(intervals)) if intervals else 0,
        "max_ping_gap_min": float(np.max(intervals)) if intervals else 0,
        "total_distance_km": float(np.sum(distances)),
        "avg_distance_per_ping_km": float(np.mean(distances)),
        "avg_distance_from_route_km": float(np.mean(route_deviations)),
        "max_distance_from_route_km": float(np.max(route_deviations)),
        "route_adherence_score": max(0, 1 - np.mean(route_deviations) / 20) if itinerary else 1.0,
        "time_in_high_risk_pct": high_risk_count / len(pings) if pings else 0,
        "time_in_restricted_pct": restricted_count / len(pings) if pings else 0,
        "zone_entry_count": zone_entries,
        "unique_zones_visited": len(unique_zones),
        "past_alert_count": len(alerts),
        "alert_rate_per_day": len(alerts) / days_tracked,
        "stop_count": len(stops),
        "avg_stop_duration_min": float(np.mean(stop_durations)) if stop_durations else 0,
        "max_stop_duration_min": float(np.max(stop_durations)) if stop_durations else 0,
        "ping_count": len(pings),
        "recent_pings": [{"lat": float(p["lat"]), "lng": float(p["lng"]), "timestamp": str(p["timestamp"])} for p in pings[-20:]],
    }

    conn.close()
    return features


def get_baseline_data():
    """Generate baseline training data representing normal tourist behavior."""
    rng = np.random.RandomState(42)
    n = 500
    data = rng.randn(n, len(FEATURE_NAMES)) * 0.3 + 0.5  # centered around 0.5
    # Clip to reasonable ranges
    data = np.clip(data, 0, 1)
    return data


def train_model():
    """Train the Isolation Forest model on baseline data, with disk caching."""
    global trained_model, scaler

    # Try loading cached model first
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    try:
        from models.model_utils import load_model
        cached_model, cached_scaler = load_model()
        if cached_model is not None:
            trained_model = cached_model
            scaler = cached_scaler
            print("Loaded cached model from disk")
            return trained_model
    except Exception:
        pass

    # Train fresh
    baseline = get_baseline_data()
    scaler.fit(baseline)
    scaled = scaler.transform(baseline)
    trained_model = IsolationForest(
        n_estimators=200,
        contamination=0.1,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    trained_model.fit(scaled)

    # Save to disk
    try:
        from models.model_utils import save_model
        save_model(trained_model, scaler)
        print("Model saved to disk")
    except Exception:
        pass

    return trained_model


def features_to_vector(features):
    """Convert features dict to numpy array in correct order."""
    return np.array([[features.get(name, 0) for name in FEATURE_NAMES]])


FEATURE_IMPORTANCE = {
    "max_distance_from_route_km": 0.95,
    "time_in_restricted_pct": 0.92,
    "time_in_high_risk_pct": 0.85,
    "max_speed": 0.82,
    "route_adherence_score": 0.80,
    "speed_variance": 0.75,
    "max_direction_change": 0.72,
    "zone_entry_count": 0.68,
    "alert_rate_per_day": 0.65,
    "max_stop_duration_min": 0.60,
    "avg_distance_from_route_km": 0.58,
    "max_ping_gap_min": 0.55,
    "stop_count": 0.50,
    "avg_direction_change": 0.48,
    "avg_speed": 0.45,
    "unique_zones_visited": 0.40,
    "total_distance_km": 0.35,
    "past_alert_count": 0.30,
    "avg_ping_interval_min": 0.25,
    "avg_distance_per_ping_km": 0.20,
}


def normalize_feature(name, value):
    """Normalize a feature value to [0, 1] based on typical ranges."""
    ranges = {
        "avg_speed": (0, 10), "max_speed": (0, 20), "speed_variance": (0, 10),
        "avg_direction_change": (0, 90), "max_direction_change": (0, 180),
        "avg_ping_interval_min": (0, 30), "max_ping_gap_min": (0, 120),
        "total_distance_km": (0, 50), "avg_distance_per_ping_km": (0, 5),
        "avg_distance_from_route_km": (0, 10), "max_distance_from_route_km": (0, 20),
        "route_adherence_score": (0, 1), "time_in_high_risk_pct": (0, 1),
        "time_in_restricted_pct": (0, 1), "zone_entry_count": (0, 10),
        "unique_zones_visited": (0, 8), "past_alert_count": (0, 10),
        "alert_rate_per_day": (0, 2), "stop_count": (0, 5),
        "avg_stop_duration_min": (0, 180), "max_stop_duration_min": (0, 300),
    }
    mn, mx = ranges.get(name, (0, 1))
    return max(0, min(1, (value - mn) / (mx - mn)))


def get_reasons(features, contributions, score):
    """Generate human-readable reasons for anomaly detection."""
    reasons = []
    anomalous = [c for c in contributions if c["is_anomalous"]]
    for c in anomalous[:4]:
        f = c["feature"]
        v = c["value"]
        if f == "max_distance_from_route_km":
            reasons.append(f"Tourist moved {v:.1f} km away from planned route (typical: <5 km)")
        elif f == "time_in_restricted_pct":
            reasons.append(f"Spent {v*100:.0f}% of tracking time in restricted zones")
        elif f == "time_in_high_risk_pct":
            reasons.append(f"Spent {v*100:.0f}% of tracking time in high-risk zones")
        elif f == "max_speed":
            reasons.append(f"Recorded speed of {v:.1f} km/h (abnormal for tourist area)")
        elif f == "route_adherence_score":
            reasons.append(f"Route adherence score of {v*100:.0f}% (poor adherence to itinerary)")
        elif f == "speed_variance":
            reasons.append(f"Highly erratic speed pattern (variance: {v:.2f})")
        elif f == "max_direction_change":
            reasons.append(f"Sudden {v:.0f} direction change detected")
        elif f == "zone_entry_count":
            reasons.append(f"{v:.0f} zone entries in tracking period (unusually frequent)")
        elif f == "max_stop_duration_min":
            reasons.append(f"Extended stop of {v:.0f} minutes in tracking area")
        elif f == "max_ping_gap_min":
            reasons.append(f"{v:.0f}-minute gap in location updates")
        else:
            reasons.append(f"Anomalous {f.replace('_', ' ')}: {v:.2f}")

    if not reasons:
        if score >= 0.9:
            reasons.append("Multiple movement anomalies detected simultaneously")
        elif score >= 0.75:
            reasons.append("Unusual movement pattern detected by AI analysis")
        else:
            reasons.append("Slight deviation from normal tourist behavior patterns")
    return reasons


def get_recommended_action(risk_level):
    """Get officer action recommendation based on risk level."""
    actions = {
        "critical": "Immediate officer review required. Consider direct contact with tourist. Check emergency contact.",
        "high": "Officer should review location history and consider contacting tourist to verify safety.",
        "medium": "Monitor tourist closely. Review in next check-in cycle. No immediate action needed.",
        "low": "No action required. Movement within normal parameters.",
    }
    return actions.get(risk_level, actions["low"])


# ── API Endpoints ──────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ai-service", "model_version": MODEL_VERSION})


@app.route("/api/analyze/movement", methods=["POST"])
def analyze_movement():
    """Analyze a tourist's movement for anomalies using Isolation Forest."""
    data = request.get_json()
    tourist_id = data.get("tourist_id")
    if not tourist_id:
        return jsonify({"error": "tourist_id required"}), 400

    features = extract_features(tourist_id)
    if not features:
        return jsonify({"error": "Insufficient data (need 3+ pings in last 24h)"}), 400

    global trained_model
    if trained_model is None:
        train_model()

    vector = features_to_vector(features)
    scaled = scaler.transform(vector)
    score = float(-trained_model.score_samples(scaled)[0])  # higher = more anomalous
    score = max(0, min(1, score))  # clamp to [0, 1]

    # Risk level
    if score >= 0.9:
        risk_level = "critical"
    elif score >= 0.75:
        risk_level = "high"
    elif score >= 0.6:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Contributions
    contributions = []
    for name in FEATURE_NAMES:
        value = features.get(name, 0)
        importance = FEATURE_IMPORTANCE.get(name, 0.5)
        normalized = normalize_feature(name, value)
        contribution_score = normalized * importance
        contributions.append({
            "feature": name,
            "value": round(value, 4),
            "importance": importance,
            "normalized_value": round(normalized, 4),
            "contribution_score": round(contribution_score, 4),
            "is_anomalous": contribution_score > 0.6,
        })
    contributions.sort(key=lambda c: c["contribution_score"], reverse=True)

    reasons = get_reasons(features, contributions, score)
    recommended_action = get_recommended_action(risk_level)

    result = {
        "tourist_id": tourist_id,
        "anomaly_score": round(score, 4),
        "risk_level": risk_level,
        "reasons": reasons,
        "recommended_action": recommended_action,
        "model_version": MODEL_VERSION,
        "related_points": features["recent_pings"],
        "top_contributions": [c for c in contributions if c["is_anomalous"]][:5],
        "created_at": datetime.utcnow().isoformat(),
    }

    # Store in database
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO ai_analyses (id, tourist_id, anomaly_score, risk_level, reasons, related_points, recommended_action, model_version, features, contributions, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), tourist_id, score, risk_level,
            json.dumps(reasons), json.dumps(features["recent_pings"]),
            recommended_action, MODEL_VERSION,
            json.dumps({k: v for k, v in features.items() if k not in ("recent_pings", "tourist_id")}),
            json.dumps(contributions[:10]),
            datetime.utcnow(),
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB store error: {e}")

    return jsonify(result)


@app.route("/api/analyze/risk-score", methods=["POST"])
def risk_score():
    """Calculate risk score for a tourist."""
    data = request.get_json()
    tourist_id = data.get("tourist_id")
    if not tourist_id:
        return jsonify({"error": "tourist_id required"}), 400

    features = extract_features(tourist_id)
    if not features:
        return jsonify({"error": "Insufficient data"}), 400

    global trained_model
    if trained_model is None:
        train_model()

    vector = features_to_vector(features)
    scaled = scaler.transform(vector)
    score = float(-trained_model.score_samples(scaled)[0])
    score = max(0, min(1, score))

    return jsonify({
        "tourist_id": tourist_id,
        "risk_score": round(score, 4),
        "features": {k: v for k, v in features.items() if k not in ("recent_pings", "tourist_id")},
    })


@app.route("/api/analyze/batch", methods=["POST"])
def batch_analyze():
    """Analyze all active tourists."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id FROM tourists
        WHERE trip_end >= CURRENT_DATE
    """)
    tourists = cur.fetchall()
    conn.close()

    results = []
    for t in tourists:
        try:
            data = {"tourist_id": t["id"]}
            # Inline analysis
            features = extract_features(t["id"])
            if features:
                global trained_model
                if trained_model is None:
                    train_model()
                vector = features_to_vector(features)
                scaled = scaler.transform(vector)
                score = float(-trained_model.score_samples(scaled)[0])
                score = max(0, min(1, score))
                results.append({"tourist_id": t["id"], "score": round(score, 4)})
        except Exception:
            pass

    return jsonify({"analyzed": len(results), "results": results})


@app.route("/api/analyze/stats", methods=["GET"])
def ai_stats():
    """Get AI analysis statistics."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN anomaly_score > 0.6 THEN 1 ELSE 0 END) as anomalies,
            SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
            SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical,
            AVG(anomaly_score) as avg_score
        FROM ai_analyses
    """)
    row = cur.fetchone()
    conn.close()
    return jsonify({
        "total_analyses": int(row["total"] or 0),
        "anomalies_detected": int(row["anomalies"] or 0),
        "high_risk_count": int(row["high_risk"] or 0),
        "critical_count": int(row["critical"] or 0),
        "avg_score": float(row["avg_score"] or 0),
    })


@app.route("/api/analyze/tourist/<tourist_id>", methods=["GET"])
def get_tourist_analyses(tourist_id):
    """Get recent analyses for a tourist."""
    limit = request.args.get("limit", 10, type=int)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM ai_analyses
        WHERE tourist_id = %s
        ORDER BY created_at DESC
        LIMIT %s
    """, (tourist_id, limit))
    rows = cur.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": str(r["id"]),
            "tourist_id": str(r["tourist_id"]),
            "anomaly_score": float(r["anomaly_score"]),
            "risk_level": r["risk_level"],
            "reasons": json.loads(r["reasons"]) if isinstance(r["reasons"], str) else r["reasons"],
            "related_points": json.loads(r["related_points"]) if isinstance(r["related_points"], str) else r["related_points"],
            "recommended_action": r["recommended_action"],
            "model_version": r["model_version"],
            "contributions": json.loads(r["contributions"]) if isinstance(r["contributions"], str) else r["contributions"],
            "created_at": str(r["created_at"]),
        })

    return jsonify(results)


if __name__ == "__main__":
    # Train model on startup
    print("Training Isolation Forest model...")
    train_model()
    print(f"Model trained. Version: {MODEL_VERSION}")
    app.run(debug=True, port=5001)
