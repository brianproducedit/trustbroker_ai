# TrustBroker AI — Backend Service

FastAPI backend engine for **TrustBroker AI**: contract lifecycle, policy-governed milestone payments, automated multimodal AI delivery verification, audit logging and PayPal sandbox payments & payouts.

---

## Tech Stack

- **Framework:** FastAPI (Python 3.12)
- **Database ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Migrations:** Alembic
- **Identity & Auth:** Supabase Auth (JWT validation)
- **Storage:** Supabase Storage (Deliverables bucket)
- **AI Verification & Drafting:** Groq LPU (`llama-3.3-70b-versatile`) with OpenRouter and DeepSeek fallbacks
- **Payments:** PayPal Orders v2 (Milestone Staging) and PayPal Payouts API (Milestone Disbursement)
- **Deployment:** Render (Python Web Service / Docker)

---

## Key Endpoints & Architecture

### Contracts & Milestones (`/api/v1/contracts`)
- `POST /`: Create contract with SOW milestones and criteria.
- `GET /`: List user contracts with status filtering and pagination.
- `GET /{contract_id}`: Fetch detailed contract agreement, milestones and version history.
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
- `GET /`: List user notifications across payment, verification and contract milestones.
- `PATCH /{id}/read` & `PATCH /read-all`: Mark notifications as read.
- `DELETE /{id}`: Delete a single notification.
- `DELETE /`: Bulk-clear all read notifications.

### Payments & Milestone Disbursals (`/api/v1/payments`)
- `POST /create-order`: Generate a PayPal Orders v2 capture order for client milestone funding.
- `POST /capture-order`: Complete order capture with sandbox error recovery (handles `422`, `ORDER_ALREADY_CAPTURED`, `INSTRUMENT_DECLINED`).
- `POST /release`: Release milestone funds to the freelancer via PayPal Payouts API (`/v1/payments/payouts`), verified by PolicyEngine.
- `GET /earnings`: Return payout transaction history for the authenticated user (freelancer earnings or client payouts).
- `GET /client-ledger`: Full payment staging and payout ledger across all client contracts and payment attempts.
- `GET /payouts/{contract_id}`: Contract-specific payout transactions.
- `GET /history/{contract_id}`: Contract-specific payment orders and capture attempts.
- `POST /webhook`: Inbound PayPal webhook listener with signature verification.

### Verification Engine & Deliveries (`/api/v1/deliveries`)
- `POST /upload-file`: Accept multipart evidence upload, validating file size, type and enforcing server-scoped storage paths (`validate_storage_path`) to prevent cross-user file hijacking.
- `POST /`: Submit freelancer deliverable package (repo URL, live staging preview, notes, file attachments); queues background AI verification.
- `GET /{delivery_id}/verification-status`: Poll background AI verification job status and results. Enforces terminal states: flags jobs running > 90s without reports as `interrupted` (service restart) or > 45s as `needs_review`, preventing indefinite polling hangs.
- `GET /milestone/{milestone_id}`: List all milestone deliveries with embedded `verification_report` and itemized `CriterionResult` evaluations.
- `GET /{delivery_id}`: Retrieve detailed delivery submission package and assessment report.
- `GET /files/{file_id}/download`: Authenticated download URL or file stream for contract parties with directory traversal protection (`os.path.realpath`).
- `POST /{contract_id}/{milestone_id}/request-revision`: Client requests revisions with notes.
- `POST /{contract_id}/{milestone_id}/override-review`: Client human override approval with required audit trail rationale.
- **Multimodal Adapters:**
  - **HTTP Probe Adapter:** Verifies live staging URLs with SSRF protection and resilience against edge/bot-protection challenges (Vercel, Cloudflare, GitHub, Netlify).
  - **Vision Adapter:** Multimodal screenshot analysis via vision model; strictly returns `NEEDS_REVIEW` (score 50) when API is unavailable—zero synthetic passes.
  - **Document Adapter:** Extracts PDF and text content locally; flags unreadable or scanned documents for human review.
  - **Repository Meta Adapter:** Inspects public GitHub repositories via API; strict URL parsing (no deceptive hosts) and flags 429/403/non-GitHub as `NEEDS_REVIEW`.
  - **Scoring Engine:** Aggregates evidence scores deterministically, attributes models truthfully (`fallback:none` if no model ran) and requires client review for ambiguous results.

### Immutability & Role Safeguards
- **Client-Only Payout Disbursals:** Releases are strictly restricted to verified contract clients in `PolicyEngine.can_release_payout()`; non-clients are rejected with HTTP 403.
- **Contract State Protection:** Contracts in `ACTIVE`, `IN_VERIFICATION`, or `COMPLETED` states are strictly protected from mutation or deletion.
- **Financial Immutability:** Financial records (`payment_attempts`, `payouts`, `audit_events`, `deliveries`, `verification_reports`) are permanently immutable to guarantee legal non-repudiation.

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

# Show current migration revision
alembic current

# Show revision history
alembic history --verbose
```

### Production Migration Recovery Procedure
In production, automatic migration failures **never** automatically stamp to `head` (preventing corrupt or incomplete schema states).
If a deploy encounters a migration error:
1. Inspect the migration failure in Render application logs (`[STARTUP] [ERROR] Alembic CLI migration failed...`).
2. Run database backup before applying schema modifications.
3. If the schema was already manually created or out of sync with Alembic revisions, inspect current state:
   ```bash
   alembic current
   ```
4. Only reconcile after confirming all required tables and columns exist:
   ```bash
   alembic stamp <target_revision_id>
   alembic upgrade head
   ```
5. If a migration broke halfway through, rollback the failed transaction or column, then re-run `alembic upgrade head`.

---

## Automated Test Suite

The backend includes a comprehensive 84-test regression suite covering authentication integrity, PayPal Orders/Payouts truthfulness, PolicyEngine safeguards, SSRF protection, multimodal evidence verification, CORS security and vetting scoring:

```bash
# Run the full test suite
python -m pytest tests/ -v

# Run specific test suites
python -m pytest tests/test_paypal_integrity.py -v
python -m pytest tests/test_cors_security.py -v
python -m pytest tests/test_ssrf_safety.py -v
python -m pytest tests/test_auth_security.py -v
python -m pytest tests/test_phase5_verification.py -v
python -m pytest tests/test_e2e_lifecycle.py -v
```

---

## Deliverable Storage & Supabase Free-Tier Setup

Deliverables (images, PDFs, ZIP archives, design files) upload via `POST /api/v1/deliveries/upload-file`:
- **Supabase Storage:** If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, files upload to private bucket `delivery-evidence`.
- **Local Fallback:** If Supabase Storage is unconfigured, files save to `uploads/evidence/` with party-authenticated download endpoints.
- **Limits:** Supabase free tier includes **1 GB storage** and a **50 MB max file size**. TrustBroker AI enforces a conservative **25 MB limit** across frontend and backend.

To set up the bucket in Supabase:
1. Go to **Storage** -> Click **New bucket**.
2. Name it `delivery-evidence` and ensure **Public bucket is OFF**.
3. Set file size limit to `50MB`.

---

## Deployment (Render)

This backend is preconfigured for automatic deployment on Render using the root `render.yaml` blueprint or as an independent Web Service pointing to `backend/Dockerfile`. Startup execution includes auto-migration with Alembic and database seeding for demo showcase accounts.
