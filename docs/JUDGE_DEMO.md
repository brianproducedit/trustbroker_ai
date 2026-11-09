# TrustBroker AI — Judge Demo & Sandbox Money Loop Guide

> **Competition:** [PayPal AI Hackathon 2026](https://paypalaihackathon.devpost.com/)  
> **Target Audience:** Hackathon Judges, Evaluators and Technical Reviewers  
> **Live App:** https://trustbroker-ai-frontend-bx9a.onrender.com  
> **Key Innovation:** Autonomous AI milestone verification paired with real PayPal Orders v2 milestone captures and PayPal Payouts API disbursements — governed by a PolicyEngine that ensures AI never releases funds unilaterally.

---

## 1. Sandbox Account Architecture

To experience the complete, real-money loop without real funds, TrustBroker operates in **PayPal Sandbox Mode** (`https://api-m.sandbox.paypal.com`):

```
+------------------------------------+
| Client Personal Sandbox Account    |
| (Buyer / Employer)                 |
+------------------------------------+
                  |
                  | 1. PayPal Smart Buttons Popup (Orders v2 Capture)
                  v
+------------------------------------+
| Platform Business Sandbox Account  |
| (TrustBroker Platform Account)     |
+------------------------------------+
                  |
                  | 2. Milestone AI Verified & Policy Cleared
                  | 3. PayPal Payouts API (/v1/payments/payouts)
                  v
+------------------------------------+
| Freelancer Personal Sandbox Account|
| (Talent Payout Receiver)           |
+------------------------------------+
```

### The Three PayPal Sandbox Personas

| Role | PayPal Sandbox Type | Purpose in Demo |
|---|---|---|
| **Client (Buyer)** | Sandbox Personal Account | Funds milestones via PayPal Buttons popup. Logs into PayPal modal. |
| **Platform** | Sandbox Business (REST App) | Receives captured milestone funds in sandbox; backend credentials issue orders and payouts. |
| **Freelancer (Receiver)** | Sandbox Personal Account | Target `paypal_payout_email` that receives the payout batch item. |

> **Note for Judges:** You can use sandbox personal accounts created in your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/accounts), or use the test credentials pre-populated in the project environment.

---

## 2. Demo User Credentials (Supabase Auth)

The app comes pre-seeded with clean test accounts representing both sides of the marketplace:

| Email | Workspace | Password | Characteristics |
|---|---|---|---|
| `client.demo@trustbroker.ai` | **Client** | `DemoPassword2026!` | Posts briefs, reviews proposals, funds milestones, releases payouts. |
| `freelancer.demo@trustbroker.ai` | **Freelancer** | `DemoPassword2026!` | Applies to listings, submits deliverable evidence, receives payouts. |
| `newcomer.demo@trustbroker.ai` | **Freelancer** | `DemoPassword2026!` | Empty past contract history, strong portfolio (demonstrates fair AI vetting vs experienced freelancer). |

**PayPal Sandbox:**
- Buyer email: `sb-buyer@sandbox.paypal.com`
- Payout recipient: `freelancer-payout@sandbox.paypal.com`

---

## 3. Canonical Route Reference

All routes use the `/app/` prefix. Legacy `/dashboard/...` paths auto-redirect.

| Screen | Canonical URL | Access Role |
|---|---|---|
| Landing Page | `/` | Public |
| Sign In | `/sign-in` | Public |
| Sign Up | `/sign-up` | Public |
| Client Home / Dashboard | `/app/client` | Client |
| Client Contracts List | `/app/client/contracts` | Client |
| Contract Detail | `/app/client/contracts/:id` | Client |
| **Review Delivery** | `/app/client/contracts/:id/review` | Client |
| New Contract | `/app/client/contracts/new` | Client |
| Client Applications | `/app/client/applications` | Client |
| Client Operations Studio | `/app/client/studio` | Client |
| Freelancer Home | `/app/freelancer` | Freelancer |
| **Marketplace** | `/app/freelancer/contracts` | Freelancer |
| Listing Detail | `/app/freelancer/contracts/:id` | Freelancer |
| **Submit Delivery** | `/app/freelancer/work/:id/deliver` | Freelancer |
| Freelancer Operations Studio | `/app/freelancer/studio` | Freelancer |
| Freelancer Earnings / Payouts | `/app/freelancer/earnings` | Freelancer |
| Notifications | `/app/notifications` | Both |
| Activity History | `/app/activity/:id` | Both |
| Profile | `/app/profile` | Both |

---

## 4. Step-by-Step Judge Walkthrough (The Complete Money Loop)

Follow this path to verify every stage of the contract and payment lifecycle.

---

### Step 1: Sign In as Client

1. Navigate to `https://trustbroker-ai-frontend-bx9a.onrender.com/sign-in`
2. Sign in with `client.demo@trustbroker.ai` / `DemoPassword2026!`
3. You land at `/app/client` — the **Client Workspace Dashboard**
4. Confirm the **CLIENT MODE** badge shows in the sidebar and top navigation

> [!NOTE]
> The sidebar shows role-specific navigation: Home, My Contracts, Applications, New Contract, Operations, Analytics Studio, Payouts, Notifications, Profile.

---

### Step 2: Review a Contract or Create a New One

#### Option A — Use a Pre-Seeded Contract
1. Click **My Contracts** → `/app/client/contracts`
2. Click into an active contract (e.g., `TB-2026-009`)
3. The Contract Detail page has four tabs:
   - **Milestones** — Deliverables, acceptance criteria, status badges
   - **Legal SOW** — AI-drafted statement of work, SHA-256 content hash, exclusions
   - **Payments** — PayPal Funding & Disbursement Hub
   - **Audit Activity** — Immutable chronological event log with SHA-256 integrity proofs

#### Option B — Create a New Contract with AI SOW Generator
1. Click **New Contract** → `/app/client/contracts/new`
2. Fill in the project title and category
3. Click **Generate SOW with AI** — Groq LPU drafts structured milestones, acceptance criteria, and exclusions in under a second
4. Review the generated content, set a milestone value (e.g., $400), then **Publish to Marketplace**

---

### Step 3: Fund Milestone with PayPal

1. Open the contract detail → click the **Payments** tab
2. In the **Milestone Funding Allocation** card, locate the unfunded milestone
3. Click the gold **PayPal** smart button
4. The PayPal Sandbox modal launches:
   - Backend called `POST /api/v1/payments/create-order` via PayPal Orders v2
   - Complete checkout in the popup using your sandbox personal buyer account
5. Upon approval:
   - Backend executes `POST /api/v1/payments/capture-order` and validates status `COMPLETED`
   - Milestone status updates to `funded` (`staged_in_sandbox`)
   - The **PayPal Orders & Captures** ledger records the **PayPal Order ID**, **Capture ID**, amount, and timestamp
   - Audit trail registers `payment_capture_completed`

> [!IMPORTANT]
> The Order ID and Capture ID displayed in the UI are **real PayPal Sandbox API responses** — they can be verified at [developer.paypal.com](https://developer.paypal.com/dashboard/accounts).

---

### Step 4: Switch to Freelancer & Submit Deliverable Evidence

1. Click **Switch to Freelancer** in the sidebar (bottom-left mode toggle) — workspace re-renders at `/app/freelancer`
2. Navigate to **My Work** → find the awarded contract
3. Click **Submit Delivery** → navigates to `/app/freelancer/work/:id/deliver`
4. The submission form is **unlocked** because Milestone 1 is staged in sandbox
5. Enter deliverable evidence:
   - **Source Code Repository:** GitHub repo URL (e.g., `https://github.com/ishantmishra03/ecommerce-typescript`)
   - **Live Staging Environment:** Vercel/live URL (e.g., `https://klyora.vercel.app`)
   - **Delivery Notes & Attestation:** Written description of what was delivered
   - **Attached Files:** Upload a screenshot (see `demo_assets/pass_evidence.txt` for test data reference)
6. Click **Submit Deliverable Evidence**

---

### Step 5: AI Verification Engine Runs

After submission, the Groq-powered verification agent automatically evaluates the evidence against the contract's acceptance criteria using four parallel adapter types:

| Adapter | What It Checks |
|---|---|
| **HTTP Probe** | Live URL response code, HTTPS, latency |
| **Vision Heuristic** | Uploaded screenshot authenticity via vision model |
| **Document Analysis** | Delivery notes and attestation completeness |
| **Repository Inspection** | GitHub repo for required files (TypeScript, package.json, README, license) |

The **criterion assessment matrix** shows:
- Overall score out of 100
- Individual Pass / Fail / Needs Review badges per criterion
- AI summary citations with SHA-256 artifact hashes
- Milestone status transitions to `verified` on successful completion

> [!NOTE]
> All AI inference runs on Groq's LPU — typical verification completes in under 400ms.

---

### Step 6: Client Reviews Delivery — 3-Column Settlement Interface

1. Switch back to **Client Workspace** (click **Switch to Client** or sign in as `client.demo@trustbroker.ai`)
2. The **Dashboard** (`/app/client`) shows a **"Review Delivery"** prompt card for the verified milestone
3. Click **Review Delivery** → navigates to `/app/client/contracts/:id/review`

#### The 3-Column Review Interface

| Column | Content | Purpose |
|---|---|---|
| **Column 1 (Left)** | Freelancer Delivery Package — repo link, live URL, notes, attached screenshots, submission timestamp, version badge | Evidence review |
| **Column 2 (Center)** | AI Verification Assessment — criterion pass/fail badges, AI citations, overall score, summary analysis | AI recommendation |
| **Column 3 (Right)** | Client Settlement Panel — action buttons with lifecycle-aware state | Client decision & PayPal disbursement |

#### Column 3 States

**When milestone is `verified` (most common state):**
- 🟢 **Authorize PayPal Payout ($XXX)** — primary action, tall green button
- 🟡 **Request Revision** — secondary, side-by-side grid
- 🔵 **AI Dispute** — secondary, side-by-side grid

**When milestone is `revision_requested`:**
- Override approve option available
- 🔴 **Reclaim Escrow** and 🔵 **AI Dispute** in secondary grid

**When milestone is `pending` (manual review):**
- **Manual Approve** as primary
- **Request Revision** and **AI Dispute** in secondary grid

---

### Step 7: Authorize PayPal Payout

1. In Column 3, click the green **Authorize PayPal Payout ($XXX)** button
2. A confirmation dialog appears showing:
   - Recipient: freelancer's registered PayPal email (e.g., `freelancer-payout@sandbox.paypal.com`)
   - Idempotency key: `payout:{milestone_id}` — prevents double-disbursement
3. Click **Confirm & Disburse Payout**:
   - Backend calls `POST /v1/payments/payouts` (PayPal Payouts API)
   - Backend stores `paypal_batch_id` and `paypal_item_id`
   - Milestone transitions to `settled` and `released`
4. A **success toast** appears with the real **PayPal Batch Payout ID**

> [!IMPORTANT]
> The PolicyEngine enforces these non-negotiable rules before any payout can proceed:
> 1. Caller must be the verified contract client
> 2. Milestone must have passed AI verification (`status == verified`)
> 3. Milestone must have a PayPal capture on record (`payment_status == staged_in_sandbox`)
> 4. Freelancer must have a registered PayPal payout email
>
> If any condition fails, the transaction is **blocked**. AI never bypasses this.

---

### Step 8: Freelancer Inspects Earnings Ledger

1. Switch to **Freelancer Workspace**
2. Click **Payouts** in the sidebar → `/app/freelancer/earnings`
3. Observe the **PayPal Disbursement Ledger** row:
   - Milestone & Contract reference
   - Amount (`$XXX.XX USD`)
   - Status: `PAID VIA PAYPAL`
   - Copyable **PayPal Batch ID** and **Payout Item ID**
   - Recipient PayPal email
   - Timestamp

---

### Step 9: AG Studio Financial Operations & AI Copilot

#### Client Operations Studio (`/app/client/studio`)
1. Click **Operations** in the Client sidebar
2. Observe live KPI widgets:
   - Total Committed
   - Staged in Sandbox (PayPal captured, pending release)
   - Cleared Payouts
   - Pending Verification
3. Inspect the **AG Grid Financial Ledger** — sort by amount, filter by status
4. Test the **AG Studio AI Copilot**:
   - Click **Ask AI** (floating button, bottom-right)
   - Try: *"Summarize total staged funds and pending milestone verifications"*
   - Try: *"Which submissions have been waiting for verification the longest?"*
   - The agent answers with real-time operational context queried directly from the ledger

#### Freelancer Operations Studio (`/app/freelancer/studio`)
1. Switch to Freelancer mode → click **Operations**
2. Same AG Grid architecture, scoped to earnings and submission history
3. KPI cards: Pending Earnings, Cleared, Submission Queue

---

### Step 10: Verify Impartial AI Vetting

1. Sign in as Client (`client.demo@trustbroker.ai`)
2. Navigate to **Applications** for a listing with multiple applicants
3. Compare the two seeded applicants:
   - **Tariro Moyo (Experienced):** Ranked `strong_fit` (92%) with matched skills and past high-throughput PayPal architecture experience
   - **Kuda Nyamuda (Newcomer):** Ranked `new_talent` (78%) — evaluated on portfolio code quality and component design, **not** penalized for low platform contract count

> [!NOTE]
> This demonstrates fairness: the AI vetting agent doesn't treat newcomers as low-value. Portfolio quality is weighted equally to past contract history.

---

### Step 11: Audit Trail & Activity History

1. Navigate to any contract → **Audit Activity** tab
2. Or navigate directly to `/app/activity/:id`
3. Each event entry shows:
   - Event type (e.g., `payment_capture_completed`, `milestone_verified`, `payout_released`)
   - Timestamp
   - Actor (client / freelancer / system)
   - SHA-256 integrity proof
4. This log is immutable — events cannot be edited or deleted

---

## 5. Test Evidence Assets (Pass vs. Fail)

When testing deliverable submission in Step 4, copy test data from the repo:

- **Passing Evidence:** [`demo_assets/pass_evidence.txt`](../demo_assets/pass_evidence.txt) — sub-second live URL response, 100% test suite pass, verified PayPal webhook handler
- **Failing Evidence:** [`demo_assets/fail_evidence.txt`](../demo_assets/fail_evidence.txt) — unoptimized bundle, missing server-side PayPal signatures, failing e2e tests

---

## 6. Verification on PayPal Developer Dashboard

To independently confirm money movement in your sandbox:

1. Log into [developer.paypal.com](https://developer.paypal.com)
2. Go to **Testing Tools** > **Sandbox Accounts**
3. Log into the Sandbox Business / Personal accounts at [sandbox.paypal.com](https://www.sandbox.paypal.com):
   - **Platform Business Account:** Shows incoming Capture for the milestone and outgoing Payout
   - **Freelancer Personal Account:** Shows payment received with note: *"TrustBroker payout for {contract_code} — {milestone_title}"*
4. Match the **Order ID**, **Capture ID**, and **Payout Batch ID** from TrustBroker's UI with the PayPal dashboard entries

---

## 7. Technical Safeguards & Edge Cases

| Safeguard | Implementation |
|---|---|
| **Idempotency** | Every payout carries `PayPal-Request-Id: payout:{milestone_id}`. Re-clicking cannot double-disburse. |
| **Strict Capture Validation** | Milestone only becomes `funded` when PayPal responds with `COMPLETED`. Cancelling the popup leaves it unfunded. |
| **PolicyEngine Gating** | 4 non-negotiable conditions must pass before any payout executes (see Step 7 above). |
| **Provider Truthfulness** | Zero synthetic IDs (`SANDBOX-CAP-*`, `SANDBOX-BATCH-*`). All captures, payouts, and webhooks reflect authentic PayPal provider state. |
| **SSRF & Boundary Safety** | `validate_url_for_ssrf` blocks loopback, private RFC1918 subnets, cloud metadata (`169.254.169.254`), non-standard ports, and embedded credentials before any HTTP probe runs. |
| **Server-Side Evidence Storage** | Deliverables upload file bytes directly to private Supabase Storage (`delivery-evidence`) or server disk fallback. Client-side `blob:` URLs are strictly rejected. |
| **AI Verification Truthfulness** | If AI inference is unavailable or rate-limited, verification returns `NEEDS_REVIEW` (score 50, human review required). No synthetic 88/100 pass. |
| **Role Enforcement** | Client routes (`/app/client/...`) reject freelancer sessions; freelancer routes reject client sessions. |
| **SHA-256 SOW Hashing** | Statement of Work content is hashed on mutual acceptance — tamper-proof contract record. |
| **Audit Immutability** | Activity events are append-only — no delete or edit capability in the API. |

---

## 8. Prize Category Checklist

| Prize | Evidence Location |
|---|---|
| **Best Use of PayPal** | Steps 3, 7 — Orders v2 (real Order ID + Capture ID), Payouts API (real Batch ID + Item ID), idempotency keys, Smart Buttons |
| **Agentic AI** | Steps 2b, 10, 5 — AG Studio React agent, Groq LPU <400ms, multimodal verification (4 adapters), AI SOW generation, AI applicant vetting |
| **AG Studio / AG Grid** | Step 9 — Client + Freelancer Operations Studio, enterprise AG Grid ledgers, real-time KPI cards, AI Copilot with live tool access |
| **Best Dev Experience** | Codebase — TypeScript, `ROUTES.*` constants system, PolicyEngine, role-based routing architecture |
| **Overall Grand Prize** | Full end-to-end flow demonstrating all categories in one coherent product |

---

## 9. Quick-Start: 5-Minute Minimal Demo Path

For judges who want the fastest possible verification of the core loop:

```
1. /sign-in           → client.demo@trustbroker.ai / DemoPassword2026!
2. /app/client/contracts/:id  → open TB-2026-009 → Payments tab
3. Click PayPal button → complete sandbox checkout
4. Switch to Freelancer → /app/freelancer/work/:id/deliver → submit evidence
5. Switch to Client → /app/client/contracts/:id/review → Authorize PayPal Payout
6. Switch to Freelancer → /app/freelancer/earnings → verify Batch ID in ledger
7. /app/client/studio  → AG Grid + AI Copilot demo
```

Total time: approximately 5 minutes.

---

## 10. Deliverable Storage Architecture & Supabase Free-Tier Setup

TrustBroker AI stores freelancer evidence files (screenshots, zip archives, design files, PDF documents) using a resilient dual-storage architecture:

### Free Tier Limits & Boundaries
- **Supabase Storage Free Tier:** Includes **1 GB of total storage** across all buckets with a maximum upload size of **50 MB per file**.
- **TrustBroker AI Guardrail:** Both frontend and backend enforce an explicit **25 MB limit per file**, well within Supabase's 50 MB ceiling, preventing out-of-quota errors.
- **Graceful Local Fallback:** If Supabase credentials are not yet configured, the system automatically falls back to private server disk storage (`uploads/evidence/`). Both modes generate authenticated, role-restricted downloads for contract parties.

### Step-by-Step Supabase Storage Configuration
To connect real cloud storage:

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard) and select your TrustBroker AI project.
2. In the left navigation, click **Storage** (the bucket icon).
3. Click **New bucket** (top right):
   - **Name:** `delivery-evidence`
   - **Public bucket:** Leave **OFF / Disabled** (ensures deliverables remain confidential and private).
   - **File size limit:** Set to `50MB`.
   - **Allowed MIME types:** Leave blank or set `image/*,application/pdf,application/zip,text/*`.
   - Click **Save**.
4. Configure your backend environment variables (in `.env` or your Render dashboard):
   ```env
   SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
   ```
5. Deliverables will now upload directly to your private cloud storage bucket.

