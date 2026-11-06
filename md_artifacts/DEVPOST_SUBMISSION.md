# TrustBroker AI — Devpost Hackathon Submission Guide
## Complete Copy-Paste Reference for PayPal AI Hackathon 2026

> **Hackathon:** [PayPal AI Hackathon 2026 on Devpost](https://paypalaihackathon.devpost.com/)  
> **Submission URL:** `https://devpost.com/submit-to/31302-paypal-ai-hackathon/manage/submissions`  
> **Live App:** https://trustbroker-ai-frontend-bx9a.onrender.com  
> **GitHub Repo:** https://github.com/brianproducedit/trustbroker_ai  

---

## 1. Screen 1: Project Overview (General Info)

### Field: Project Name
```text
TrustBroker AI
```
*(14 / 60 characters)*

---

### Field: Elevator Pitch
*Character Limit: 200 characters*

**Option A (Recommended — Highest Prize Density):**
```text
Autonomous AI milestone verification with PayPal Orders v2 capture & Payouts API disbursement. Multimodal inspection, AG Studio operations & PolicyEngine governance.
```
*(168 / 200 characters — 32 characters left)*

**Option B (Polished version of current input):**
```text
AI-driven milestone contracts & multimodal deliverable inspection with real PayPal Orders v2 capture, automated Payouts API disbursement & PolicyEngine governance.
```
*(167 / 200 characters — 33 characters left)*

---

### Field: Project Thumbnail
Click **Edit thumbnail** and upload:
- **File Path:** `docs/images/devpost_thumbnail.jpg` (or `devpost_thumbnail.png`)
- **Dimensions:** `2528 x 1696` (Exact 3:2 ratio requested by Devpost)
- **Size:** 516 KB (Well within Devpost's 5 MB limit)

---

## 2. Screen 2: Project Details ("About the Project")

Copy and paste the markdown below into the **"About the project"** editor on Devpost:

```markdown
## 💡 Inspiration
Every year, freelancers lose billions in unpaid invoices, while clients risk capital on unfinished or sub-standard work. Traditional escrow platforms charge punitive 10–20% fees, introduce weeks of manual dispute arbitration, and rely on subjective "he-said-she-said" reviews.

We built **TrustBroker AI** to establish a trustless, transparent intermediary for the freelance economy. By combining **PayPal Orders v2 milestone captures** and **PayPal Payouts API single-click disbursements** with **autonomous multimodal AI verification** and a deterministic **PolicyEngine**, TrustBroker coordinates verifiable work delivery directly with guaranteed payouts.

---

## ⚙️ What It Does

TrustBroker AI is an end-to-end, evidence-linked freelance transaction platform:

1. **AI Statement of Work (SOW) Generator**: Converts loose client project briefs into structured milestones with objective, measurable acceptance criteria, verifiable deliverables, and clear scope exclusions in under one second via Groq LPU.
2. **Impartial Applicant Vetting**: Evaluates candidate portfolios, code quality, and communication signals without penalizing newcomers for zero-contract histories, eliminating reputation bias.
3. **Mutual Agreement & SHA-256 Hash**: Both parties cryptographically sign the exact agreed SOW hash before any money moves.
4. **Milestone Escrow via PayPal Orders v2**: Clients fund milestone deliverables using PayPal Smart Buttons. Funds are captured and held staged in sandbox with real PayPal Order and Capture IDs.
5. **Multimodal Delivery Inspection**: When freelancers deliver, our agentic verification engine inspects evidence across 4 parallel adapters:
   - **HTTP Probe Adapter**: Validates live URL response codes, HTTPS/TLS certificates, and latency.
   - **Vision Heuristic Adapter**: Analyzes UI screenshots against UX requirements.
   - **Document Adapter**: Scans delivery attestations and documentation.
   - **Repository Adapter**: Inspects GitHub repos for code structure, package manifests, and test suites.
6. **PolicyEngine Settlement**: A deterministic backend policy engine enforces that no payout can occur unless the milestone is verified, capture is confirmed, and the client authorizes disbursement.
7. **Instant Payouts via PayPal Payouts API**: Client authorizes payout with one click. Funds disburse instantly to the freelancer's registered PayPal email with an idempotency key (`payout:{milestone_id}`) to prevent double-disbursement.
8. **AG Studio Operations & AI Copilot**: Live telemetry dashboards powered by enterprise AG Grid ledgers and an AG Studio React agent that reasons over real-time ledger data.

---

## 🛠️ How We Built It

- **FinTech Payment Layer**: PayPal REST APIs using Python SDK / direct HTTP endpoints — PayPal Orders v2 (`/v2/checkout/orders` with `CAPTURE` intent), PayPal Payouts API (`/v1/payments/payouts`), and asynchronous PayPal Webhook event listeners.
- **Agentic AI & LLM Inference**: Powered by Groq LPU running Llama 3.3 70B Versatile (sub-400ms SOW drafting and vetting) and Llama 3.2 11B Vision for multimodal screenshot heuristic inspection, with OpenRouter fallback.
- **Deterministic PolicyEngine**: Python FastAPI service that enforces 4 non-negotiable security invariant checks before any financial transaction can execute.
- **Frontend & Operations**: React 18, TypeScript, Tailwind CSS, Lucide icons, and **AG Grid Enterprise** for the financial ledgers.
- **Database & Identity**: Supabase (PostgreSQL with RLS, Supabase Auth, and private evidence storage buckets).
- **Deployment**: Live hosted multi-service architecture on Render Cloud with automated CI/CD.

---

## 🔒 The Three Ironclad Rules: Why AI Never Moves Money

A core innovation in TrustBroker AI is our safety boundary:
- **AI Recommends**: The verification engine generates objective criteria evaluations (scores, pass/fail badges, citations).
- **PolicyEngine Validates**: Strict state-machine rules enforce prerequisites.
- **Human Authorizes**: The client explicitly clicks to disburse funds.
- **PayPal Executes**: The PayPal Payouts API disburses directly to the freelancer's PayPal wallet.

---

## 🏆 Prize Categories Addressed

### 1. Best Use of PayPal
- **Orders v2 Capture**: Real Smart Button captures with traceable Order IDs and Capture IDs.
- **Payouts API**: Single-click batch disbursement with idempotency keys (`PayPal-Request-Id`).
- **Audit Traceability**: Every transaction references verifiable PayPal IDs cross-checked against the PayPal Developer Dashboard.

### 2. Agentic AI
- **Multimodal Verification Engine**: 4 parallel inspection adapters (HTTP, Vision, Docs, Code).
- **AG Studio React Agent**: Autonomous agent capable of querying live ledger telemetry and answering financial operations questions.
- **Groq LPU Sub-Second Inference**: Rapid reasoning for contract drafting, vetting, and verification.

### 3. AG Studio / AG Grid
- Comprehensive Operations Studios for both Client and Freelancer.
- Interactive cross-filtering KPI widgets (Committed, Staged, Cleared, Pending).
- Enterprise AG Grid tables with multi-column sorting, status pill renderers, and live Supabase data.

---

## 🧗 Challenges We Ran Into
- **Strict Role Boundaries**: Ensuring clean role switching so clients cannot access freelancer delivery routes and freelancers cannot trigger client payout authorizations. We solved this with canonical `/app/client` and `/app/freelancer` route separation and database-level RLS.
- **Sub-Second Multimodal Latency**: Running vision, repository, and live URL probes concurrently without blocking the UI. We solved this using parallel async adapter dispatching through Groq's high-throughput LPU.
- **Idempotency in Payouts**: Preventing accidental double-clicks or network retries from sending duplicate payouts. Solved by binding `PayPal-Request-Id: payout:{milestone_id}` to each transaction.

---

## 🌟 Accomplishments That We're Proud Of
- A complete, closed-loop financial lifecycle that actually works end-to-end in PayPal Sandbox.
- Transparent cryptographic audit trail with SHA-256 hashing for all SOW versions and delivery artifacts.
- Leveling the playing field for freelance newcomers through objective, code-quality-based AI vetting.

---

## 📚 What We Learned
Financial applications require strict boundaries between AI probabilistic reasoning and deterministic transaction execution. AI is exceptional at inspecting evidence and synthesizing unstructured information, but financial state transitions must be strictly enforced by code and authorized by humans.

---

## 🚀 What's Next for TrustBroker AI
- **Automated Milestone Splitting**: Streaming micropayments tied to continuous GitHub pull request merges.
- **Multi-Currency Payouts**: Expanding PayPal Payouts across global currencies with automatic FX conversion.
- **Cross-Platform Delivery Adapters**: Adding Figma design file inspect, AWS/GCP infrastructure provisioning checks, and mobile test flight build verifications.
```

---

## 3. Screen 3: "Built With" (Tags)

Add these exact tags in the **Built with** field:

```
paypal
paypal-orders-v2
paypal-payouts-api
python
fastapi
react
typescript
groq
ag-grid
supabase
postgresql
tailwind-css
render
```

---

## 4. Screen 4: "Try It Out" Links

| Field Label | Value |
|---|---|
| **Live Demo / Web Application** | `https://trustbroker-ai-frontend-bx9a.onrender.com` |
| **GitHub Repository** | `https://github.com/brianproducedit/trustbroker_ai` |
| **Video Demo URL** | *(Insert your YouTube / Loom video link)* |

---

## 5. Screen 5: Test Credentials (for Hackathon Judges)

If Devpost has an **"Instructions for testing"** or **"Judge Notes"** box, paste:

```text
Live App: https://trustbroker-ai-frontend-bx9a.onrender.com

Pre-seeded Demo Accounts:
• Client Workspace: client.demo@trustbroker.ai / DemoPassword2026!
• Freelancer Workspace: freelancer.demo@trustbroker.ai / DemoPassword2026!
• Newcomer Freelancer: newcomer.demo@trustbroker.ai / DemoPassword2026!

PayPal Sandbox Accounts:
• Buyer: sb-buyer@sandbox.paypal.com
• Payout Recipient: freelancer-payout@sandbox.paypal.com

Quick 5-Minute Test Path:
1. Sign in as Client -> Open TB-2026-009 -> Payments tab -> Click PayPal Button to fund milestone.
2. Switch to Freelancer -> Deliver & Inspect -> Submit deliverable evidence -> Inspect AI verification matrix.
3. Switch to Client -> Review Delivery -> Click "Authorize PayPal Payout ($400)".
4. Switch to Freelancer -> Payouts -> Verify PayPal Batch ID and Item ID in earnings ledger.
5. Click Operations -> Test AG Grid ledger and AG Studio AI Copilot queries.

Full Judge Guide: https://github.com/brianproducedit/trustbroker_ai/blob/main/docs/JUDGE_DEMO.md
```
