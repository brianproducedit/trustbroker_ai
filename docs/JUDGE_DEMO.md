# TrustBroker AI — Judge Demo & Sandbox Money Loop Guide

> **Competition:** [PayPal AI Hackathon 2026](https://paypalaihackathon.devpost.com/)  
> **Target Audience:** Hackathon Judges, Evaluators, and Technical Reviewers  
> **Key Innovation:** Autonomous AI milestone verification paired with real PayPal Orders v2 escrow captures and PayPal Payouts API disbursements.

---

## 1. Sandbox Account Architecture

To experience the complete, real-money loop without real funds, TrustBroker operates in **PayPal Sandbox Mode** (`https://api-m.sandbox.paypal.com`):

```
+------------------------------------+
| Client Personal Sandbox Account    |
| (Buyer / Employer)                 |
+------------------------------------+
                  |
                  | 1. PayPal Buttons Popup (Orders v2 Capture)
                  v
+------------------------------------+
| Platform Business Sandbox Account  |
| (TrustBroker Escrow Hub)           |
+------------------------------------+
                  |
                  | 2. Milestone AI Verified & Released
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
| **Platform Escrow** | Sandbox Business (REST App) | Holds escrow in sandbox; backend credentials issue orders and payouts. |
| **Freelancer (Receiver)** | Sandbox Personal Account | Target `paypal_payout_email` that receives the payout batch item. |

> **Note for Judges:** You can use your own sandbox personal accounts created in your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/accounts), or use the test credentials pre-populated in the project environment.

---

## 2. Demo User Credentials (Supabase Auth)

The app comes pre-seeded with clean test accounts representing both sides of the marketplace:

| Email | Workspace | Password | Characteristics |
|---|---|---|---|
| `client.demo@trustbroker.ai` | **Client** | `DemoPassword2026!` | Posts briefs, reviews proposals, funds milestones, releases payouts. |
| `freelancer.demo@trustbroker.ai` | **Freelancer** | `DemoPassword2026!` | Applies to listings, submits deliverable evidence, receives payouts. |
| `newcomer.demo@trustbroker.ai` | **Freelancer** | `DemoPassword2026!` | Empty past contract history, strong portfolio (demonstrates fair AI vetting). |

---

## 3. Step-by-Step Judge Walkthrough (The Complete Money Loop)

Follow this 5-minute path to verify every stage of the contract and payment lifecycle.

### Step 1: Sign in as Client
1. Navigate to `/sign-in`.
2. Sign in with `client.demo@trustbroker.ai` / `DemoPassword2026!`.
3. You land in the **Client Workspace** (`/app/client/dashboard`).

### Step 2: Review or Open a Contract
1. From the Contracts list, click into an active or awarded contract (e.g. `TB-2026-001`).
2. Notice the navigation tabs:
   - **Milestones**: Breakdown of deliverables, acceptance criteria, and status badges.
   - **Legal SOW**: Plain-language AI-drafted statement of work and exclusions.
   - **Payments**: The PayPal Escrow & Disbursement Hub.
   - **Audit Activity**: Immutable chronological event log.

### Step 3: Fund Milestone 1 with PayPal
1. Open the **Payments** tab.
2. In the **Milestone Escrow Allocation** card, locate the active unfunded milestone.
3. Click the gold **PayPal** button.
4. The PayPal Sandbox modal launches:
   - Server calls `POST /api/v1/payments/create-order` via PayPal Orders v2.
   - Complete checkout in the PayPal popup using your sandbox personal account.
5. Upon approval:
   - Server executes `POST /api/v1/payments/capture-order` and validates status `COMPLETED`.
   - Milestone status updates to `funded` (`staged_in_sandbox`).
   - The **PayPal Orders & Captures** ledger immediately records the **PayPal Order ID**, **Capture ID**, amount, and timestamp.
   - Audit trail registers `payment_capture_completed`.

### Step 4: Switch to Freelancer & Submit Work
1. Click **Switch workspace** in the sidebar to toggle into **Freelancer Mode** (or sign in as `freelancer.demo@trustbroker.ai`).
2. Open the contract and navigate to **Deliver & Inspect** (`/dashboard/contracts/{id}/delivery`).
3. Notice that evidence submission is unlocked because Milestone 1 is funded.
4. Freelancer provides deliverable links (GitHub repo URL, live demo URL, screenshots).
5. Click **Submit Deliverable Evidence**.

### Step 5: Run Automated AI Verification
1. The AI Verification Engine evaluates the submitted deliverables against each acceptance criterion.
2. The criterion assessment matrix shows:
   - Score out of 100
   - Individual Pass / Fail / Needs Review badges
   - AI summary citations
3. The milestone status transitions to `verified`.

### Step 6: Client Authorizes PayPal Payout Release
1. Switch back to **Client Workspace**.
2. On the verified milestone, the green button appears: **Authorize Payout ($XXX.XX USD)**.
3. Clicking opens the **Authorize PayPal Payout Release** dialog:
   - Shows recipient: freelancer's registered PayPal email (e.g. `freelancer-payout@sandbox.paypal.com`).
   - Shows the idempotency key: `payout:{milestone_id}`.
4. Click **Confirm & Disburse Payout**:
   - Backend calls PayPal Payouts API (`POST /v1/payments/payouts`).
   - Backend stores `paypal_batch_id` and `paypal_item_id`.
   - Milestone transitions to `settled` and `released`.

### Step 7: Freelancer Inspects Real Earnings Ledger
1. Switch to **Freelancer Workspace**.
2. Navigate to **Earnings & PayPal Payouts** (`/dashboard/payouts`).
3. Observe:
   - **Cleared Payouts**: Real aggregated sum of successful PayPal payouts.
   - **PayPal Disbursement Ledger**: Real row displaying:
     - Milestone & Contract reference
     - Amount (`$XXX.XX USD`)
     - Status: `PAID VIA PAYPAL`
     - Copyable **PayPal Batch ID** and **Payout Item ID**
     - Recipient PayPal email
     - Timestamp

### Step 8: Test AG Studio Financial Operations & AI Copilot
1. In either the **Client** or **Freelancer** workspace, click **Operations** in the sidebar (or navigate to `/app/client/operations` or `/app/freelancer/operations`).
2. Observe live KPI widgets:
   - Total Committed, Staged in Escrow, Cleared Payouts, and Pending Verification.
3. Test the **AG Studio Copilot Agent**:
   - Click one of the 3 prompt starters (e.g. *"Summarize total escrow funds and pending milestone verifications"* or *"Which milestone is currently in verification and what is its status?"*).
   - Notice the agent answers with real-time database context queried directly from PostgreSQL.
4. Inspect the **AG Grid Financial Ledger**:
   - Filter and sort across milestone amounts, counterparty names, and lifecycle status pills.

### Step 9: Verify Impartial AI Vetting (Newcomers vs. Experienced)
1. Sign in as Client (`client.demo@trustbroker.ai`).
2. View applicants for listing `TB-2026-002` ("Cross-Border B2B FinTech Invoice Settlement Portal").
3. Compare the two seeded applicants:
   - **Tariro Moyo (Experienced)**: Ranked `strong_fit` (92%) with matched skills and past high-throughput PayPal architecture.
   - **Kuda Nyamuda (Newcomer)**: Ranked `new_talent` (78%) evaluated fairly based on portfolio code quality and component design, without arbitrary penalties for low platform contract counts.

---

## 4. Test Evidence Assets (Pass vs. Fail)

When testing deliverable submission in Step 4, you can copy test data directly from the repo:
- **Passing Evidence Spec**: [`demo_assets/pass_evidence.txt`](../demo_assets/pass_evidence.txt) (sub-second Next.js Lighthouse scores, 100% test suite pass, verified PayPal webhook handler).
- **Failing Evidence Spec**: [`demo_assets/fail_evidence.txt`](../demo_assets/fail_evidence.txt) (unoptimized bundle size, missing server-side PayPal signatures, failing e2e tests).

---

## 5. Verification on PayPal Developer Dashboard

To independently confirm money movement in your own sandbox:

1. Log into [developer.paypal.com](https://developer.paypal.com).
2. Go to **Testing Tools** > **Sandbox Accounts**.
3. Check the **Notifications** or log into the Sandbox Business / Personal accounts at [sandbox.paypal.com](https://www.sandbox.paypal.com):
   - **Platform Business Account**: Shows the incoming Capture for the milestone and the outgoing Payout.
   - **Freelancer Personal Account**: Shows payment received from TrustBroker AI with the note: *"TrustBroker payout for {contract_code} — {milestone_title}"*.
4. Match the **Order ID**, **Capture ID**, and **Payout Batch ID** displayed in TrustBroker's UI with the PayPal dashboard entries.

---

## 5. Technical Safeguards & Edge Cases Built In

- **Idempotency Guarantee**: Every payout release request carries `PayPal-Request-Id: payout:{milestone_id}`. Re-submitting or re-clicking cannot double-disburse funds.
- **Strict Server-Side Validation**: Milestone status only becomes `funded` when PayPal's API responds with `COMPLETED`. Cancelling or closing the popup leaves the milestone unfunded.
- **PolicyEngine Integrity**: Releasing a payout is strictly forbidden by policy unless:
  1. Caller is verified as the contract client.
  2. The milestone has passed AI verification (`status == verified`).
  3. The milestone has actually been funded via PayPal (`payment_status == staged_in_sandbox`).
  4. The freelancer has a registered PayPal payout email.
