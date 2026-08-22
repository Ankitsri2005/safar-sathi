# Smart Tourist Safety Monitoring & Incident Response System

A comprehensive platform for monitoring tourist safety through blockchain-secured digital IDs, real-time tracking, AI digital twin risk scoring, multilingual voice triage, geofencing, and instant emergency response.

## Key Features & Highlights

- **Multilingual Support**: Real-time language switcher built into the Navbar supporting **English**, **Hindi (हिन्दी)**, **Bengali (বাংলা)**, and **Assamese (অসমীয়া)** with dynamic page localization.
- **10-Second Automatic Voice SOS Recording**: One-tap emergency panic button with automatic 10-second ambient audio recording (Web Audio API fallback + MediaRecorder), live countdown ring, auto-stop at 10.0s, and inline audio playback player.
- **AI "First Response" Voice Triage**: Automated emergency voice triage assistant ("Are you hurt? Is anyone with you?") that captures critical context before dispatching responders.
- **Behavioral "Digital Twin" Risk Scoring**: Dynamic AI risk model scaling anomaly scores in real-time based on PostGIS spatial crowd density, weather alerts, time-of-day, and local incident history.
- **PostGIS Spatial Analytics & Density Heatmaps**: Live database-driven analytics computed via PostGIS `ST_Contains` spatial joins for tourist density grids, alert hotspots, and zone visit frequencies.
- **Real-Time Map & Device GPS Simulator**: Dynamic Leaflet maps with initial boundary auto-fitting, socket.io location updates, and built-in tourist GPS simulation panel.
- **Blockchain Digital Tourist IDs**: Tamper-proof digital IDs backed by SHA-256 hash-chain ledger verification.

## Project Structure

```
sih 2026/
├── frontend/          Next.js 16 + Tailwind CSS (App Router, LanguageContext)
├── backend/           Node.js + Express.js + PostgreSQL/PostGIS (Knex ORM)
├── blockchain/        Hash-chain blockchain module
├── ai-service/        Python/Flask microservice (Isolation Forest & Digital Twin)
├── docs/              Project documentation
│   ├── architecture/
│   ├── api/
│   ├── setup/
│   └── phases/
└── TASKBOARD.md       Task management board
```

## Tech Stack

| Layer              | Technology                                    |
|--------------------|-----------------------------------------------|
| Frontend           | Next.js 16, Tailwind CSS, TypeScript, Context |
| Backend            | Node.js, Express.js, TypeScript, Knex         |
| Database           | PostgreSQL + PostGIS                          |
| Blockchain         | Custom SHA-256 hash-chain (Node.js)           |
| Maps               | Leaflet & Mapbox GL JS                        |
| Real-Time          | Socket.io                                     |
| Auth               | JWT + bcrypt, role-based access control       |
| PDF Generation     | pdfkit (E-FIR generation)                     |
| AI/ML Service      | Python, Flask, Isolation Forest AI            |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- npm

### Backend Setup
```bash
cd backend
cp .env.example .env    # Configure database credentials
npm install
npm run dev             # Starts API on http://localhost:5000
```

### Database Setup
```bash
# Ensure PostgreSQL is running, then create database:
psql -U postgres -c "CREATE DATABASE smart_tourist_safety;"
psql -U postgres -d smart_tourist_safety -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations (includes 009_add_triage_columns):
cd backend
npm run migrate

# Seed initial data (admin + officer accounts):
npm run seed
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

### Default Login Credentials
| Username  | Password    | Role         |
|-----------|-------------|--------------|
| admin     | admin123    | admin        |
| officer1  | police123   | police       |
| tourism1  | tourism123  | tourism_dept |

## API Endpoints Summary

| Method | Endpoint                          | Auth | Description                                 |
|--------|-----------------------------------|------|---------------------------------------------|
| POST   | /api/register                     | No   | Tourist registration                        |
| GET    | /api/verify-id/:touristId/:blockId| No   | QR/ID verification                          |
| POST   | /api/auth/login                   | No   | Authority login                             |
| GET    | /api/dashboard/overview           | Yes  | Dashboard statistics                        |
| GET    | /api/dashboard/active-tourists    | Yes  | Tourist locations                           |
| GET    | /api/alerts                       | Yes  | List alerts                                 |
| PATCH  | /api/alerts/:id/triage            | Yes  | Update AI First Response voice triage       |
| POST   | /api/location-ping                | Yes  | Post live GPS ping & trigger AI analysis    |
| POST   | /api/ai/analyze/:touristId        | Yes  | Run Digital Twin Isolation Forest AI        |
| POST   | /api/efirs/generate/:alertId      | Yes  | Generate E-FIR PDF                          |

## License

Government of India — Smart India Hackathon 2026
