# RouteFill AI - Backend & AI/ML Recommendation Platform

> Intelligent dead-mileage prediction and return-load recommendation platform for commercial trucking and fleet owners.

---

## 1. High-Level Architecture

```text
Frontend (Next.js / Vite / React)
        │
        │ REST API (Bearer JWT Auth)
        ▼
Node.js + Express.js Backend (Port 5000)
  ├── Route -> Controller -> Service -> Model Architecture
  ├── 3NF PostgreSQL via Sequelize ORM
  ├── Rule-Based Operational Filters (Physical Constraints)
  ├── Geospatial Feature Engineering (Haversine & Bearing Alignment)
  ├── Multi-Factor Decision Engine (Weighted Expected Outcome Score)
  └── Interactive Swagger OpenAPI Docs (/api/docs)
        │
        ├─────────────────────────────► PostgreSQL Database (Port 5432)
        │                                 ├── 3NF Normalized Schema
        │                                 ├── Immutable Trips & Audit Logs
        │                                 └── Historical Recommendation Outcomes
        │
        └─────────────────────────────► Python FastAPI ML Microservice (Port 8000)
                                          ├── Model 1: Dead Mileage Classifier & Regressor
                                          ├── Model 2: Owner Acceptance Probability
                                          ├── Model 3: Trip Success Probability
                                          ├── Model 4: Realized Actual Profit Regressor
                                          ├── Versioned Joblib Artifacts (/trained_models)
                                          └── Continuous Retraining Pipeline (/train)
```

---

## 2. Database Normalization (3NF)

The PostgreSQL schema is strictly designed according to **Third Normal Form (3NF)**:

### 1NF (First Normal Form)
* Every column stores atomic, non-divisible scalar values (e.g., latitude and longitude are separate numerical coordinates; user roles are decoupled from user records).
* Every table has an explicit primary key (`id`), eliminating duplicate rows and preventing comma-separated arrays or unstructured object bags.

### 2NF (Second Normal Form)
* The schema adheres to 1NF.
* All non-key attributes are fully functionally dependent on the entire primary key.
* Multi-attribute relations (e.g., `user_roles`) are isolated in dedicated junction tables with composite foreign key constraints.

### 3NF (Third Normal Form)
* The schema adheres to 2NF.
* No transitive functional dependencies exist (`X -> Y` where `Y` is non-key and depends on another non-key column).
* Specifically:
  * `roles` separates access privileges from user records.
  * `truck_types` separates vehicle classifications and physical descriptions from individual fleet vehicle records.
  * `locations` standardizes geographic names, states, cities, and coordinates so trips and loads refer to shared, immutable geospatial nodes.
  * `recommendation_outcomes` separates physical operational outcomes (real profits, delays, toll costs) from the AI inference record itself (`recommendations`), maintaining auditability.

---

## 3. Database Entity Relationship (ER) Summary

```text
       ┌──────────────┐             ┌──────────────┐
       │    roles     │             │ truck_types  │
       └──────┬───────┘             └──────┬───────┘
              │ 1                          │ 1
              │                            │
              ▼ N                          ▼ N
       ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
       │  user_roles  │             │    trucks    │◄────────────┤  locations   │
       └──────▲───────┘             └──────┬───────┘ 1         N └──────┬───────┘
              │ N                          │                            │
              │                            │ 1                          │
       ┌──────┴───────┐                    ▼ N                          │
       │    users     ├──────────────────► trips ───────────────────────┤
       └──────┬───────┘ 1                N                              │
              │                                                         │
              │ 1 (poster)                                              │
              ▼ N                                                       │
       ┌──────────────┐                                                 │
       │    loads     ├─────────────────────────────────────────────────┘
       └──────┬───────┘ 1 (pickup & destination)
              │
              ▼ N
       ┌──────────────┐ 1           1 ┌─────────────────────────┐
       │recommendation├──────────────►│ recommendation_outcomes │
       └──────────────┘               └─────────────────────────┘
```

---

## 4. Multi-Stage AI Recommendation Pipeline

Rather than relying on a naive distance sort or price tag calculator, RouteFill AI executes a true 5-stage hybrid decision pipeline:

```text
Target Truck & Current Location
        ↓
[Stage 1: Candidate Retrieval]
Locate active marketplace loads near vehicle destination
        ↓
[Stage 2: Rule-Based Operational Filtering (filterFeasibleLoads)]
Physical & business validation:
  • Truck capacity >= Load weight
  • Truck type compatibility (e.g., OPEN_TRUCK, CONTAINER, REFRIGERATED)
  • Load status == AVAILABLE
  • Pickup location reachable within operational threshold
        ↓
[Stage 3: Geospatial Feature Engineering (buildRecommendationFeatures)]
Computes:
  • Haversine pickup distance & trip distance
  • Route similarity vector alignment (bearing cosine similarity)
  • Capacity utilization percentage
  • Price-to-market benchmark ratio
  • Estimated fuel & toll costs
        ↓
[Stage 4: Python ML Ensemble Predictions]
Dispatches vectorized batch payload to FastAPI microservice:
  • Dead Mileage Model: Probability of empty backhaul + predicted deadhead km
  • Acceptance Model: Likelihood owner will accept the load offer
  • Success Model: Probability of timely, undamaged completion
  • Profit Model: Gradient boosted regression forecasting realized net profit
        ↓
[Stage 5: Decision & Optimization Engine (calculateFinalRecommendationScore)]
Calculates composite expected outcome score:
  Expected Value = Predicted Profit × Acceptance Prob × Success Prob
  Adjusted for pickup detour distance and dead-mileage reduction incentive
        ↓
Persist to recommendations table & return top-ranked opportunities
        ↓
Owner Accepts/Rejects -> Real-World Trip Completed
        ↓
Record Outcome to recommendation_outcomes
        ↓
Retrain ML Ensemble on Actual Outcomes (Continuous Learning)
```

---

## 5. Machine Learning Ensemble Details

| Model | Technique | Target | Key Features |
| :--- | :--- | :--- | :--- |
| **Model 1: Dead Mileage** | Random Forest Classifier + Gradient Boosting Regressor | `dead_mileage_probability`, `risk_level`, `predicted_empty_distance_km` | Dest coordinates, completion hour, day of week, active nearby freight volume, corridor historical empty rate. |
| **Model 2: Load Acceptance** | Random Forest Classifier | `acceptance_probability` | Pickup distance, route similarity, capacity utilization, offered price/km, price-to-market ratio, owner history. |
| **Model 3: Trip Success** | Gradient Boosting Classifier | `success_probability` | Trip distance, cargo type (e.g., refrigerated/fragile), historical carrier delay rates, waiting friction. |
| **Model 4: Net Profit** | Gradient Boosting Regressor | `predicted_profit` (INR) | Offered revenue, distance, dynamic fuel variance, toll multipliers, loading wait times, vehicle capacity. |

---

## 6. Installation & Quickstart

### Prerequisites
* **Node.js**: v18+ (tested on v20.20.0)
* **Python**: v3.10+ (tested on v3.14.2)
* **PostgreSQL**: v14+ (tested on v18.0)

### 1. Configure Environment Variables
Create `.env` in `routefill-backend/`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=routefill_db
DB_USER=postgres
DB_PASSWORD=root
DB_LOGGING=false
JWT_SECRET=routefill_super_secret_jwt_key_2026_secure_fleet_engine
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_TIMEOUT=10000
CORS_ORIGIN=*
```

### 2. Seed Database
```powershell
cd c:\codes\RouteFillAi\routefill-backend
npm install
npm run seed
```

Default credentials created by seeder:
* **Admin**: `admin@routefill.ai` / `password123`
* **Truck Owner**: `owner@fleet.in` / `password123`
* **Load Poster**: `shipper@cargo.in` / `password123`

### 3. Launch Python ML Microservice
```powershell
cd c:\codes\RouteFillAi\ml-service
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Health Check: `http://127.0.0.1:8000/health`

### 4. Launch Node.js Express Backend
```powershell
cd c:\codes\RouteFillAi\routefill-backend
npm run dev
```
Health Check: `http://localhost:5000/health`  
Interactive Swagger Docs: `http://localhost:5000/api/docs`

---

## 7. API Reference Summary

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Create user account (Admin, Truck Owner, Load Poster).
* `POST /api/auth/login` - Authenticate credentials and receive Bearer JWT.
* `GET  /api/auth/me` - Get profile of authenticated user.

### Fleet & Trucks (`/api/trucks`)
* `POST   /api/trucks` - Register a vehicle (Owner scoped, registration number uniqueness validated).
* `GET    /api/trucks` - List trucks belonging to authenticated owner.
* `GET    /api/trucks/:id` - Get specific truck details.
* `PATCH  /api/trucks/:id` - Update truck status or location.
* `DELETE /api/trucks/:id` - Remove vehicle from fleet.

### Loads Marketplace (`/api/loads`)
* `POST   /api/loads` - Post a new freight shipment.
* `GET    /api/loads` - List available marketplace loads.
* `GET    /api/loads/nearby?latitude=19.0760&longitude=72.8777&radius=250` - Geospatial radius search.
* `GET    /api/loads/:id` - Retrieve specific shipment.
* `PATCH  /api/loads/:id` - Update load details/status.
* `DELETE /api/loads/:id` - Cancel load posting.

### Trips (`/api/trips`)
* `POST  /api/trips` - Schedule line-haul journey (marks truck `IN_TRANSIT`).
* `GET   /api/trips` - Query trips with origin/destination coordinates.
* `PATCH /api/trips/:id` - Update trip status (`COMPLETED` triggers automated deadhead prediction).

### Dead Mileage AI (`/api/ai`)
* `POST /api/ai/dead-mileage/predict` - Predicts empty travel probability and empty distance for a truck/trip.

### Recommendations & Feedback Loop (`/api/recommendations`)
* `POST /api/recommendations/generate/:truckId` - Runs 5-stage pipeline, scores return loads, persists recommendations.
* `GET  /api/recommendations/truck/:truckId` - Query previously generated recommendations.
* `GET  /api/recommendations/:id` - Retrieve recommendation by ID.
* `POST /api/recommendations/:id/outcome` - **Records real-world outcome** (accepted, completed, actual profit, tolls, fuel, delays).

### Admin & Model Retraining (`/api/admin`)
* `POST /api/admin/ml/retrain` - Pulls historical feedback outcomes from PostgreSQL, triggers Python retraining, yields updated model version with accuracy and MAE metrics.
* `GET  /api/admin/analytics` - Platform KPI overview (empty km eliminated, total profit saved).
* `GET  /api/admin/users` - User directory and role assignments.

---

## 8. Running Automated End-to-End Tests

Run the complete 8-phase automated integration test:
```powershell
powershell -ExecutionPolicy Bypass -File c:\codes\RouteFillAi\test_e2e.ps1
```
Tests authentication, truck registration, geo proximity queries, trip lifecycles, dead-mileage AI, multi-stage load recommendation, feedback recording, and continuous ML retraining.
