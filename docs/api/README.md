# API Documentation — Smart Tourist Safety System

Base URL: `http://localhost:5000/api`

## Authentication
All protected endpoints require header: `Authorization: Bearer <jwt_token>`

---

## Public Endpoints

### POST /api/register
Register a tourist and generate Digital ID.

**Body:**
```json
{
  "full_name": "string",
  "id_type": "aadhaar | passport | other",
  "id_number": "string",
  "phone": "string",
  "email": "string",
  "emergency_contact_name": "string",
  "emergency_contact_phone": "string",
  "trip_start": "ISO date",
  "trip_end": "ISO date",
  "itinerary": [{ "place": "string", "lat": 0, "lng": 0, "planned_date": "string" }]
}
```

**Response 201:**
```json
{
  "message": "Tourist registered successfully",
  "tourist": { ... },
  "digitalId": { ... },
  "qrDataUrl": "data:image/png;base64,...",
  "blockchainSecured": true
}
```

### GET /api/verify-id/:touristId/:blockId
Verify a tourist's identity via QR code scan.

**Response 200:**
```json
{
  "valid": true,
  "status": "active",
  "tourist": { "full_name": "...", "id_type": "..." },
  "chainIntact": true,
  "dataIntact": true,
  "expired": false
}
```

### POST /api/auth/login
Login for authority users.

**Body:** `{ "username": "string", "password": "string" }`
**Response 200:** `{ "token": "jwt...", "user": { ... } }`

---

## Protected Endpoints (require JWT)

### Dashboard
- `GET /api/dashboard/overview` — Stats: active tourists, alerts, IDs issued
- `GET /api/dashboard/active-tourists` — All active tourists with latest location
- `GET /api/dashboard/analytics?days=30` — Alerts over time, top zones

### Alerts
- `GET /api/alerts?status=&alert_type=&page=&limit=` — List alerts
- `GET /api/alerts/:id` — Get single alert with tourist info
- `GET /api/alerts/recent` — Last 10 alerts
- `POST /api/alerts` — Create new alert (police, admin)
- `PATCH /api/alerts/:id` — Update status (police, tourism, admin)

### Digital IDs
- `GET /api/digital-ids?status=&search=&page=&limit=` — List all IDs
- `GET /api/digital-ids/:touristId` — Get ID for specific tourist

### Zones
- `GET /api/zones` — List all zones
- `GET /api/zones/:id` — Get single zone
- `POST /api/zones` — Create zone (admin only)
- `PUT /api/zones/:id` — Update zone (admin only)
- `DELETE /api/zones/:id` — Delete zone (admin only)

### E-FIRs
- `GET /api/efirs?status=&page=&limit=` — List all E-FIRs
- `POST /api/efirs/generate/:alertId` — Generate E-FIR PDF (police, admin)
- `GET /api/efirs/:id/download` — Download E-FIR PDF
- `PATCH /api/efirs/:id` — Update E-FIR status

### Auth / User Management
- `GET /api/auth/me` — Current user profile
- `GET /api/auth/users` — List all users (admin only)
- `POST /api/auth/register-admin` — Create user (admin only)
- `PUT /api/auth/users/:id` — Update user (admin only)

### Location
- `POST /api/location-ping` — Record tourist location ping
