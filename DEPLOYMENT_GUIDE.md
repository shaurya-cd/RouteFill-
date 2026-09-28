# RouteFill AI — 100% Free Cloud Deployment Guide

This guide walks you through deploying the complete RouteFill AI stack (PostgreSQL Database, Python ML Microservice, Node.js Backend API, and Web Canvas Frontend) on **100% free cloud platforms**.

---

## Architecture Overview

```mermaid
graph TD
    Client["Browser / Web Client"] --> Canvas["Frontend: routefill-canvas<br/>(Render Static Site / Vercel)"]
    Canvas --> Backend["Backend API: routefill-backend<br/>(Render Web Service)"]
    Backend --> DB[("PostgreSQL 3NF DB<br/>(Render Free Postgres / Neon / Supabase)")]
    Backend --> ML["ML Engine: ml-service<br/>(Render Web Service / Python FastAPI)"]
```

---

## Option 1: 1-Click Automated Blueprint on Render.com (Recommended)

Render offers free hosting for PostgreSQL, Python Web Services, Node.js Web Services, and Static Sites. We have pre-configured a [`render.yaml`](file:///c:/codes/RouteFillAi/render.yaml) Blueprint in your repository.

### Step 1: Push Code to GitHub
Ensure all your files are committed and pushed to your GitHub repository:
```powershell
git add .
git commit -m "feat: production deployment configuration"
git push origin main
```

### Step 2: Deploy on Render
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and sign in with your GitHub account.
2. Click the **"New +"** button in the top navigation and select **"Blueprint"**.
3. Connect your **RouteFill AI** GitHub repository.
4. Render will automatically read [`render.yaml`](file:///c:/codes/RouteFillAi/render.yaml) and display the 4 components to be created:
   - `routefill-db` (Free PostgreSQL Database)
   - `routefill-ml-service` (Free Python FastAPI Engine)
   - `routefill-backend` (Free Node.js Express API)
   - `routefill-canvas` (Free Web UI)
5. Click **"Apply"**.
6. Render will build and deploy all services in order, automatically linking the database connection and internal API URLs!

---

## Option 2: Hybrid Stack (Neon + Render + Vercel)

For maximum performance on free tiers:

### 1. Database on Neon.tech (Free Serverless PostgreSQL)
1. Sign up at **[neon.tech](https://neon.tech)** (free tier includes 0.5 GB storage & automated backups).
2. Create a project named `routefill_db`.
3. Copy the **Connection String** (e.g., `postgresql://alex:...@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).

### 2. Python ML Microservice on Render
1. In Render, click **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Configure settings:
   - **Root Directory**: `ml-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python train_initial_models.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
4. Deploy and copy your ML service URL (e.g., `https://routefill-ml.onrender.com`).

### 3. Backend API on Render
1. In Render, click **New +** → **Web Service**.
2. Configure settings:
   - **Root Directory**: `routefill-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
   - **Plan**: `Free`
3. Add Environment Variables in the **Environment** tab:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(Paste your Neon Connection String)* |
   | `DB_SSL` | `true` |
   | `DB_SYNC` | `true` |
   | `JWT_SECRET` | *(Generate a 32+ character random string)* |
   | `ML_SERVICE_URL` | `https://routefill-ml.onrender.com` |
   | `CORS_ORIGIN` | `*` |
4. Deploy and copy your Backend URL (e.g., `https://routefill-backend.onrender.com`).

### 4. Frontend Web Canvas on Vercel
1. Sign in to **[vercel.com](https://vercel.com)** with GitHub.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `routefill-canvas`.
5. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://routefill-backend.onrender.com/api`
6. Click **Deploy**. Vercel will build and assign you a global HTTPS domain (e.g. `https://routefill-canvas.vercel.app`).

---

## Option 3: Fixing Local Docker Port Conflicts

If you encountered:
```text
Error response from daemon: ports are not available: exposing port ...
```
This is because your local Node dev server or local PostgreSQL was already using port 5000 or 5432.

### To run Docker locally:
1. Close your running terminal dev servers (press `Ctrl+C` in the running PowerShell tabs).
2. Run Compose:
   ```powershell
   docker-compose up --build -d
   ```
3. Access:
   - **Frontend UI**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000/api`
   - **Swagger Docs**: `http://localhost:5000/api/docs`
   - **Python ML API**: `http://localhost:8000/docs`
