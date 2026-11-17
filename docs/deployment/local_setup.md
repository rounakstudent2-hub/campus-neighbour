# Campus Neighbor - Local Development & Setup Guide

This guide details the complete local-first setup procedure for **Campus Neighbor** without mandatory Docker or external cloud dependencies.

---

## 1. Prerequisites

- **Python:** 3.10 to 3.13 (Python 3.13.7 is pre-configured on this system)
- **Node.js:** v18 or later (Node v24.14.0 is installed)
- **Package Managers:** `npm` and `pip`
- **Operating System:** Windows 10/11, macOS, or Linux

---

## 2. Directory Structure Overview

```
project-root/
├── frontend/        # React 18 + TypeScript + Vite + Tailwind CSS (Port 5173)
├── backend/         # FastAPI + SQLAlchemy 2.0 + Alembic (Port 8000)
├── ai_service/      # Dedicated Python AI/ML microservice (Port 8001)
├── database/        # PostgreSQL DDL schema & data dictionary
├── docs/            # Architecture, API & deployment documentation
└── scripts/         # Automated test and multi-service launchers
```

---

## 3. Quick Start (One-Click Launchers)

### Method A: Using the Launcher Script (Recommended for Windows)

Double-click or run from command prompt:
```cmd
scripts\start-all.bat
```
Or with PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
```

This starts all three services in independent, dedicated terminal windows:
- **Frontend Web UI:** `http://localhost:5173`
- **Backend FastAPI Swagger Docs:** `http://localhost:8000/docs`
- **AI Microservice Health:** `http://localhost:8001/health`

---

## 4. Manual Step-by-Step Setup

### Step 4.1: Database & Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Set up environment variables (copy `.env.example` if needed):
   ```bash
   copy .env.example .env
   ```
3. Run Alembic database migrations:
   ```bash
   python -m alembic upgrade head
   ```
4. Start the backend server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Note: On initial startup, the backend automatically seeds 5 demo accounts and sample tasks across Indiranagar & Koramangala.*

### Step 4.2: AI Microservice Setup

1. Open a second terminal and navigate to `ai_service/`:
   ```bash
   cd ai_service
   ```
2. Start the AI service daemon:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

### Step 4.3: Frontend Setup

1. Open a third terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm.cmd install
   ```
3. Start the Vite development server:
   ```bash
   npm.cmd run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 5. Pre-Seeded Demo Accounts

The database comes pre-populated with active demonstration profiles:

| Role | Email | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Neighbor** | `priya.neighbor@gmail.com` | `neighbor123` | Active neighbor in Indiranagar (4.9 rating) |
| **Neighbor** | `arun.neighbor@gmail.com` | `neighbor123` | Neighbor in Koramangala (4.8 rating) |
| **Student** | `rohan.student@university.edu` | `student123` | CS student with Python & tutoring skills |
| **Student** | `ananya.student@university.edu` | `student123` | Science student with pet care experience |
| **Admin** | `admin@marketplace.local` | `admin123` | Platform governance, KPI analytics, dispute oversight |

---

## 6. Running Automated Tests

To execute the entire end-to-end verification suite across all three tiers:

```cmd
scripts\run-tests.bat
```
Or via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-tests.ps1
```

This verifies:
1. AI Service NLP models, TF-IDF vectorizer, and fair-pricing regressions.
2. Backend API routes, JWT security, Haversine geospatial filters, and repositories.
3. Frontend TypeScript strict compilation and Vite production bundle.
