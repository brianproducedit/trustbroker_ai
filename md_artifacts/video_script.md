# TrustBroker AI — 3-Minute Demo Video Script
**Hackathon:** PayPal AI Hackathon 2026 · **Recording date:** 2026-11-11

---

> [!TIP]
> Target runtime: **2:45 – 3:00 minutes**. Record at 1080p. No watermark. Captions optional.
> Open two private browser windows side-by-side: one Client, one Freelancer.

---

## 🎬 Scene 1 — Hook & Problem (0:00 – 0:20)

**[Screen: Landing page — highlighting the dual persona banner and live contract cards]**

**Narrate:**
> *"Freelancers lose billions every year to unpaid invoices and endless revision cycles. Clients risk capital on unfinished code or vague promises. Traditional platforms take 10 to 20% cuts and lock funds in slow, manual dispute queues.*
>
> *TrustBroker AI flips the script: clients pre-stage milestone funds via authentic PayPal Orders v2, an agentic AI engine validates concrete evidence against measurable acceptance criteria and payouts disburse via the official PayPal Payouts API. AI inspects evidence — humans authorize — and PayPal moves the money."*

---

## 🎬 Scene 2 — Client Posts a Contract (0:20 – 0:50)

**[Screen: `/sign-in` → sign in as `client.demo@trustbroker.ai`]**

**Narrate:**
> *"I'm signed in as the client. I'll click New Contract — the AI SOW Generator drafts structured milestones and acceptance criteria from a plain English brief in under a second using Groq's LPU."*

**[Action: Show the SOW generator producing milestones — OR skip to the pre-seeded TB-2026-001 contract already open]**

> *"The contract is published to the marketplace. Freelancers can apply — and the AI vetting engine impartially scores each applicant."*

**[Action: Navigate to Applications — show Tariro (94%, Strong Fit) vs Kuda (78%, New Talent)]**

> *"Crucially — the newcomer isn't scored zero. AI evaluates portfolio quality and code signals, not just contract history."*

---

## 🎬 Scene 3 — Fund Milestone with PayPal (0:50 – 1:20)

**[Screen: Contract TB-2026-001 → Payments tab]**

**Narrate:**
> *"The client funds Milestone 2 — Storefront & Cart — using the PayPal Smart Button. This calls PayPal Orders v2."*

**[Action: Click the PayPal button → PayPal sandbox popup opens → complete checkout]**

> *"The PayPal modal captures the payment. The backend validates the COMPLETED status, real Order ID and Capture ID — no synthetic IDs, no fabricated data."*

**[Show: Milestone status → `Funded / Staged in Sandbox`. Payments ledger shows real Capture ID]**

---

## 🎬 Scene 4 — Freelancer Submits Evidence & Multimodal Verification (1:20 – 1:50)

**[Screen: Switch to Freelancer workspace → `/app/freelancer/work/:id/deliver`]**

**Narrate:**
> *"The freelancer submits concrete deliverable evidence — a GitHub repo, a live staging URL, delivery notes and UI screenshots.*
>
> *TrustBroker's verification engine runs across specialized adapters: the HTTP probe validates live endpoint health, Vision AI inspects design compliance, the Document adapter checks specifications and the Repository adapter audits file structures and tests.*
>
> *Crucially: verification is truthful. If evidence is subjective, missing, or requires human eyes, it flags NEEDS REVIEW — preventing unsafe auto-pass. Only verified criteria with strict AI assessment can proceed to automatic settlement eligibility."*

**[Show: Verification progress → score badge appears (e.g., 92/100 PASSED) with citations]**

---

## 🎬 Scene 5 — Client Authorizes Payout (1:50 – 2:20)

**[Screen: Switch to Client → `/app/client/contracts/:id/review`]**

**Narrate:**
> *"The client sees the 3-column review interface: delivery evidence, AI assessment and the settlement panel."*

> *"The PolicyEngine enforces four non-negotiable conditions: verified milestone, confirmed PayPal capture, registered freelancer PayPal email and client authorization."*

**[Action: Click "Authorize PayPal Payout"]**

> *"One click calls the PayPal Payouts API. The payout is submitted to PayPal with an idempotency key to prevent double-disbursement. Status shows 'Payout Submitted' — it transitions to confirmed once PayPal sends the webhook."*

**[Show: Toast with real PayPal Batch ID]**

---

## 🎬 Scene 6 — Freelancer Checks Earnings (2:20 – 2:35)

**[Screen: Freelancer → `/app/freelancer/earnings`]**

**Narrate:**
> *"The freelancer sees the payout in their earnings ledger — with the real PayPal Batch ID and Item ID, verifiable directly on the PayPal Developer Dashboard."*

---

## 🎬 Scene 7 — AG Studio Operations (2:35 – 2:55)

**[Screen: Client → `/app/client/studio`]**

**Narrate:**
> *"The Operations Studio shows live KPIs — staged funds, cleared payouts, pending verifications — powered by enterprise AG Grid. The AI Copilot answers real-time operational queries about the ledger."*

**[Action: Type "Summarize staged funds and pending verifications" → AI responds]**

---

## 🎬 Scene 8 — Closing (2:55 – 3:00)

**[Screen: Landing page or logo slide]**

**Narrate:**
> *"TrustBroker AI — autonomous freelance contracts with AI verification and real PayPal payment infrastructure. AI inspects. Humans authorize. PayPal moves the money."*

---

## 📋 Recording Checklist

- [ ] Record at 1080p minimum
- [ ] Keep browser zoom at 100% (or 90% to show more content)
- [ ] Use pre-seeded accounts (no live signup needed)
- [ ] Skip slow Render cold-start — open both tabs and wait for them to load **before** recording
- [ ] Show the PayPal modal (even if just opening it briefly) — this is key for judges
- [ ] Show the AI score badge prominently
- [ ] Show the Batch Payout ID toast at the end of payout
- [ ] Upload to YouTube (unlisted OK per Devpost rules)
- [ ] Add YouTube link to Devpost submission form

---

## ⏱️ Timing Reference

| Scene | Clock | Key action |
|---|---|---|
| Hook | 0:00 – 0:20 | Problem statement |
| Contract + Vetting | 0:20 – 0:50 | SOW gen, AI vetting scores |
| PayPal Funding | 0:50 – 1:20 | Smart button → Capture ID |
| AI Verification | 1:20 – 1:50 | 4 adapters → score |
| Payout Auth | 1:50 – 2:20 | PolicyEngine + Payouts API |
| Earnings Ledger | 2:20 – 2:35 | Batch ID visible |
| AG Studio | 2:35 – 2:55 | AI Copilot query |
| Closing | 2:55 – 3:00 | Tagline |
