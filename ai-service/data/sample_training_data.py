"""Sample training data representing normal tourist movement patterns.

Used to bootstrap the Isolation Forest model before real data is available.
Each row corresponds to one tracking session with 21 features.
"""

NORMAL_TOURIST_PROFILES = [
    # Profile 1: Active tourist in city area
    {
        "avg_speed": 2.5, "max_speed": 8.0, "speed_variance": 2.1,
        "avg_direction_change": 25.0, "max_direction_change": 90.0,
        "avg_ping_interval_min": 5.0, "max_ping_gap_min": 15.0,
        "total_distance_km": 12.0, "avg_distance_per_ping_km": 0.3,
        "avg_distance_from_route_km": 0.5, "max_distance_from_route_km": 1.5,
        "route_adherence_score": 0.85, "time_in_high_risk_pct": 0.05,
        "time_in_restricted_pct": 0.0, "zone_entry_count": 3,
        "unique_zones_visited": 2, "past_alert_count": 0,
        "alert_rate_per_day": 0.0, "stop_count": 5,
        "avg_stop_duration_min": 10.0, "max_stop_duration_min": 30.0,
    },
    # Profile 2: Trekking tourist
    {
        "avg_speed": 3.0, "max_speed": 5.0, "speed_variance": 1.5,
        "avg_direction_change": 40.0, "max_direction_change": 120.0,
        "avg_ping_interval_min": 8.0, "max_ping_gap_min": 20.0,
        "total_distance_km": 18.0, "avg_distance_per_ping_km": 0.4,
        "avg_distance_from_route_km": 1.0, "max_distance_from_route_km": 2.5,
        "route_adherence_score": 0.75, "time_in_high_risk_pct": 0.15,
        "time_in_restricted_pct": 0.0, "zone_entry_count": 5,
        "unique_zones_visited": 3, "past_alert_count": 0,
        "alert_rate_per_day": 0.0, "stop_count": 8,
        "avg_stop_duration_min": 5.0, "max_stop_duration_min": 20.0,
    },
    # Profile 3: Relaxed tourist with frequent stops
    {
        "avg_speed": 1.5, "max_speed": 4.0, "speed_variance": 0.8,
        "avg_direction_change": 15.0, "max_direction_change": 60.0,
        "avg_ping_interval_min": 6.0, "max_ping_gap_min": 25.0,
        "total_distance_km": 6.0, "avg_distance_per_ping_km": 0.15,
        "avg_distance_from_route_km": 0.3, "max_distance_from_route_km": 1.0,
        "route_adherence_score": 0.9, "time_in_high_risk_pct": 0.02,
        "time_in_restricted_pct": 0.0, "zone_entry_count": 2,
        "unique_zones_visited": 2, "past_alert_count": 0,
        "alert_rate_per_day": 0.0, "stop_count": 12,
        "avg_stop_duration_min": 15.0, "max_stop_duration_min": 45.0,
    },
    # Profile 4: Tourist with one past false-positive alert
    {
        "avg_speed": 2.0, "max_speed": 6.0, "speed_variance": 1.8,
        "avg_direction_change": 30.0, "max_direction_change": 80.0,
        "avg_ping_interval_min": 5.0, "max_ping_gap_min": 12.0,
        "total_distance_km": 10.0, "avg_distance_per_ping_km": 0.25,
        "avg_distance_from_route_km": 0.8, "max_distance_from_route_km": 2.0,
        "route_adherence_score": 0.8, "time_in_high_risk_pct": 0.08,
        "time_in_restricted_pct": 0.01, "zone_entry_count": 4,
        "unique_zones_visited": 2, "past_alert_count": 1,
        "alert_rate_per_day": 0.3, "stop_count": 6,
        "avg_stop_duration_min": 12.0, "max_stop_duration_min": 35.0,
    },
    # Profile 5: Off-road / adventurous tourist
    {
        "avg_speed": 4.0, "max_speed": 10.0, "speed_variance": 3.5,
        "avg_direction_change": 50.0, "max_direction_change": 150.0,
        "avg_ping_interval_min": 4.0, "max_ping_gap_min": 10.0,
        "total_distance_km": 22.0, "avg_distance_per_ping_km": 0.5,
        "avg_distance_from_route_km": 2.0, "max_distance_from_route_km": 4.0,
        "route_adherence_score": 0.6, "time_in_high_risk_pct": 0.25,
        "time_in_restricted_pct": 0.0, "zone_entry_count": 7,
        "unique_zones_visited": 4, "past_alert_count": 0,
        "alert_rate_per_day": 0.0, "stop_count": 3,
        "avg_stop_duration_min": 8.0, "max_stop_duration_min": 15.0,
    },
]

# Anomalous profiles for validation
ANOMALOUS_TOURIST_PROFILES = [
    # Restricted zone entry
    {
        "avg_speed": 2.0, "max_speed": 7.0, "speed_variance": 2.0,
        "avg_direction_change": 20.0, "max_direction_change": 70.0,
        "avg_ping_interval_min": 5.0, "max_ping_gap_min": 12.0,
        "total_distance_km": 15.0, "avg_distance_per_ping_km": 0.35,
        "avg_distance_from_route_km": 3.0, "max_distance_from_route_km": 8.0,
        "route_adherence_score": 0.3, "time_in_high_risk_pct": 0.6,
        "time_in_restricted_pct": 0.4, "zone_entry_count": 12,
        "unique_zones_visited": 6, "past_alert_count": 2,
        "alert_rate_per_day": 0.8, "stop_count": 1,
        "avg_stop_duration_min": 2.0, "max_stop_duration_min": 5.0,
    },
    # Erratic movement + high speed
    {
        "avg_speed": 8.0, "max_speed": 25.0, "speed_variance": 15.0,
        "avg_direction_change": 70.0, "max_direction_change": 170.0,
        "avg_ping_interval_min": 3.0, "max_ping_gap_min": 5.0,
        "total_distance_km": 35.0, "avg_distance_per_ping_km": 1.2,
        "avg_distance_from_route_km": 6.0, "max_distance_from_route_km": 15.0,
        "route_adherence_score": 0.1, "time_in_high_risk_pct": 0.7,
        "time_in_restricted_pct": 0.3, "zone_entry_count": 15,
        "unique_zones_visited": 8, "past_alert_count": 4,
        "alert_rate_per_day": 1.5, "stop_count": 0,
        "avg_stop_duration_min": 0.0, "max_stop_duration_min": 0.0,
    },
    # Extended stop in high-risk zone
    {
        "avg_speed": 1.0, "max_speed": 3.0, "speed_variance": 0.5,
        "avg_direction_change": 5.0, "max_direction_change": 20.0,
        "avg_ping_interval_min": 5.0, "max_ping_gap_min": 10.0,
        "total_distance_km": 2.0, "avg_distance_per_ping_km": 0.05,
        "avg_distance_from_route_km": 4.0, "max_distance_from_route_km": 5.0,
        "route_adherence_score": 0.2, "time_in_high_risk_pct": 0.9,
        "time_in_restricted_pct": 0.0, "zone_entry_count": 1,
        "unique_zones_visited": 1, "past_alert_count": 0,
        "alert_rate_per_day": 0.0, "stop_count": 1,
        "avg_stop_duration_min": 120.0, "max_stop_duration_min": 180.0,
    },
]
