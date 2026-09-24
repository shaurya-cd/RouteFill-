# RouteFill AI - Intelligent Dead-Mileage & Return-Load Platform

A complete intelligent freight platform combining a modern frontend, a high-throughput 3NF PostgreSQL Node.js backend, and a Scikit-learn machine learning ensemble service.

## Project Structure

```text
RouteFillAi/
├── routefill-backend/       # Node.js + Express.js + TypeScript + Sequelize ORM (Port 5000)
│   ├── src/
│   │   ├── config/          # Database & Environment configuration
│   │   ├── models/          # 3NF Sequelize Models (User, Role, Truck, Load, Trip, Outcome, etc.)
│   │   ├── services/        # Business logic & 5-stage ML recommendation pipeline
│   │   ├── controllers/     # Thin HTTP controllers
│   │   ├── routes/          # REST endpoints
│   │   ├── middleware/      # JWT auth, role check, validation, error handling
│   │   ├── seeders/         # Indian freight corridors & historical training data seeder
│   │   └── docs/            # Swagger OpenAPI documentation (/api/docs)
│   └── README.md
│
├── ml-service/              # Python FastAPI Machine Learning Microservice (Port 8000)
│   ├── app/
│   │   ├── models/          # 4 Scikit-learn models (Dead Mileage, Acceptance, Success, Profit)
│   │   ├── services/        # Feature engineering, vectorized scoring, continuous retraining
│   │   └── routers/         # /predict/dead-mileage, /predict/recommendation-scores, /train
│   └── trained_models/      # Versioned Joblib model bundles (e.g. v1.0, v1.1)
│
├── routefill-canvas/        # Frontend UI (React + Vite + Tailwind CSS)
│
└── test_e2e.ps1             # Automated 8-phase end-to-end integration test
```

## Quick Start

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running on port 5432 with database `routefill_db`.
Run the database seeder to populate tables and initial historical data:
```powershell
cd routefill-backend
npm install
npm run seed
```

### 2. Start Python AI/ML Microservice
```powershell
cd ml-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Swagger UI: `http://127.0.0.1:8000/docs`

### 3. Start Node.js Express Backend
```powershell
cd routefill-backend
npm run dev
```
Swagger UI: `http://localhost:5000/api/docs`

### 4. Run End-to-End Automated Tests
```powershell
powershell -ExecutionPolicy Bypass -File test_e2e.ps1
```
All 8 integration phases will execute and verify the full system automatically.
