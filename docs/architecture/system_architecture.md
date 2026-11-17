# Campus Neighbor - System Architecture Specification

## 1. Executive Architecture Summary

**Campus Neighbor** is a hyperlocal micro-monolith platform connecting university students with neighboring residents for chore assistance, micro-gigs, and academic support. The system is engineered around high concurrency, localized geospatial filtering (Haversine formula), secure two-sided escrow financial lifecycles, and a dedicated AI/ML inference service for student matchmaking and fair-pricing recommendations.

---

## 2. Multi-Tier System Topology

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

---

## 3. Backend Layered Architecture

The FastAPI backend follows strict separation of concerns, eliminating circular dependencies and isolating database mechanics from HTTP transport:

```
FastAPI HTTP Router (app/api/v1/endpoints/)
  │   - Request validation via Pydantic v2 schemas
  │   - HTTP Status code management & CORS headers
  │   - JWT Bearer Authentication & Role-based Access Control (RBAC)
  ▼
Application Service Layer (app/services/)
  │   - Business transaction boundaries & validation logic
  │   - Financial state machines (Razorpay Escrow Lifecycle)
  │   - Geospatial distance calculations & radius enforcement
  │   - AI service invocation & heuristic fallback orchestration
  ▼
Repository Layer (app/repositories/)
  │   - Database persistence abstraction (CRUD & custom queries)
  │   - Optimized SQLAlchemy joins, eager loading, and filtering
  │   - Prevents SQL injection via parameterized ORM queries
  ▼
SQLAlchemy ORM Entities (app/models/)
  │   - Relational definitions with foreign key cascades
  │   - UTC timestamp auditing (`created_at`, `updated_at`)
  ▼
PostgreSQL / SQLite Storage Engine
```

---

## 4. AI / ML Microservice Architecture

The AI subsystem operates as an autonomous service (`ai_service/`) with independent preprocessing, feature extraction, and model inference pipelines:

```
Input Request (Task Metadata + Student Profile)
  │
  ▼
app/preprocessing/text_cleaner.py
  │   - Lowercasing, punctuation stripping, stopword elimination
  │   - Domain token normalization (e.g., "dog-walking" -> "dog", "walking")
  ▼
app/models/matchmaker.py
  │   - Pure-Python TF-IDF Vectorizer: converts task and skills to sparse term vectors
  │   - Cosine Similarity: evaluates directional alignment in semantic space
  │   - Keyword Overlap Heuristic: direct domain skill matching
  │   - Student Reputation Prior: weighted 5-star rating scaling factor
  │   - Output: Match Score (0.0 - 100.0) and Tier ("Excellent", "Strong", "Moderate")
  ▼
app/models/price_recommender.py
  │   - Category baseline tariffs (₹180 - ₹650)
  │   - Distance decay penalty (₹18 / km beyond 2.0 km)
  │   - Estimated duration scaling (₹140 / hr)
  │   - Complexity keyword multiplier ("heavy", "urgent", "exam", "specialized")
  ▼
app/models/safety_classifier.py
  │   - Lexical content audit for prohibited, academic dishonesty, or hazardous items
  ▼
FastAPI API Delivery (Port 8001 -> Port 8000 -> Client UI)
```

---

## 5. Escrow Payment State Machine

The financial lifecycle is governed by an immutable state machine protecting both student and neighbor:

```
[Neighbor Posts Task]
         │
         ▼
  status: "pending"  ───────────────┐
         │                          │
  [Application Accepted]            │ [Cancelled by Creator]
         │                          │
         ▼                          ▼
  status: "escrow_held"      status: "cancelled"
         │
  [Student Completes Chore]
         │
         ▼
  status: "completed"
         │
         ├──────────────────────────┐
         ▼                          ▼
  [Neighbor Approves Work]   [Dispute Filed / Fraud Flag]
         │                          │
         ▼                          ▼
  status: "released"         status: "refunded"
  (Funds credited to         (Escrow returned to
   student bank account)      neighbor payment method)
```

---

## 6. Security & Non-Functional Specifications

1. **Authentication:** Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256, 7-day expiration.
2. **Password Hashing:** Native `bcrypt` using salted blowfish with cost factor 10.
3. **Authorization:** Role-Based Access Control (`neighbor`, `student`, `admin`) enforced at route dependencies.
4. **Resilience & Fallback:** The Backend API communicates with the AI microservice via synchronous HTTP with rapid 400ms timeouts; if the AI service is unreachable, it automatically activates an in-process deterministic fallback, guaranteeing 100% platform uptime.
5. **Database Portability:** Zero-code difference between local SQLite development and PostgreSQL cloud deployment.
