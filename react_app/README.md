# TrustBroker AI — Web App

React 19 & TypeScript frontend for **TrustBroker AI**: AI-drafted SOWs, milestone payments via PayPal Orders v2, automated multimodal verification, instant PayPal Payout releases, AG Studio operations intelligence, and dense AG Grid financial ledgers.

---

## Tech Stack

- **Framework:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI primitives, Lucide React
- **Operations & Grid:** AG Grid Community, AG Studio React
- **Payments:** `@paypal/react-paypal-js` (PayPal Orders v2 & Payouts integration)
- **State & Routing:** Zustand, React Router v6
- **Auth & Storage:** Supabase Auth, Supabase Storage
- **Feedback:** Sonner toast system

---

## Run Locally

```bash
cd react_app
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

---

## Key Pages & Route Architecture

| Route | Workspace / Persona | Description |
|---|---|---|
| `/` | Public | Landing page with platform overview and live demo credentials |
| `/how-it-works` | Public | 7-step interactive contract and settlement lifecycle |
| `/for-clients` | Public | Client product page: milestones, AI verification, PayPal safety |
| `/for-freelancers` | Public | Freelancer product page: guaranteed pay, AI vetting, instant payouts |
| `/app/client` | Client | Client Operations Dashboard & active agreement summary |
| `/app/client/contracts` | Client | AG Grid contract ledger with inline draft deletion and status filters |
| `/app/client/contracts/new` | Client | SOW creation wizard featuring **Web Development** & 20+ categories, AI drafting, and clarification steps |
| `/app/client/payouts` | Client | Client Payout Management ledger tracking sandbox balances and payouts |
| `/app/client/studio` | Client | AG Studio Operations Intelligence with telemetry charts and cross-filtering |
| `/app/freelancer` | Freelancer | Freelancer Operations Dashboard & active delivery tracking |
| `/app/freelancer/work` | Freelancer | Assigned contracts with Accept / Decline controls and delivery submission |
| `/app/freelancer/marketplace` | Freelancer | Open contract listings with skill search and AI match percentage |
| `/app/freelancer/applications` | Freelancer | Submitted applications, AI vetting breakdown, and **Withdraw** action |
| `/app/contracts/:id` | Universal | Full contract milestone timeline, mutual acceptance, PayPal Smart Buttons, and manual verification/disbursal |
| `/app/deliveries/:id/verify` | Universal | Multimodal delivery verification matrix (HTTP probe, Vision, Docs, Code) |
| `/app/notifications` | Universal | Notification center with per-item delete and "Clear Read" batch action |

---

## Interactive Features

- **Studio AI Copilot (`AICopilotFAB.tsx`):** Floating operations assistant with extended vertical viewport (`700px`), unconstrained flex scrolling, live telemetry querying, and 1-click suggested prompts.
- **Contract Creation Wizard (`CreateProject.tsx`):** Multi-step AI SOW generator supporting **Web Development**, Software Development, UI/UX, AI/ML, and 18+ industries with budget and deadline calculators.
- **Guarded Action Safeguards:** Delete and withdraw buttons are strictly enabled only when allowed by business policy (draft contracts, unstarted milestones, pending bids) to preserve records.
