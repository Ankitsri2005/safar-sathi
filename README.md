# Smart Tourist Safety Monitoring & Incident Response System

A comprehensive platform for monitoring tourist safety through blockchain-secured digital IDs, real-time tracking, geofencing, and instant emergency response.

## Project Structure

```
sih 2026/
├── frontend/          Next.js + Tailwind CSS (App Router)
├── backend/           Node.js + Express.js + PostgreSQL/PostGIS
├── blockchain/        Hash-chain blockchain module
├── ai-service/        Python/Flask microservice (anomaly detection)
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
| Frontend           | Next.js 16, Tailwind CSS, TypeScript          |
| Backend            | Node.js, Express.js, TypeScript               |
| Database           | PostgreSQL + PostGIS                          |
| Blockchain         | Custom SHA-256 hash-chain (Node.js)           |
| Maps               | Mapbox GL JS                                  |
| Heatmaps           | Kepler.gl / deck.gl                           |
| Auth               | JWT + bcrypt, role-based access               |
| PDF Generation     | pdfkit (E-FIR generation)                     |
| QR Code            | qrcode (npm)                                  |
| Real-time          | Socket.io                                     |
| AI/ML Service      | Python, Flask, scikit-learn (planned)         |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- npm

### Backend Setup
```bash
cd backend
cp .env.example .env    # Configure your database credentials
npm install
npm run dev             # Starts on http://localhost:5000
```

### Database Setup
```bash
# Ensure PostgreSQL is running, then create the database:
psql -U postgres -c "CREATE DATABASE smart_tourist_safety;"
psql -U postgres -d smart_tourist_safety -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations:
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

## Environment Variables

See `backend/.env.example` for all required variables. Key ones:

| Variable              | Description                    |
|-----------------------|--------------------------------|
| DB_HOST               | PostgreSQL host                |
| DB_PORT               | PostgreSQL port                |
| DB_NAME               | Database name                  |
| JWT_SECRET            | JWT signing secret             |
| BLOCKCHAIN_SALT       | Hash-chain salt value          |
| MAPBOX_ACCESS_TOKEN   | Mapbox API token               |

## API Endpoints

| Method | Endpoint                          | Auth | Description              |
|--------|-----------------------------------|------|--------------------------|
| POST   | /api/register                     | No   | Tourist registration     |
| GET    | /api/verify-id/:touristId/:blockId| No   | QR/ID verification       |
| POST   | /api/auth/login                   | No   | Authority login          |
| GET    | /api/auth/me                      | Yes  | Current user profile     |
| GET    | /api/dashboard/overview           | Yes  | Dashboard stats          |
| GET    | /api/dashboard/active-tourists    | Yes  | Tourist locations        |
| GET    | /api/dashboard/analytics          | Yes  | Alert analytics          |
| GET    | /api/alerts                       | Yes  | List alerts              |
| POST   | /api/alerts                       | Yes  | Create alert             |
| PATCH  | /api/alerts/:id                   | Yes  | Update alert status      |
| GET    | /api/zones                        | Yes  | List risk zones          |
| POST   | /api/zones                        | Yes  | Create risk zone         |
| GET    | /api/digital-ids                  | Yes  | List digital IDs         |
| GET    | /api/efirs                        | Yes  | List E-FIRs              |
| POST   | /api/efirs/generate/:alertId      | Yes  | Generate E-FIR PDF       |

## License

Government of India — Smart India Hackathon 2026
