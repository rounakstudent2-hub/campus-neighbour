# Campus Neighbor - REST API Specification (v1)

Base URL: `http://localhost:8000/api/v1` (with backward-compatible alias at `/api`)

All requests and responses use `application/json`. Timestamps are ISO 8601 UTC.

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/register`
Creates a new student or neighbor account.

- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@university.edu",
  "password": "SecurePassword123",
  "role": "student",
  "phone": "+919876543210",
  "college": "Christ University, Bangalore",
  "student_id": "CU-2024-8841",
  "skills": ["Tutoring", "Mathematics", "Python"],
  "bio": "3rd year computer science undergraduate.",
  "lat": 12.9352,
  "lon": 77.6245
}
```
- **Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane.doe@university.edu",
    "role": "student",
    "rating": 5.0,
    "review_count": 0,
    "is_verified": false
  }
}
```

### `POST /auth/login`
Authenticates an existing user and returns a signed JWT.

- **Request Body:**
```json
{
  "email": "priya.neighbor@gmail.com",
  "password": "neighbor123"
}
```
- **Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": { ... }
}
```

### `GET /auth/me`
Retrieves the authenticated profile.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** Complete user entity.

---

## 2. Tasks Endpoints (`/tasks`)

### `GET /tasks`
Lists active tasks with optional Haversine geospatial proximity filtering and pagination.

- **Query Parameters:**
  - `lat` (float, optional): User's current latitude (e.g. `12.9784`)
  - `lon` (float, optional): User's current longitude (e.g. `77.6408`)
  - `radius` (float, default `15.0`): Search radius in kilometers (1 - 25 km)
  - `category` (string, optional): One of the 9 chore categories
  - `status` (string, default `open`): Task state filter
  - `skip` (int, default `0`), `limit` (int, default `20`)

- **Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Senior Citizen Smartphone & WhatsApp Setup",
    "description": "Help an elderly neighbor configure WhatsApp, Google Pay, and clean up spam apps.",
    "category": "Technology Assistance",
    "budget": 350.0,
    "status": "open",
    "lat": 12.9784,
    "lon": 77.6408,
    "location_name": "Indiranagar, Bangalore",
    "distance_km": 0.0,
    "creator_id": 1,
    "creator": {
      "id": 1,
      "name": "Priya Sharma",
      "rating": 4.9
    },
    "created_at": "2026-11-17T06:00:00Z"
  }
]
```

### `POST /tasks`
Creates a new chore or micro-gig (Requires `neighbor` or `admin` role).

- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "title": "Weekend Dog Walking (Golden Retriever)",
  "description": "Walk a friendly Golden Retriever around Defense Colony park for 1 hour.",
  "category": "Pet Care",
  "budget": 400.0,
  "lat": 12.9719,
  "lon": 77.6412,
  "location_name": "Defense Colony, Indiranagar",
  "estimated_hours": 1.0
}
```

### `GET /tasks/{task_id}`
Retrieves detailed information about a specific task, including creator profile and application count.

---

## 3. Applications & Bidding (`/applications`)

### `POST /applications`
Submits an application from a student for an open task.

- **Headers:** `Authorization: Bearer <token>` (Student only)
- **Request Body:**
```json
{
  "task_id": 1,
  "proposed_fee": 350.0,
  "pitch": "I am a CS student living 5 minutes away and have helped seniors set up tech before!"
}
```

### `GET /applications/task/{task_id}`
Returns all applications for a task (Accessible only by the task creator).

### `POST /applications/{application_id}/status`
Updates application status (`accepted`, `rejected`). Accepting an application assigns the task to the student and transitions the escrow to held.

---

## 4. Escrow & Payments (`/escrow`)

### `GET /escrow/{task_id}`
Retrieves the payment status for a specific task.

- **Response (200 OK):**
```json
{
  "id": 1,
  "task_id": 1,
  "amount": 350.0,
  "status": "escrow_held",
  "platform_fee": 17.5,
  "net_student_amount": 332.5,
  "razorpay_order_id": "order_campus_9921"
}
```

### `POST /escrow/release/{task_id}`
Releases held escrow funds to the student upon satisfactory task completion.

---

## 5. AI & Machine Learning Proxy (`/ai`)

### `POST /ai/match-score`
Computes an NLP-based compatibility score between a student and a chore.

- **Request Body:**
```json
{
  "task_title": "Python & Data Structures Assistance",
  "task_description": "Need guidance with binary trees and sorting algorithms",
  "task_category": "Tutoring and Academic Help",
  "student_skills": ["Python", "Algorithms", "Tutoring"],
  "student_bio": "3rd year computer science student",
  "student_rating": 4.9
}
```
- **Response (200 OK):**
```json
{
  "compatibility_score": 92.4,
  "match_tier": "Excellent",
  "highlighted_keywords": ["Python", "Algorithms", "Tutoring"],
  "confidence": 0.88
}
```

### `POST /ai/price-estimate`
Predicts a fair, hyperlocal pricing estimate for chores.

- **Request Body:**
```json
{
  "category": "Pet Care",
  "description": "Dog walking for 2 hours in Koramangala",
  "distance_km": 3.0,
  "estimated_hours": 2.0
}
```
- **Response (200 OK):**
```json
{
  "suggested_budget": 420.0,
  "min_budget": 340.0,
  "max_budget": 550.0,
  "currency": "INR",
  "explanation": "Calculated based on Pet Care standard baseline + 3.0km travel + 2.0hr effort."
}
```

---

## 6. System Health & Metrics

### `GET /health`
Returns system status, uptime, database connectivity, and active table statistics.
