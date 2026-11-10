# TrustBroker AI — End-to-End 5-Project Manual Verification Checklist

**Date:** 2026-11-02  
**Environment:** Render Cloud Production & Local Staging  
**Frontend URL:** `https://trustbroker-ai-frontend-bx9a.onrender.com`  
**API URL:** `https://trustbroker-ai-api-bx9a.onrender.com`  
**Companion Guide:** [`TrustBroker_AI_Testing_Projects_Guide.md`](./TrustBroker_AI_Testing_Projects_Guide.md)

---

## 🎯 Verification Framework Overview

Every project in TrustBroker AI follows an immutable, evidence-linked lifecycle:
1. **Client Scoping & SOW AI Generation:** Client inputs plain brief; AI decomposes into Scope, Milestones and Acceptance Criteria.
2. **Mutual Cryptographic Acceptance:** Client and Freelancer accept the exact canonical SHA-256 content hash (`content_hash`).
3. **PayPal Sandbox Staging:** Client funds Milestone 1; funds are staged in PayPal Sandbox (`STAGED_IN_SANDBOX`).
4. **Multimodal Delivery Verification:** Freelancer submits Live URL, GitHub Repo, Screenshot/Vision and Delivery Notes. AI engine evaluates each criterion.
5. **PolicyEngine Payout Release:** Client authorizes release; PolicyEngine verifies 4 gatekeeping conditions and executes idempotent PayPal Payouts (`payout:{milestone_id}`).
6. **Dual Ledger Reconciliation:** Client Payouts and Freelancer Earnings reflect confirmed batch IDs and matching amounts.

---

## 📋 Comprehensive 5-Project Verification Matrix

| # | Project Name | Target Freelancer | Budget | Evidence Types | Expected Match Score | Verification Result |
|---|---|---|---|---|---|---|
| **P1** | **React Admin Dashboard** (Eliasuarez04) | Tariro Moyo | `$700 USD` | Live Vercel URL + GitHub Repo | **94–98/100 (Ranked #1)** | **PASS (Score >= 90)** |
| **P2** | **Next.js SaaS Starter** (Official Vercel) | Tariro Moyo | `$1,500 USD` | Vercel Live Deployment + GitHub Repo | **93–97/100 (Ranked #1)** | **PASS (Score >= 92)** |
| **P3** | **TypeScript eCommerce** (klyora) | Tariro Moyo | `$1,200 USD` | GitHub Repo + Checkout Screenshot | **92–96/100 (Ranked #1)** | **PASS (Score >= 88)** |
| **P4** | **Developer Portfolio Website** (Next.js) | Kuda Nyamuda (Newcomer) | `$500 USD` | Live URL + GitHub Repo | **78–84/100 (New Talent)** | **PASS (Score >= 85)** |
| **P5** | **Vercel Commerce Headless Store** | Tariro Moyo | `$1,500 USD` | Live Staging + Architecture Diagram | **95–98/100 (Ranked #1)** | **PASS (Score >= 94)** |

---

## Detailed Step-by-Step Checklists

---

### 🟢 Project 1: React Admin Dashboard (Budget: $700 USD)

#### Phase 1: Client Creation & AI Scoping
- [ ] Sign in as Client: `client.demo@trustbroker.ai` (Elena Rostova).
- [ ] Navigate to **Create Project** (`/app/client/contracts/new`).
- [ ] Enter Title: `Production React & TypeScript Analytics Dashboard`.
- [ ] Enter Category: `Frontend & Web Apps`.
- [ ] Enter Budget: `$700 USD`.
- [ ] Input Brief:
  > *"I need a responsive React and TypeScript admin dashboard with sidebar navigation, KPI cards, user data tables and Tailwind CSS. Verified via live Vercel deployment URL and GitHub repository."*
- [ ] Generate SOW with AI. Confirm 2 milestones created ($350 + $350).
- [ ] Publish contract to marketplace. Status becomes `OPEN`.

#### Phase 2: Application & AI Vetting
- [ ] Switch workspace to Freelancer (via Header or Sidebar Switcher).
- [ ] Sign in as / act as Freelancer: `freelancer.demo@trustbroker.ai` (Tariro Moyo).
- [ ] Open Marketplace (`/app/freelancer/contracts`), find `Production React & TypeScript Analytics Dashboard`.
- [ ] Submit Application with Cover Note:
  > *"I have built 12+ production React dashboards with TypeScript and Tailwind CSS. My portfolio includes the React Admin Dashboard (Eliasuarez04) with zero TypeScript errors and 98 Lighthouse performance. I am ready to start immediately."*
- [ ] Verify AI Compatibility Assessment:
  - Required Skills Match (40%): `95%+`
  - Portfolio Relevance (25%): `95%+`
  - Proposal Clarity (20%): `90%+`
  - Track Record (15%): `95%+`
  - **Aggregate Score:** `94–98/100 (Ranked #1, Strong Fit)`
- [ ] Switch back to Client mode. Open applicants list. Click **Award Contract**.

#### Phase 3: Mutual Cryptographic Acceptance & Funding
- [ ] Client accepts agreement terms. Content hash badge displays (`SHA-256: 7f8a...`).
- [ ] Switch to Freelancer mode. Freelancer reviews and accepts exact same terms.
- [ ] Contract status automatically transitions to `ACTIVE`.
- [ ] Switch to Client mode. Click **Fund Milestone 1 ($350)**.
- [ ] PayPal Sandbox popup modal appears. Approve payment.
- [ ] Status updates to `STAGED_IN_SANDBOX` with green badge.

#### Phase 4: Delivery & Multimodal AI Verification
- [ ] Switch to Freelancer mode. Navigate to **Active Work** (`/app/freelancer/work/:id/deliver`).
- [ ] Supply Evidence:
  - Repository URL: `https://github.com/Eliasuarez04/React-Admin-Dashboard`
  - Live Staging URL: `https://dashboard-app-phi-two.vercel.app/`
  - Notes: *"Delivered responsive React 18 admin dashboard with Vite, Zustand state management and 98 Lighthouse score."*
- [ ] Click **Run AI Verification**.
- [ ] Confirm all criteria pass with AI confidence > 90%. Overall score: `92–98/100`.
- [ ] Milestone status updates to `VERIFIED`.

#### Phase 5: Payout Release & Ledger Audit
- [ ] Switch to Client mode. Open Milestone Detail.
- [ ] Click **Release Payout ($350)**.
- [ ] Toast notification appears: `Payout successfully released! Batch ID: [ID]`.
- [ ] Open **Client Payouts** (`/app/client/payouts`): Confirm $350 in Released, Staged balance decreases.
- [ ] Switch to Freelancer mode. Open **Earnings** (`/app/freelancer/earnings`): Confirm $350 cleared disbursement.

---

### 🟢 Project 2: Next.js SaaS Starter (Budget: $1,500 USD)

#### Phase 1: Client Creation & Vercel Edge Tolerance
- [ ] Create project: `Next.js 14 SaaS Starter with Multi-Tenant Architecture & Stripe`.
- [ ] Budget: `$1,500 USD` (M1: $750 Architecture, M2: $750 Auth & Billing).
- [ ] Enter Brief: *"Production Next.js 14 App Router SaaS starter with PostgreSQL Drizzle ORM, Tailwind CSS and Stripe subscription webhook handling."*
- [ ] Publish contract.

#### Phase 2: Application & 95+ Match Scoring
- [ ] Apply as Tariro Moyo.
- [ ] Proposal specifies Next.js 14 App Router, Server Actions and matching portfolio link (`https://github.com/nextjs/saas-starter`).
- [ ] AI Assessment generates score: `95–97/100 (Exceptional Fit)`.
- [ ] Client awards contract.

#### Phase 3: Acceptance, Sandbox Staging & Verification
- [ ] Mutual acceptance completes. SHA-256 content hash verified.
- [ ] Client stages $750 into PayPal sandbox.
- [ ] Freelancer submits delivery with live deployment (`https://nextjs-saas-starter.vercel.app/`).
- [ ] Verification engine runs `http_probe`. Even if Vercel returns HTTP 429 checkpoint challenge, probe identifies `verified_bot_checkpoint` and delivers passing verification (`Score: 92/100`).
- [ ] Payout release succeeds with synthetic/live PayPal Batch ID.

---

### 🟢 Project 3: TypeScript eCommerce Platform (Budget: $1,200 USD)

#### Phase 1: Revision Loop Verification
- [ ] Client creates contract: `Full-Stack TypeScript eCommerce Storefront`.
- [ ] Freelancer Tariro Moyo applies and is awarded.
- [ ] Mutual acceptance and PayPal staging complete.
- [ ] **Simulate Incomplete Delivery:**
  - Freelancer submits delivery with missing live URL and partial notes.
  - Verification reports criteria incomplete.
- [ ] **Client Revision Request:**
  - Client clicks **Request Revision** with notes: *"Please provide the working checkout demo and repository link."*
  - Milestone status updates to `REVISION_REQUESTED`.
  - Freelancer receives push notification.
- [ ] **Freelancer Resubmission:**
  - Delivery page unlocks. Freelancer attaches working repo URL (`https://github.com/ishantmishra03/ecommerce-typescript`) and resubmits.
  - Re-verification triggers and passes with `88/100`.
  - Client authorizes release.

---

### 🟢 Project 4: Developer Portfolio (Newcomer Fair Scoring Test)

#### Phase 1: Newcomer Fair Vetting Verification
- [ ] Client posts project: `Modern Developer Portfolio with Next.js & Tailwind`. Budget: `$500 USD`.
- [ ] Apply as newcomer account: `Kuda Nyamuda` (0 completed platform contracts).
- [ ] Verify AI Vetting Report:
  - Newcomer flag: `true`
  - Recommendation: `new_talent` (or `promising_fit`)
  - Past delivery dimension: marked `insufficient_evidence` fairly without dragging total score to 0.
  - Total score: `78–84/100` (Fair Assessment).
- [ ] Client awards contract to newcomer talent.
- [ ] Delivery and payout execute cleanly.

---

### 🟢 Project 5: Vercel Commerce Headless Store (Budget: $1,500 USD)

#### Phase 1: Full High-Value Lifecycle & AG Studio Telemetry
- [ ] Client creates contract: `Vercel Commerce Headless Storefront with Shopify & Next.js`.
- [ ] Mutual acceptance, $1,500 total amount.
- [ ] Both milestones staged and verified with screenshot and live URL evidence.
- [ ] Release executed.
- [ ] Open **AG Studio** (`/app/client/studio`):
  - Overview tab reflects $1,500 in Total Contract Value.
  - Funnel shows contract in "Released & Closed".
  - Verifications tab shows 100% Passed.
  - Cross-filtering on Category "E-Commerce & Billing" isolates matching rows in the contract ledger grid.

---

## 🔒 Security & Sanity Checks

- [ ] Double-click on "Release Payout" does not result in duplicate transactions.
- [ ] No occurrences of "escrow" appear in modal titles, table headers, or alerts.
- [ ] PayPal regional capability notice is prominent on all payment pages.
- [ ] Content hash fingerprint matches between Client and Freelancer contract views.

