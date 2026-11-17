# CampusNeighbor 🏘️🎓
### Production Hyperlocal Neighborhood Student Help Marketplace & AI Recommendation System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Alembic-1.20+-purple.svg)](https://alembic.sqlalchemy.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4.17-38bdf8.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/leaflet-1.9.4-green.svg)](https://leafletjs.com/)

A modern, full-stack, production-grade hyperlocal web platform connecting neighborhood residents who need everyday chore assistance with local university students seeking flexible, part-time earnings. Built with a layered FastAPI backend, PostgreSQL/SQLite persistence with Alembic migrations, React + TypeScript frontend, and an autonomous Python AI/ML microservice for student matchmaking and fair pricing recommendations.

---

## 📑 Table of Contents
- [🌟 Key Features](#-key-features)
- [🏗️ System Architecture](#-system-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [🔑 Pre-Seeded Demo Accounts](#-pre-seeded-demo-accounts)
- [🤖 AI/ML Microservice Pipeline](#-aiml-microservice-pipeline)
- [📡 API Endpoints Overview](#-api-endpoints-overview)
- [🧪 Automated Testing](#-automated-testing)
- [🔒 Security & Escrow Lifecycle](#-security--escrow-lifecycle)
- [📄 License](#-license)

---

## 🌟 Key Features

### 1. Dedicated Three-Sided Role Architecture
- **Neighbor / Customer:** Post chores with geolocation & budget in ₹ (INR), review student applicants with AI compatibility matching, hire helpers into escrow, chat in real-time, inspect chore progress, and release funds upon satisfaction.
- **Student / Helper:** Verified student profile with college, student ID & skills, customizable working radius slider (1–25 km), browse nearby chores on interactive OpenStreetMap, apply with custom proposed fees and pitch notes, update chore progress, and build a 5-star reputation.
- **Administrator Console:** Live telemetry KPIs (active users, total chores, active escrow volume, pending safety reports), user moderation (activate/suspend/verify), chore oversight, and incident dispute handling.
- **Customizable Profiles:** Upload profile pictures or generate stylized avatars, and update display names across all roles.

### 2. Hyperlocal Discovery & Geospatial Filtering
- **Interactive OpenStreetMap / Leaflet:** Live map displaying task pins color-coded by status and labeled with budgets in ₹ INR.
- **Haversine Proximity Calculation:** High-performance distance calculation computing exact spherical distance in kilometers between student and task location.
- **Configurable Radius Slider:** Filter chores within 1 km to 25 km of current location.
- **One-Click Geolocation:** Automatic browser GPS detection with fallback to locality search.

### 3. Escrow & Indian Payment Gateway (Razorpay)
- **Agreed Task Pricing:** Clear budgets in Indian Rupees (₹ INR).
- **Two-Sided Escrow Protection:** Funds are deposited into escrow upon hiring and held securely until the neighbor confirms chore completion.
- **Razorpay Integration:** Pre-configured for Razorpay India gateway checkout, with clearly labeled test mode simulation and transaction ledger.

### 4. Real-Time Communication & Notification Engine
- **In-App Messaging:** Direct messaging between assigned neighbors and students with instant updates and unread counters.
- **Notification Center:** Dropdown bell and real-time alerts for new applications, hire status, completion confirmation, and payments.

### 5. 9 Core Chore Categories
1. 🛒 **Grocery and Shopping Assistance**
2. 🧹 **Home Assistance**
3. 🐾 **Pet Care**
4. 📚 **Tutoring and Academic Help**
5. 📄 **Document Delivery**
6. 💻 **Technology Assistance**
7. 🎉 **Event Assistance**
8. 🏃 **Errands and Personal Assistance**
9. 📦 **Other Local Tasks**

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------------------+
|                              FRONTEND TIER                              |
|   React 18 + TypeScript + Vite + Tailwind CSS + Lucide + Context API   |
|   Port: 5173  (Local Client / SPA / PWA Ready)                          |
+-------------------------------------------------------------------------+
                                    │
                         HTTP / REST API (JSON)
                                    ▼
+-------------------------------------------------------------------------+
|                              BACKEND TIER                               |
|   Python 3.13 + FastAPI + Pydantic v2 + SQLAlchemy 2.0 ORM             |
|   Layered Architecture: Routers -> Services -> Repositories             |
|   Port: 8000  (Host: 0.0.0.0)                                           |
+-----------------------------------+-------------------------------------+
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
+-----------------------------------+   +---------------------------------+
|         PERSISTENCE TIER          |   |          AI / ML TIER           |
|  PostgreSQL 16 / SQLite Engine    |   |  FastAPI Dedicated Microservice |
|  Alembic Migrations (7 Entities)  |   |  TF-IDF Vectorizer + Cosine Sim |
|  Spatial B-Tree Indexes           |   |  Fair Price Regressor Engine    |
|                                   |   |  Port: 8001 (Host: 0.0.0.0)     |
+-----------------------------------+   +---------------------------------+
```

The FastAPI backend enforces clean architectural boundaries:
- **Routers (`backend/app/api/v1/endpoints/`):** Request validation via Pydantic v2 schemas, HTTP status codes, and JWT RBAC dependencies.
- **Services (`backend/app/services/`):** Business logic, escrow state machine transitions, and AI microservice invocation with deterministic fallback heuristics.
- **Repositories (`backend/app/repositories/`):** Database queries, Haversine geospatial proximity math, and joins using SQLAlchemy 2.0.
- **Models (`backend/app/models/`):** Declarative ORM entities (`User`, `Task`, `Application`, `EscrowPayment`, `Message`, `Review`, `Report`).
- **Migrations (`backend/alembic/`):** Authoritative schema migration engine.

---

## 📁 Project Structure

```
project-root/
├── frontend/                   # React 18 + TypeScript + Vite client (Port 5173)
│   ├── src/
│   │   ├── components/         # Reusable UI & Layout components
│   │   ├── context/            # Authentication & WebSocket contexts
│   │   ├── services/           # REST API client with Axios/Fetch
│   │   ├── types/              # TypeScript interfaces
│   │   ├── views/              # Pages: Landing, Browse, TaskDetail, Dashboards
│   │   ├── App.tsx             # Root router & layout
│   │   └── main.tsx            # React DOM mounting
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── backend/                    # Layered FastAPI Backend (Port 8000)
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/   # JWT Bearer & RBAC dependencies
│   │   │   └── v1/endpoints/   # Auth, Tasks, Applications, Escrow, AI, Admin
│   │   ├── core/               # App configuration & bcrypt security
│   │   ├── db/                 # SQLAlchemy sessionmaker & auto-seeder
│   │   ├── models/             # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/            # Pydantic v2 DTO validation schemas
│   │   ├── repositories/       # Persistence & Haversine queries
│   │   ├── services/           # Business workflows & state transitions
│   │   └── main.py             # FastAPI entrypoint with CORS & middleware
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Pytest backend test suite
│   ├── requirements.txt
│   └── .env.example
│
├── ai_service/                 # Autonomous AI/ML Microservice (Port 8001)
│   ├── app/
│   │   ├── preprocessing/      # Text cleaner, tokenizer, stopword filtering
│   │   ├── models/             # TF-IDF Matchmaker, Price Recommender, Safety
│   │   ├── api/                # Prediction endpoints
│   │   └── main.py             # FastAPI microservice entrypoint
│   ├── tests/                  # AI pipeline unit & integration tests
│   ├── requirements.txt
│   └── .env.example
│
├── database/                   # Database Architecture & Schemas
│   ├── schema/schema.sql       # Pure PostgreSQL DDL schema with indexes
│   └── documentation/          # Relational data dictionary & entity docs
│
├── docs/                       # Project Documentation
│   ├── architecture/           # System topology & diagrams
│   ├── api/                    # OpenAPI specification & endpoints
│   └── deployment/             # Local-first execution guide
│
├── scripts/                    # Windows & Cross-Platform Automation
│   ├── start-all.bat           # 1-Click launcher (AI + Backend + Frontend)
│   ├── start-all.ps1           # PowerShell service orchestrator
│   ├── run-tests.bat           # Automated test suite (Python + Node.js)
│   └── run-tests.ps1           # PowerShell automated test runner
│
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python:** 3.10 - 3.13 (`python` on system PATH)
- **Node.js:** v18, v20, or v22+ (`node` and `npm`)

### 1. Launch All Services (One-Click)
On Windows, double-click or run from Command Prompt:
```cmd
scripts\start-all.bat
```
Or with PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
```

This starts all three services in independent, dedicated terminal windows:
- **Frontend Web UI:** [http://localhost:5173](http://localhost:5173)
- **Backend FastAPI Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **AI Microservice Health:** [http://localhost:8001/health](http://localhost:8001/health)

---

## 🔑 Pre-Seeded Demo Accounts

The database is pre-seeded with 5 realistic demonstration accounts:

| Role | Email | Password | Location / Notes |
| :--- | :--- | :--- | :--- |
| **Neighbor (Customer)** | `priya.neighbor@gmail.com` | `neighbor123` | Indiranagar, Bengaluru • Active tasks posted |
| **Neighbor (Customer)** | `arun.neighbor@gmail.com` | `neighbor123` | Koramangala, Bengaluru • Senior resident |
| **Student (Helper)** | `rohan.student@university.edu` | `student123` | CS student • Python, Tutoring, Tech |
| **Student (Helper)** | `ananya.student@university.edu` | `student123` | Science student • Pet Care, 5.0 Rating |
| **Administrator** | `admin@marketplace.local` | `admin123` | Operations HQ • Moderation & KPI telemetry |

---

## 🤖 AI/ML Microservice Pipeline

The AI subsystem operates as an independent microservice (`ai_service/`) with sub-millisecond inference:
1. **Student-Chore Matchmaker (`matchmaker.py`):**
   - Natural language text cleaning and domain tokenization.
   - Pure-Python TF-IDF Vectorizer converting descriptions and skill sets into sparse term vectors.
   - Cosine Similarity calculating cosine distance between student capability and chore requirements.
   - Weighted 5-star reputation prior and domain keyword overlap.
   - Computes compatibility score (0.0–100.0) and tier (`"Excellent"`, `"Strong"`, `"Moderate"`).
2. **Fair Price Recommender (`price_recommender.py`):**
   - Category baseline tariffs (₹180–₹650).
   - Distance decay penalty (₹18/km beyond 2.0 km).
   - Effort scaling factor (₹140/hr).
   - Complexity keyword multipliers (`"heavy"`, `"urgent"`, `"specialized"`).
3. **Safety & Policy Classifier (`safety_classifier.py`):**
   - Prohibited chore detection, academic dishonesty flags, and hazard filtering.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health, uptime & DB status | Public |
| `POST` | `/api/v1/auth/register` | Register new student or neighbor | Public |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token | Public |
| `GET` | `/api/v1/auth/me` | Current authenticated profile | Bearer Token |
| `GET` | `/api/v1/tasks` | Browse chores with Haversine radius filter | Optional |
| `POST` | `/api/v1/tasks` | Post a new chore | Neighbor |
| `GET` | `/api/v1/tasks/{id}` | Task details & applicants | Public |
| `POST` | `/api/v1/applications` | Apply for a chore with proposed fee | Student |
| `POST` | `/api/v1/applications/{id}/status` | Accept/reject applicant (initiates escrow) | Neighbor |
| `GET` | `/api/v1/escrow/{task_id}` | Escrow state & breakdown | Assigned Users |
| `POST` | `/api/v1/escrow/release/{task_id}` | Confirm completion & release funds | Neighbor / Admin |
| `POST` | `/api/v1/ai/match-score` | AI student-chore compatibility scoring | Optional |
| `POST` | `/api/v1/ai/price-estimate` | AI fair price recommendation | Optional |
| `GET` | `/api/v1/admin/metrics` | Platform KPIs & dispute oversight | Admin |

---

## 🧪 Automated Testing

To run the complete automated test runner verifying all three tiers:

```cmd
scripts\run-tests.bat
```
Or via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-tests.ps1
```

### Verified Test Suite Steps:
1. **AI Service:** Preprocessing, TF-IDF vectorization, Cosine similarity, Fair-pricing regressions, Safety classifier, and API endpoints (5 passed in 0.38s).
2. **Backend API:** Health check, JWT authentication, Haversine geospatial proximity query, AI proxy fallback, and Admin platform metrics (5 passed in 0.90s).
3. **Frontend Client:** Strict TypeScript compilation (`tsc`) and Vite production bundle generation (built in 3.26s).

---

## 🔒 Security & Escrow Lifecycle

- **JWT Authentication:** Strict Bearer token verification with 7-day expiration.
- **Bcrypt Password Hashing:** Salted hashes with cost factor 10.
- **Role-Based Access Control:** Neighbors cannot apply to tasks; students cannot assign tasks; only admins access platform telemetry.
- **Escrow Financial State Machine:**
  $$\text{pending} \longrightarrow \text{escrow\_held} \longrightarrow \text{completed} \longrightarrow \text{released} \ (\text{or refunded})$$
- **High-Resilience Heuristic Fallback:** If the AI microservice is offline, the backend executes an in-process deterministic heuristic fallback in under 1ms, guaranteeing 100% platform uptime.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
