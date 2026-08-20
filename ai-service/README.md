# Smart Tourist Safety — AI Service

Python/Flask microservice for anomaly detection and risk scoring.

## Status: Placeholder (to be implemented in Phase 6)

## Setup
```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python src/app.py             # Runs on http://localhost:5001
```

## Planned Endpoints
| Method | Endpoint                | Description                     |
|--------|-------------------------|---------------------------------|
| POST   | /api/analyze/movement   | Detect movement anomalies       |
| POST   | /api/analyze/risk-score | Calculate tourist risk score    |
