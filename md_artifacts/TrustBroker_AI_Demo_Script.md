# TrustBroker AI — PayPal Hackathon Demo Video Script
## Full Production Guide: What to Show, What to Say, When to Click

> **Target Duration:** 10–12 minutes  
> **Target Prize Categories:** Best Use of PayPal · Agentic AI · AG Studio / AG Grid · Best Developer Experience · Overall Grand Prize  
> **Live URL:** https://trustbroker-ai-frontend-bx9a.onrender.com  
> **Hackathon:** PayPal AI Hackathon 2026 — devpost.com

---

## Pre-Recording Checklist

Before hitting record, have these ready in separate browser tabs:

| Tab | URL | Purpose |
|---|---|---|
| Tab 1 | `https://trustbroker-ai-frontend-bx9a.onrender.com/sign-in` | Main app — start here |
| Tab 2 | `https://developer.paypal.com/dashboard/accounts` | PayPal Dev Dashboard (verify sandbox IDs) |
| Tab 3 | (optional) Your IDE / GitHub repo | Show code snippets if needed |

**Credentials to have ready:**
```
Client:     client.demo@trustbroker.ai     / DemoPassword2026!
Freelancer: freelancer.demo@trustbroker.ai / DemoPassword2026!
Newcomer:   newcomer.demo@trustbroker.ai   / DemoPassword2026!

PayPal Sandbox Buyer:   sb-buyer@sandbox.paypal.com
PayPal Payout Email:    freelancer-payout@sandbox.paypal.com
```

**Screen resolution:** 1920×1080 recommended. Use browser zoom 90% for the operations pages (AG Grid).

---

## SECTION 1 — Opening Hook (0:00–0:45)

### 🎙️ What to Say
> *"Every year, freelancers lose billions of dollars to unpaid invoices. And every year, clients waste money on work that never gets finished — or never gets delivered at all. The fundamental problem? There's no trusted intermediary that can objectively verify whether work is done, enforce milestone payments and move money automatically when it is.*
>
> *TrustBroker AI solves that — with real PayPal money movement, autonomous AI verification and a policy engine that guarantees funds only move when work is actually verified.*
>
> *Let me show you how it works, end to end, in a live sandbox."*

### 📹 What to Show
- **Don't show the app yet.** Record this section as a talking-head or with the landing page blurred/zoomed in background.
- Keep it confident, punchy. Aim for under 45 seconds.

---

## SECTION 2 — Platform Overview & Tech Stack (0:45–1:30)

### 🎙️ What to Say
> *"TrustBroker AI is built on three pillars:"*
>
> *"First — **PayPal as the financial backbone**. Every milestone payment uses PayPal Orders v2 for capture and PayPal Payouts API for disbursement. Real sandbox IDs, real API calls, traceable on the PayPal Developer Dashboard."*
>
> *"Second — **Agentic AI powered by Groq**. We use Google AG Studio's React agent framework, with Groq LPU inference for sub-second response times. The AI verifies deliverables, generates legal contracts, vets applicants — but it never moves money unilaterally."*
>
> *"Third — **A PolicyEngine** that acts as the final gatekeeper. AI recommends; the client decides; PayPal executes. The human is always in the loop for financial decisions."*

### 📹 What to Show
- Navigate to the **landing page** (home `/`).
- Hover over or scroll through the feature highlights if the landing page has them.
- **Optional:** Briefly show `backend/app/services/policy_engine.py` in your IDE — just enough to show it exists.

---

## SECTION 3 — Client Journey: Post a Job (1:30–3:30)

### Step 3a — Sign In as Client

**🎙️ Say:**
> *"Let me sign in as our demo client — Elena Rostova, Managing Director at Acme Global Ventures."*

**📹 Do:**
1. Go to `https://trustbroker-ai-frontend-bx9a.onrender.com/sign-in`
2. Enter `client.demo@trustbroker.ai` / `DemoPassword2026!` → click **Sign In**
3. Land on the **Client Dashboard** (`/app/client`) — pause for a beat to let the UI settle.

**🎙️ Say:**
> *"This is the Client Workspace. Elena sees her active contracts, pending deliveries needing review and her PayPal sandbox balance — all in one place."*

---

### Step 3b — Create a New Contract with AI SOW Generator

**📹 Do:**
1. Click **New Contract** in the left sidebar → navigate to `/app/client/contracts/new`
2. Fill in the project title: *"AI-Powered Payment Dashboard"*
3. Select a category (e.g., *FinTech / Payments*).
4. Click the **✨ Generate SOW with AI** button (or similar AI Brief Generator button).

**🎙️ Say (while Groq is generating):**
> *"Watch this — Groq's LPU processes the brief in under a second. It's not just generating boilerplate. The AI is producing structured milestones, acceptance criteria, exclusions and a plain-English scope of work — ready to publish to the marketplace."*

**📹 Do (after generation):**
5. Show the generated SOW in the form — scroll through the milestones, acceptance criteria.
6. Set milestone value (e.g., \$400).
7. Click **Publish to Marketplace**.

**🎙️ Say:**
> *"The brief is now live on the marketplace. Any freelancer can apply. And critically — that acceptance criteria Elena just reviewed? The AI verifier will score deliverables against those exact criteria at payout time."*

---

## SECTION 4 — Freelancer Journey: Apply to a Listing (3:30–5:00)

### Step 4a — Switch to Freelancer Persona

**📹 Do:**
1. Click **Switch to Freelancer** in the sidebar (or bottom-left mode toggle).
2. The workspace re-renders as **Freelancer Home** (`/app/freelancer`).

**🎙️ Say:**
> *"Now I'm Tariro Moyo — an experienced developer. Let me find that listing on the marketplace."*

---

### Step 4b — Browse Marketplace & View Listing

**📹 Do:**
1. Click **Marketplace** (`/app/freelancer/contracts`) in the sidebar.
2. Find the listing you just published (or use a pre-seeded one like *"Cross-Border B2B FinTech Invoice Settlement Portal"*).
3. Click into the listing detail.

**🎙️ Say:**
> *"Here's the listing detail — structured milestones, acceptance criteria, the client profile with their transaction volume. Everything Tariro needs to decide if this is worth applying for."*

---

### Step 4c — Submit Application

**📹 Do:**
1. Click **Apply** on the listing.
2. Fill in a proposal (or use pre-seeded applicant data).
3. Submit the application.

**🎙️ Say:**
> *"Application submitted. Now let me show you something important — the AI Vetting system."*

---

### Step 4d — Show AI Vetting (Newcomer Fairness)

**📹 Do:**
1. Switch back to **Client mode**.
2. Navigate to the contract's **Applications** tab.
3. Show the two applicants side by side:
   - **Tariro Moyo** — `strong_fit` badge, 92% score
   - **Kuda Nyamuda** — `new_talent` badge, 78% score (newcomer)

**🎙️ Say:**
> *"This is one of our fairness innovations. Traditional platforms penalize newcomers because they have fewer completed contracts. TrustBroker's AI vetting agent scores on portfolio code quality, communication signals and skill alignment — not arbitrary reputation counts. Kuda is a newcomer with a strong portfolio and the AI sees that. No bias against first-timers."*

---

## SECTION 5 — Contract Award & Mutual Acceptance (5:00–5:45)

**📹 Do:**
1. Click **Award Contract** to Tariro.
2. Show the **Mutual Acceptance** modal — cryptographic SHA-256 content hash of the SOW.
3. Both parties accept (you can show this with the demo accounts).

**🎙️ Say:**
> *"Contract awarded. Now here's something legally significant — TrustBroker generates a SHA-256 content hash of the agreed Statement of Work. This creates a tamper-proof record of exactly what was agreed. If a dispute arises, neither party can claim the scope was different."*

---

## SECTION 6 — PayPal Milestone Funding (5:45–7:15)

> **🏆 This is the core PayPal prize moment — be clear and deliberate here.**

### Step 6a — Open Payments Tab

**📹 Do:**
1. Navigate to the contract detail (`/app/client/contracts/:id`).
2. Click the **Payments** tab.

**🎙️ Say:**
> *"This is the PayPal Funding Hub. Elena needs to fund Milestone 1 before Tariro can deliver anything. The escrow model means money is committed — but not released — until work is verified."*

---

### Step 6b — Fund via PayPal Smart Buttons

**📹 Do:**
1. Click the gold **PayPal** smart button for Milestone 1.
2. The PayPal Sandbox popup launches.
3. Log in with the sandbox buyer account.
4. Complete checkout.

**🎙️ Say (while popup is loading):**
> *"This is a live PayPal Orders v2 call. The backend just called `POST /api/v1/payments/create-order` and got back a real PayPal Order ID. The sandbox popup is now handling the buyer authentication flow — exactly as it would in production."*

**🎙️ Say (after completion):**
> *"Payment captured. Watch the milestone status flip to 'Funded'. And look here — the PayPal Order ID and Capture ID are recorded in real time. These IDs are verifiable directly on the PayPal Developer Dashboard."*

**📹 Do:**
5. Show the PayPal Orders ledger with the real Order ID and Capture ID.
6. **Optional:** Switch to the PayPal Developer Dashboard tab and show the same IDs — this is powerful for judges.

---

## SECTION 7 — Freelancer Delivery Submission (7:15–8:30)

### Step 7a — Switch to Freelancer & Navigate to Deliver

**📹 Do:**
1. Click **Switch to Freelancer**.
2. Navigate to **My Work** or the contract.
3. Click **Submit Delivery** → goes to `/app/freelancer/work/:id/deliver`.

**🎙️ Say:**
> *"Tariro can see that Milestone 1 is funded — the escrow is staged. Now he can submit his deliverables."*

---

### Step 7b — Submit Evidence Package

**📹 Do:**
1. Enter the GitHub repo URL: `https://github.com/ishantmishra03/ecommerce-typescript`
2. Enter the live Vercel URL: `https://klyora.vercel.app`
3. Enter delivery notes.
4. Upload a screenshot (use `demo_assets/pass_evidence.txt` for data reference).
5. Click **Submit Deliverable Evidence**.

**🎙️ Say:**
> *"The evidence package is submitted — a GitHub repo, a live staging URL, written attestation and a screenshot. This is everything the AI verifier needs."*

---

### Step 7c — AI Verification Running

**📹 Do:**
- Watch / show the AI verification running (spinner or progress state).

**🎙️ Say:**
> *"Now the Groq-powered verification agent kicks in. It runs four parallel checks:"*
> *"One — an HTTP probe of the live URL, checking response codes and HTTPS."*
> *"Two — a vision heuristic analysis of the uploaded screenshot."*
> *"Three — a document scan of the delivery notes and attestation."*
> *"Four — a repository inspection checking for TypeScript, package.json, README and open-source license."*
> *"All four adapters run through Groq's LPU — results come back in under 400 milliseconds."*

---

### Step 7d — Show Verification Results

**📹 Do:**
- Show the **criterion assessment matrix** with Pass/Fail/Needs Review badges.
- Show the overall score: **90/100**.
- Show the AI summary citations.

**🎙️ Say:**
> *"Three of three criteria: Passed. HTTP 200 at 372ms, HTTPS confirmed. Vision heuristic: screenshot artifact verified with SHA-256 hash. GitHub repository confirmed: TypeScript, branch main, 4 root files. Overall score: 90 out of 100. Milestone status: Verified — ready to disburse."*

---

## SECTION 8 — Client Review & PayPal Payout (8:30–9:45)

> **🏆 This is the second major PayPal prize moment.**

### Step 8a — Switch Back to Client & Navigate to Review

**📹 Do:**
1. Click **Switch to Client** (or sign in as `client.demo@trustbroker.ai`).
2. The Dashboard shows a **"Review Delivery"** prompt card for the verified milestone.
3. Click **Review Delivery** → navigates to `/app/client/contracts/:id/review`.

**🎙️ Say:**
> *"Back in the Client Workspace, Elena gets notified that a delivery is ready for review. She navigates to the Review Delivery page — a three-column settlement interface."*

---

### Step 8b — Walk Through the 3-Column Review Interface

**📹 Do (slowly pan across each column):**

**Column 1 — Freelancer Delivery Package:**
> *"On the left: everything Tariro submitted. GitHub repo link, live Vercel URL, delivery notes, the uploaded screenshot — all with timestamps and version tracking."*

**Column 2 — AI Verification Assessment:**
> *"In the center: the AI's independent assessment. Each acceptance criterion scored with Pass badges and AI-generated citations. Summary analysis at the bottom. The AI has done its job — now it's Elena's decision."*

**Column 3 — Client Settlement Panel (focus here):**
> *"On the right: the action panel. The milestone is verified and ready. There are three options:"*
> *"The primary action — the green **Authorize PayPal Payout** button — this sends real sandbox funds to Tariro."*
> *"Two secondary options: **Request Revision** if the work needs changes or **AI Dispute** to escalate to our dispute resolution engine."*
> *"Elena is satisfied. Let's authorize the payout."*

---

### Step 8c — Authorize PayPal Payout

**📹 Do:**
1. Click the green **Authorize PayPal Payout (\$400)** button in Column 3.
2. A confirmation dialog appears.
3. Click **Confirm & Disburse**.

**🎙️ Say (while processing):**
> *"The backend is calling PayPal Payouts API — `POST /v1/payments/payouts` — with the idempotency key `payout:{milestone_id}`. This prevents any double-disbursement no matter how many times the button is clicked."*

**📹 Do (after success):**
4. Show the **success toast** with the real PayPal Batch Payout ID.
5. The milestone status updates to **Settled / Released**.

**🎙️ Say:**
> *"Done. Real PayPal Batch Payout ID generated. Tariro's sandbox account has been credited. The milestone is closed. And critically — the AI never released this money. Elena did. The AI verified. The PolicyEngine authorized. PayPal executed."*

---

### Step 8d — Freelancer Earnings Ledger

**📹 Do:**
1. Switch to Freelancer mode.
2. Navigate to **Payouts** (`/app/freelancer/earnings`).
3. Show the **PayPal Disbursement Ledger** row with:
   - Milestone and contract reference
   - Amount: `\$400.00 USD`
   - Status: `PAID VIA PAYPAL`
   - Copyable PayPal Batch ID and Payout Item ID
   - Recipient PayPal email
   - Timestamp

**🎙️ Say:**
> *"Tariro's earnings ledger updates in real time. Every field here is a real PayPal API response — batch ID, item ID, payout email. Cross-referenceable on the PayPal Developer Dashboard."*

---

## SECTION 9 — AG Studio Operations Intelligence (9:45–11:00)

> **🏆 This section targets the AG Studio / AG Grid prize.**

### Step 9a — Client Operations Studio

**📹 Do:**
1. Switch to Client mode.
2. Click **Operations** in the sidebar → `/app/client/studio`.

**🎙️ Say:**
> *"This is the AG Studio Financial Operations page — built specifically to demonstrate real-time agentic intelligence over live financial data."*

**📹 Do:**
3. Point to the **KPI cards**:
   - Total Committed
   - Staged in Sandbox (PayPal captured, pending release)
   - Cleared Payouts
   - Pending Verification

**🎙️ Say:**
> *"These KPIs pull from live Supabase data — real-time, no mocking. Every number here corresponds to actual PayPal API calls we just made."*

---

### Step 9b — AG Grid Financial Ledger

**📹 Do:**
1. Scroll down to the **AG Grid ledger**.
2. Sort by amount — click the Amount column header.
3. Filter by status = `Verified` or `Released`.

**🎙️ Say:**
> *"The AG Grid ledger gives Elena full tabular control over every milestone in her portfolio. She can sort, filter and export. This is AG Grid's enterprise data grid running against real Supabase queries."*

---

### Step 9c — AG Studio AI Copilot

**📹 Do:**
1. Click the **AI Copilot** / **Ask AI** button (bottom-right floating button or inline panel).
2. Click the prompt starter: *"Summarize total staged funds and pending milestone verifications"*
3. Wait for the agent response.

**🎙️ Say:**
> *"This is the AG Studio React agent — not a chatbot. It's an agentic system with tool access to the live ledger. It can query, aggregate and reason over financial data in real time. Watch how it answers with specific numbers drawn from the actual database."*

**📹 Do:**
4. Ask a follow-up: *"Which submissions have been waiting the longest?"*

**🎙️ Say:**
> *"Sub-second response, real data, real reasoning. Groq LPU makes this possible at scale."*

---

### Step 9d — Freelancer Operations Studio

**📹 Do:**
1. Switch to Freelancer mode.
2. Click **Operations** → `/app/freelancer/studio`.
3. Show the equivalent KPI cards (Pending Earnings, Cleared, Submission Queue).

**🎙️ Say:**
> *"Tariro gets his own operations view — same AG Grid architecture, but scoped to his earnings and submission history. Both portals are built on the same AG Studio foundation."*

---

## SECTION 10 — PolicyEngine & Audit Trail (11:00–11:30)

**📹 Do:**
1. Navigate to **Activity** / **Audit Trail** (`/app/activity/:id` or `/app/client/contracts/:id` Audit tab).
2. Scroll through the event log.

**🎙️ Say:**
> *"Every action in TrustBroker generates an immutable audit event — payment captures, AI verifications, payout releases, revision requests. Each event carries a SHA-256 integrity proof."*

**📹 Do:**
3. If time allows, show `backend/app/services/policy_engine.py` briefly in IDE.

**🎙️ Say:**
> *"The PolicyEngine enforces four non-negotiable rules before any payout can release: the caller must be the verified contract client, the milestone must pass AI verification, the milestone must have a PayPal capture on record and the freelancer must have a registered payout email. If any of these fail, the transaction is blocked — full stop. AI never bypasses this."*

---

## SECTION 11 — Closing & Prize Summary (11:30–12:00)

**🎙️ Say:**
> *"TrustBroker AI demonstrates what's possible when real PayPal infrastructure, agentic AI and policy-driven governance come together."*
>
> *"For the **Best Use of PayPal** prize: real Orders v2 captures, real Payouts API disbursements, traceable sandbox IDs — the complete money loop."*
>
> *"For the **Agentic AI** prize: an AG Studio React agent with live tool access, Groq LPU inference, multimodal delivery verification across four adapter types."*
>
> *"For the **AG Studio / AG Grid** prize: enterprise data grids, cross-filtering KPI dashboards and an AI copilot that reasons over live financial data — in both the client and freelancer portals."*
>
> *"And for the **developer experience** prize: fully typed TypeScript, clean role-based routing, a PolicyEngine that makes the codebase auditable and extensible."*
>
> *"The live demo is at* `trustbroker-ai-frontend-bx9a.onrender.com` *— all credentials are in the judge guide. Thank you."*

---

## Appendix A — Route Reference for Demo Navigation

| Screen | URL | Notes |
|---|---|---|
| Landing Page | `/` | App homepage |
| Sign In | `/sign-in` | Auth page |
| Client Dashboard | `/app/client` | Post-login client home |
| Client Contracts | `/app/client/contracts` | List of all contracts |
| Contract Detail | `/app/client/contracts/:id` | Tabs: Milestones, SOW, Payments, Audit |
| New Contract | `/app/client/contracts/new` | AI SOW Generator form |
| Review Delivery | `/app/client/contracts/:id/review` | 3-column settlement interface |
| Client Operations | `/app/client/studio` | AG Studio + AG Grid |
| Freelancer Home | `/app/freelancer` | Post-login freelancer home |
| Marketplace | `/app/freelancer/contracts` | Browse & apply to listings |
| Submit Delivery | `/app/freelancer/work/:id/deliver` | Evidence submission + AI verification |
| Freelancer Operations | `/app/freelancer/studio` | AG Grid earnings ledger |
| Freelancer Payouts | `/app/freelancer/earnings` | PayPal disbursement ledger |
| Activity History | `/app/activity/:id` | Audit event log |
| Notifications | `/app/notifications` | Real-time notification feed |

---

## Appendix B — Prize Category Coverage Matrix

| Prize Category | Evidence in Demo | Section |
|---|---|---|
| **Best Use of PayPal** | Orders v2 capture (real Sandbox Order ID + Capture ID), Payouts API (real Batch ID), idempotency keys, PayPal Smart Buttons | Sections 6, 8 |
| **Agentic AI** | AG Studio React agent, Groq LPU <400ms inference, multimodal verification (HTTP + Vision + Docs + Repo), AI SOW generation, AI applicant vetting | Sections 3b, 4d, 7c-d, 9c |
| **AG Studio / AG Grid** | Client + Freelancer Operations Studio, enterprise AG Grid ledgers, KPI cards, AG Studio AI Copilot with live tool access | Section 9 |
| **Best Dev Experience** | TypeScript, `ROUTES.*` constants, PolicyEngine, role-based routing, clean component architecture | Section 10 (brief mention) |
| **Overall Grand Prize** | Complete end-to-end workflow demonstrating all categories together | Full demo flow |

---

## Appendix C — Key Things NOT to Say (Compliance)

> [!CAUTION]
> Do NOT say any of the following — they could violate hackathon rules or misrepresent the product:

- ❌ "Real money" — always say "sandbox funds" or "simulated funds in PayPal Sandbox"
- ❌ "Production ready" — say "sandbox-proven" or "ready to point at PayPal production with credential swap"  
- ❌ "The AI decides to release the payout" — always say "the AI verifies; the client authorizes; PayPal executes"
- ❌ Claim any metric (response time, accuracy) you haven't actually measured in this session

---

## Appendix D — Backup Talking Points (If Something Breaks)

### If PayPal Sandbox popup fails to load:
> *"PayPal sandbox sometimes has connectivity delays in recorded demos — let me show you a previously captured result. Here's the Order ID and Capture ID from an earlier session, verifiable on the PayPal Developer Dashboard."* (Show screenshot from `demo_assets/`)

### If AI verification times out:
> *"The Groq endpoint occasionally has cold starts. The verification has already run on this contract — let me navigate directly to the results."* (Navigate to the already-verified contract)

### If the app is slow (Render cold start):
> *"The app is running on Render's free tier — it cold-starts on first request. Let me give it a moment."* (Have the app loaded before you start recording)

> [!TIP]
> Pre-warm the app by visiting the URL 5 minutes before recording. Render free-tier instances sleep after 15 minutes of inactivity.

---

## Appendix E — Demo Video Technical Tips

1. **Record at 1080p 60fps** — AG Grid and the PayPal popup need smooth scrolling.
2. **Disable browser notifications** — Windows notification toasts will appear on screen.
3. **Use a Loom or OBS** — Loom auto-produces an MP4; OBS gives you more control.
4. **Keep mouse movements deliberate** — pause 1 second on each key element before moving.
5. **Mute Slack/Teams** — notification sounds will be audible.
6. **Record in a private window** — prevents autocomplete or saved passwords showing personal data.
7. **Have the PayPal popup pre-authenticated** — log into PayPal Sandbox in a separate tab first so the popup auto-fills credentials.
8. **Target 10 minutes** — judges review many submissions; tight is better than thorough.

