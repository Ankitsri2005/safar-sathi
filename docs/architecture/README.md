# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Public   │ │Dashboard │ │   Authority      │   │
│  │  Pages    │ │ Pages    │ │   Protected      │   │
│  └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────┬───────────────────────────────┘
                      │ REST API + WebSocket
┌─────────────────────┴───────────────────────────────┐
│                BACKEND (Express.js)                  │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌───────┐  │
│  │ Auth │ │Tourist │ │Alerts│ │Zones │ │E-FIRs │  │
│  └──────┘ └────────┘ └──────┘ └──────┘ └───────┘  │
│  ┌──────────────────┐  ┌───────────────────────┐    │
│  │Blockchain Module │  │  Anomaly Detection    │    │
│  │ (Hash Chain)     │  │  (Cron / AI Service)  │    │
│  └──────────────────┘  └───────────────────────┘    │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│            PostgreSQL + PostGIS Database             │
│  tourists | digital_ids | blockchain_ledger |       │
│  alerts | zones | location_pings | efirs | users    │
└─────────────────────────────────────────────────────┘
```

## Data Flow
1. Tourist registers → KYC encrypted in Postgres → Hash created → Block appended to chain → QR generated
2. Authority scans QR → Block fetched → Chain verified → Data hash verified → Result returned
3. Tourist triggers panic → Alert created → Pushed via Socket.io → Officer sees on dashboard
4. Officer resolves alert → Optionally generates E-FIR PDF → Stored in uploads
