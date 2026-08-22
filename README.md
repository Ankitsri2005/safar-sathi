## 🛡️ Safar Sathi: Project Overview

[![Live Demo](https://img.shields.io/badge/Live_Demo-Safar_Sathi-00C853?style=for-the-badge&logo=render&logoColor=white)](https://safar-frontend.onrender.com)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_Node_|_PostGIS_|_Python-black?style=for-the-badge)](#)

**Safar Sathi** is an end-to-end smart tourist safety monitoring platform. It proactively identifies threats using AI behavioral analysis, secures identities via blockchain, and tracks users in real-time through PostGIS geo-fencing and offline IoT gateways. Access the live application here: [Safar Sathi](https://safar-frontend.onrender.com).

## 🚀 Core Features & Architecture

| Component | Description & Technologies Used |
| :--- | :--- |
| **Multilingual UI** | Real-time context switcher for English, Hindi, Bengali, and Assamese using Next.js 16. |
| **Voice SOS & Triage** | 10-second ambient audio recording and automated AI voice triage for rapid emergency context. |
| **Digital Twin AI** | Python/Flask microservice running Isolation Forest to detect route deviations and inactivity. |
| **Spatial Analytics** | PostGIS `ST_Contains` queries for dynamic geo-fencing (Restricted/High-Risk zones) and heatmaps. |
| **Blockchain IDs** | SHA-256 hash-chain ledger for tamper-proof registration, keeping sensitive KYC data off-chain. |
| **Automated E-FIR** | Instant PDF report generation (`PDFKit`) combining verified identities and last-known GPS data. |

## 🗺️ 10-Phase Implementation Roadmap

| Phase | Objective | Key Deliverables |
| :--- | :--- | :--- |
| **1. Architecture** | System design & API mapping | Monorepo setup, OpenAPI contracts, UI wireframes. |
| **2. UI/UX Base** | Multilingual presentation layer | Next.js Tourist App and Admin Dashboard with Tailwind. |
| **3. Real-Time Core** | Node.js APIs & Socket Gateway | Express.js REST routes and Socket.IO namespaces. |
| **4. Spatial Engine** | Database & Geo-fencing | PostgreSQL + PostGIS integration for boundary alerts. |
| **5. Blockchain ID** | Tamper-proof verification | Node.js hash-chain ledger and AES-256 KYC encryption. |
| **6. AI Risk Model** | Behavioral anomaly detection | Python Flask service with Scikit-learn (Isolation Forest). |
| **7. IoT Gateway** | Offline wearable connectivity | ESP32/LoRaWAN tracking in cellular dead zones. |
| **8. Command Panel** | Centralized police dashboard | Mapbox GL JS live dispatch and heatmap visualization. |
| **9. SOS Pipeline** | Accessible emergency response | Web Audio API SOS recording and automated E-FIR generation. |
| **10. Deployment** | Stress testing & cloud hosting | E2E integration, Locust load testing, Render deployment. |

## 🛠️ Quick Start & API Integration

**Backend & Database Setup:** Clone the repository, configure your `.env` (Database credentials, JWT secret), and initialize the PostGIS database. Run `npm install`, followed by `npm run migrate` and `npm run seed`. Start the server with `npm run dev` (Port 5000). 

**Frontend & AI Setup:** Install Next.js dependencies and run `npm run dev` (Port 3000). For the AI engine, create a Python virtual environment, install `requirements.txt`, and start the Flask app (Port 5001).

| Method | Key Endpoint | Description (Requires JWT for protected routes) |
| :--- | :--- | :--- |
| `POST` | `/api/register` | Registers tourist and issues Blockchain Digital ID. |
| `GET` | `/api/verify-id/:id` | Verifies QR code authenticity against the hash-chain. |
| `POST` | `/api/location` | Transmits live GPS ping and triggers PostGIS check. |
| `POST` | `/api/efirs` | Compiles an automated E-FIR PDF upon distress signal. |
