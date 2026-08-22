# 🛡️ Safar — Smart Tourist Safety Monitoring & Incident Response System

[![Live Demo](https://img.shields.io/badge/Live_Demo-safar--frontend.onrender.com-00C853?style=for-the-badge&logo=render&logoColor=white)](https://safar-frontend.onrender.com)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-336791?style=for-the-badge&logo=postgis&logoColor=white)](https://postgis.net/)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

> 🌐 **Live Web Application:** [https://safar-frontend.onrender.com](https://safar-frontend.onrender.com)

**Safar** is an end-to-end, multi-layered smart tourist safety monitoring and incident response platform. By combining **Blockchain-backed Digital IDs**, **PostGIS Spatial Geo-Fencing**, **AI Behavioral Anomaly Detection**, **IoT Offline Gateway Connectivity**, and **Automated Emergency Response Services**, Safar proactively identifies threats and enables swift intervention before critical situations escalate.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Database & PostGIS Setup](#2-database--postgis-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. AI Microservice Setup](#4-ai-microservice-setup)
- [Environment Variables](#-environment-variables)
- [Default Login Credentials](#-default-login-credentials)
- [API Documentation](#-api-documentation)
- [Data Privacy & Security](#-data-privacy--security)
- [License](#-license)

---

## 🚀 Key Features

### 1. 🌐 Multilingual Accessibility & Localization
- Built-in dynamic language context switcher supporting **English**, **Hindi (हिन्दी)**, **Bengali (বাংলা)**, and **Assamese (অসমীয়া)**.
- Tailored UI localization across the Tourist Mobile-Web App, Police Command Panel, and Tourism Department Dashboard.

### 2. 🎙️ 10-Second Automatic Voice SOS & AI Triage
- One-tap emergency panic trigger with automatic **10.0-second ambient audio recording** (MediaRecorder with Web Audio API fallback).
- Real-time countdown ring, auto-stop recording mechanism, and inline audio playback for dispatchers.
- **AI "First Response" Voice Assistant**: Interactive automated triage asking critical incident questions (*"Are you injured? Is anyone with you?"*) to categorize urgency before responder arrival.

### 3. 🧠 Behavioral "Digital Twin" Risk Scoring
- Python/Flask microservice running an **Isolation Forest** unsupervised ML model to detect route deviations, prolonged inactivity, and sudden telemetry drop-offs.
- Contextual risk engine dynamically scaling scores based on live PostGIS crowd density, time-of-day, local weather alerts, and historical incident heatmaps.

### 4. 🗺️ PostGIS Spatial Analytics & Dynamic Geo-Fencing
- High-performance spatial indexing (`GIST`) and `ST_Contains` spatial joins to evaluate tourist locations against active boundary polygons.
- Admin-configurable zones: **Restricted**, **High-Risk**, and **IoT-Only** zones.
- Live heatmaps displaying tourist density grids and active distress hotspots.

### 5. 🔗 Blockchain-Backed Digital Tourist IDs
- Tamper-proof, time-bound Digital Tourist IDs generated upon registration using a **SHA-256 Hash-Chain Ledger**.
- Off-chain storage for sensitive KYC records (encrypted with AES-256) paired with on-chain cryptographic hashes.
- Fast authority verification via instant QR Code scanning.

### 6. 📄 Automated e-FIR & Rapid Dispatch Pipeline
- Automatic PDF pre-filling and generation using `PDFKit` upon distress signal confirmation.
- Includes verified KYC details, emergency contacts, cryptographic hash signatures, and last known GPS coordinates.

### 7. 📡 Offline IoT & LoRaWAN Gateway Integration
- Hardware wearable integration (ESP32 / LoRaWAN) for tracking in signal-dead zones (e.g., deep forests, high altitudes).
- Direct panic button hardware override that bypasses ML queue processing for immediate dispatcher alert creation.

---

## 🏗️ System Architecture

```text
                                  +---------------------------------------+
                                  |         PRESENTATION LAYER            |
                                  |   Next.js 16 + Tailwind CSS + i18n    |
                                  |  (Tourist Web / Police / Admin UI)   |
                                  +-------------------+-------------------+
                                                      |
                                          REST APIs / Socket.IO
                                                      |
                                                      v
                                  +-------------------+-------------------+
                                  |    APPLICATION SERVICE LAYER (Node)   |
                                  |
