# 🛡️ Safar Sathi — Smart Tourist Safety Monitoring & Incident Response System

[![Live Demo](https://img.shields.io/badge/Live_Demo-Safar_Sathi-00C853?style=for-the-badge&logo=render&logoColor=white)](https://safar-frontend.onrender.com)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-336791?style=for-the-badge&logo=postgis&logoColor=white)](https://postgis.net/)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

> 🌐 **Live Web Application:** [Safar Sathi](https://safar-frontend.onrender.com)

**Safar Sathi** is an end-to-end, multi-layered smart tourist safety monitoring and incident response platform. It proactively identifies threats and enables swift intervention by combining blockchain-secured identities, spatial analytics, AI-driven behavioral analysis, and automated emergency dispatch.

---

## 🚀 Key Features

*   **Multilingual Support:** Dynamic localization across the UI (English, Hindi, Bengali, Assamese) for accessibility.
*   **10-Second Voice SOS & AI Triage:** One-tap panic button records 10 seconds of audio. An automated AI voice assistant immediately asks critical triage questions (e.g., *"Are you injured?"*) to categorize urgency.
*   **Behavioral "Digital Twin" AI:** Python/Flask microservice uses an **Isolation Forest** model to detect route deviations and anomalies, adjusting risk scores dynamically based on crowd density and weather.
*   **PostGIS Spatial Analytics:** Live geo-fencing via `ST_Contains` spatial queries to monitor tourist locations against High-Risk or Restricted zones, paired with real-time density heatmaps.
*   **Blockchain Digital Tourist IDs:** Secure, tamper-proof identification generation using a SHA-256 hash-chain ledger, keeping sensitive KYC data strictly off-chain (AES-256 encrypted).
*   **Offline IoT Integration:** Wearable hardware (ESP32/LoRaWAN) tracks users in cellular dead zones and triggers immediate SOS alerts bypassing the standard queue.
*   **Automated E-FIR Pipeline:** Instant generation of official PDF incident reports (`PDFKit`) containing verified KYC, cryptographic hashes, and GPS coordinates.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend (Presentation)** | Next.js 16 (App Router), Tailwind CSS, Context API, Leaflet/Mapbox |
| **Backend (Application)** | Node.js, Express.js, TypeScript, Socket.io, JWT, PDFKit |
| **Database (Data)** | PostgreSQL 14+, PostGIS, Knex ORM |
| **AI/ML Service** | Python 3.10, Flask, Scikit-Learn (Isolation Forest) |
| **Blockchain** | Custom SHA-256 Hash-Chain Module (Node.js) |

---

## 📁 Project Structure

```text
safar-sathi/
├── frontend/         # Next.js UI, Map components, i18n context
├── backend/          # Express.js REST APIs, Socket gateways, PDF gen
├── blockchain/       # Block creation & SHA-256 ledger validation
├── ai-service/       # Python/Flask ML models (Risk scoring)
└── docs/             # Architecture diagrams and system specs
