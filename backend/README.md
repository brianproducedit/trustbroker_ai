# TrustBroker AI — Backend Service

FastAPI backend engine for **TrustBroker AI**: contract lifecycle, policy-governed milestone payments, automated multimodal AI delivery verification, audit logging, and PayPal sandbox payments & payouts.

---

## Tech Stack

- **Framework:** FastAPI (Python 3.12)
- **Database ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Migrations:** Alembic
- **Identity & Auth:** Supabase Auth (JWT validation)
- **Storage:** Supabase Storage (Deliverables bucket)
- **AI Verification & Drafting:** Groq LPU (`llama-3.3-70b-versatile`) with OpenRouter and DeepSeek fallbacks
- **Payments:** PayPal Orders v2 (Escrow Staging) and PayPal Payouts API (Instant Milestone Disbursement)
- **Deployment:** Render (Python Web Service / Docker)

---

## Key Endpoints & Architecture

### Contracts & Milestones (`/api/v1/contracts`)
- `POST /`: Create contract with SOW milestones and criteria.
- `GET /`: List user contracts with status filtering and pagination.
- `GET /{contract_id}`: Fetch detailed contract agreement, milestones, and version history.
- `DELETE /{contract_id}`: **Guarded delete** for `DRAFT` contracts only, cascading across draft milestones and criteria.
- `PATCH /{contract_id}/milestones/{milestone_id}`: Update individual milestone title, description, amount, or deadline for draft contracts (recalculates contract totals and SHA-256 content hash).
- `DELETE /{contract_id}/milestones/{milestone_id}`: Delete an unstarted draft milestone (enforces 1 milestone minimum).
- `PATCH /{contract_id}/milestones/{milestone_id}/criteria/{criterion_id}`: Update individual acceptance criterion.
- `DELETE /{contract_id}/milestones/{milestone_id}/criteria/{criterion_id}`: Delete an individual acceptance criterion.
- `POST /{contract_id}/accept`: Cryptographically record mutual acceptance with deterministic SHA-256 fingerprinting.

### Applications & Marketplace (`/api/v1/applications`)
- `POST /contracts/{contract_id}/applications`: Freelancer submits bid with portfolio links.
- `GET /mine`: List current freelancer's submitted applications and AI vetting scores.
- `DELETE /{application_id}`: Freelancer withdraws pending application before award.

### Notifications (`/api/v1/notifications`)
- `GET /`: List user notifications across payment, verification, and contract milestones.
- `PATCH /{id}/read` & `PATCH /read-all`: Mark notifications as read.
- `DELETE /{id}`: Delete a single notification.
- `DELETE /`: Bulk-clear all read notifications.

### Payments & Milestone Disbursals (`/api/v1/payments`)
- `POST /create-order`: Generate a PayPal Orders v2 capture order for client milestone funding.
- `POST /capture-order`: Complete order capture with sandbox error recovery (handles `422`, `ORDER_ALREADY_CAPTURED`, `INSTRUMENT_DECLINED`).
- `POST /release`: Release milestone funds to the freelancer via PayPal Payouts API (`/v1/payments/payouts`), verified by PolicyEngine.
- `GET /earnings`: Return payout transaction history for the authenticated user (freelancer earnings or client payouts).
- `GET /client-ledger`: Full escrow and payout ledger across all client contracts and payment attempts.
- `GET /payouts/{contract_id}`: Contract-specific payout transactions.
- `GET /history/{contract_id}`: Contract-specific payment orders and capture attempts.
- `POST /webhook`: Inbound PayPal webhook listener with signature verification.

### Verification Engine (`/api/v1/deliveries`)
- **HTTP Probe Adapter:** Verifies live staging URLs with resilience against edge/bot-protection challenges (Vercel, Cloudflare, GitHub, Netlify).
- **Vision Adapter:** Inspects screenshots and UI designs against visual requirements using Groq vision inference.
- **Document Adapter:** Extracts PDF and markdown content, automatically routing raster screenshots to vision.
- **Repository Meta Adapter:** Inspects public GitHub repositories and directory trees via GitHub API.
- **Scoring Engine:** Deterministically aggregates evidence scores and flags rate-limiting as `NEEDS_REVIEW` instead of false-positive hard failures.

### Immutability Safeguards
- Contracts in `ACTIVE`, `IN_VERIFICATION`, or `COMPLETED` states are strictly protected from mutation or deletion.
- Financial records (`payment_attempts`, `payouts`, `audit_events`, `deliveries`, `verification_reports`) are permanently immutable.

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
Fill in your credentials from Supabase, PayPal Developer and Groq Console (or OpenRouter/DeepSeek).

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

This backend is preconfigured for automatic deployment on Render using the root `render.yaml` blueprint or as an independent Web Service pointing to `backend/Dockerfile`. Startup execution includes auto-migration with Alembic and database seeding for demo showcase accounts.
