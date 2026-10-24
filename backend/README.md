# TrustBroker AI — Backend Service

FastAPI-powered backend engine for **TrustBroker AI**, providing deterministic contract lifecycle management, milestone escrow staging with PayPal, automated AI delivery verification via Gemini, and immutable audit logging.

---

## Tech Stack

- **Framework:** FastAPI (Python 3.12)
- **Database ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Migrations:** Alembic
- **Identity & Auth:** Supabase Auth (JWT validation)
- **Storage:** Supabase Storage (Deliverables bucket)
- **AI Verification:** Google Gemini 2.5 Flash (`google-genai` SDK)
- **Payments:** PayPal Orders v2 Sandbox API
- **Deployment:** Render (Python Web Service / Docker)

---

## Local Development Setup

### 1. Environment & Virtualenv

```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials from Supabase, PayPal Developer, and Google AI Studio.

### 3. Run the Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## Database Migrations (Alembic)

```bash
# Generate a new migration
alembic revision --autogenerate -m "migration_name"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## Deployment (Render)

This backend is preconfigured for automatic deployment on Render using the root `render.yaml` blueprint or as an independent Web Service pointing to `backend/Dockerfile`.
