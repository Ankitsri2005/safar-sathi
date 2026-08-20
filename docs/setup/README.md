# Environment Setup Guide

## Prerequisites

### Required Software
1. **Node.js 18+** — https://nodejs.org
2. **PostgreSQL 14+** — https://postgresql.org
3. **PostGIS** — PostgreSQL spatial extension
4. **Git** — https://git-scm.com

### Install PostGIS (Windows)
```bash
# If using PostgreSQL installer, PostGIS may be bundled
# Otherwise via Stack Builder or:
psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## Setup Steps

### 1. Create Database
```bash
psql -U postgres
CREATE DATABASE smart_tourist_safety;
\q
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Install & Run Backend
```bash
npm install
npm run migrate
npm run seed
npm run dev
```

### 4. Install & Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Verify
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000
- Database: `psql -U postgres -d smart_tourist_safety -c "\dt"`

## Mapbox Setup
1. Create account at https://mapbox.com
2. Create access token in Account → Access Tokens
3. Add to `backend/.env` and `frontend/.env.local`
