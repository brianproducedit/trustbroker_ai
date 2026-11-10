# TrustBroker AI — Web App

React 19 & TypeScript frontend for **TrustBroker AI**: AI-drafted SOWs, milestone payments via PayPal Orders v2, automated multimodal verification, instant PayPal Payout releases, AG Studio operations intelligence and dense AG Grid financial ledgers.

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

## Prerequisites
- Node.js 20+ & npm

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
| `/app/client` | Client | Client Operations Dashboard & active agreement summary (`ROUTES.CLIENT_HOME`) |
| `/app/client/contracts` | Client | AG Grid contract ledger with inline draft deletion and status filters (`ROUTES.CLIENT_CONTRACTS`) |
| `/app/client/contracts/new` | Client | SOW creation wizard featuring **Web Development** & 20+ categories, AI drafting and clarification steps (`ROUTES.NEW_PROJECT`) |
| `/app/client/contracts/:id` | Client | Full contract milestone timeline, mutual acceptance, PayPal Smart Buttons and draft deletion (`ROUTES.CONTRACT_DETAIL`) |
| `/app/client/contracts/:id/applicants` | Client | Candidate ranking with AI vetting scores, portfolio samples and award actions (`ROUTES.CONTRACT_APPLICANTS`) |
| `/app/client/contracts/:id/review` | Client | **Client Delivery Review:** Read-only submission package, AI criterion evaluation report and settlement action panel (`ROUTES.CLIENT_REVIEW`) |
| `/app/client/payouts` | Client | Client Payout Management ledger tracking sandbox balances and payouts (`ROUTES.CLIENT_PAYOUTS`) |
| `/app/client/operations` | Client | Client Operations Studio with dense AG Grid ledgers and sync telemetry (`ROUTES.CLIENT_OPERATIONS`) |
| `/app/client/studio` | Client | AG Studio Operations Intelligence with telemetry charts and cross-filtering (`ROUTES.CLIENT_STUDIO`) |
| `/app/client/profile` | Client | Private client organization profile and contract management |
| `/app/client/profile/:clientId` | Universal | Public client profile with verified job history and hiring statistics (`ROUTES.CLIENT_PROFILE_PUBLIC`) |
| `/app/freelancer` | Freelancer | Freelancer Operations Dashboard & active delivery tracking (`ROUTES.FREELANCER_HOME`) |
| `/app/freelancer/contracts` | Freelancer | Open marketplace listings with skill search and AI match percentage (`ROUTES.MARKETPLACE`) |
| `/app/freelancer/contracts/:id` | Freelancer | Job listing detail with 1-click proposal submission (`ROUTES.LISTING_DETAIL`) |
| `/app/freelancer/applications` | Freelancer | Submitted applications, AI vetting breakdown and **Withdraw** action (`ROUTES.FREELANCER_APPLICATIONS`) |
| `/app/freelancer/work` | Freelancer | Active contracts with Accept / Decline controls and delivery navigation (`ROUTES.FREELANCER_WORK`) |
| `/app/freelancer/work/:id/deliver` | Freelancer | Evidence submission with drag-and-drop file upload and live AI multimodal check (`ROUTES.FREELANCER_DELIVER`) |
| `/app/freelancer/earnings` | Freelancer | Payout history, pending releases and PayPal Sandbox transaction ledgers (`ROUTES.FREELANCER_PAYOUTS`) |
| `/app/freelancer/operations` | Freelancer | Freelancer Operations Studio with AG Grid telemetry and live contract sync (`ROUTES.FREELANCER_OPERATIONS`) |
| `/app/freelancer/studio` | Freelancer | Freelancer AG Studio Analytics Studio (`ROUTES.FREELANCER_STUDIO`) |
| `/app/freelancer/profile` | Freelancer | Freelancer profile, portfolio and skills editor (`ROUTES.FREELANCER_PROFILE`) |
| `/app/activity/:id` | Universal | Cryptographic SHA-256 audit trail and immutable event ledger (`ROUTES.ACTIVITY_HISTORY`) |
| `/app/notifications` | Universal | Notification center with per-item delete and "Clear Read" batch action (`ROUTES.NOTIFICATIONS`) |
| `/dashboard/*` | Redirects | Automatic `<Navigate replace />` redirects for all historical dashboard routes to canonical portal paths |

---

## Interactive Features

- **Delivery Review & Settlement Ergonomics:** Balanced 3-column layout (`4 / 4 / 4` grid on `max-w-7xl`) separating the read-only Freelancer Package (Column 1), automated AI Evaluation (Column 2) and human Client Manual Review & Settlement (Column 3). Primary `Authorize PayPal Payout` disbursement button is paired with distinct secondary actions (`Request Revision`, `AI Dispute Mediation`, `Reclaim Staged Escrow`) with bottom clearance above floating elements.
- **Role-Aware Portal Navigation:** Distinct persona experiences with dedicated workspaces (`/app/client` vs `/app/freelancer`), role-aware breadcrumbs and 1-click workspace switching in the header and sidebar.
- **Studio AI Copilot (`AICopilotFAB.tsx`):** Floating operations assistant with extended vertical viewport (`700px`), unconstrained flex scrolling, live telemetry querying and 1-click suggested prompts.
- **Contract Creation Wizard (`CreateProject.tsx`):** Multi-step AI SOW generator supporting **Web Development**, Software Development, UI/UX, AI/ML and 18+ industries with budget and deadline calculators.
- **Guarded Action Safeguards:** Delete and withdraw buttons are strictly enabled only when allowed by business policy (draft contracts, unstarted milestones, pending bids) to preserve records.
- **Accurate Payout Status Representation:** Both Client Payouts and Freelancer Earnings ledgers provide granular badge mappings for all provider states (`Submitted`, `Release Authorized`, `Processing`, `Released / Paid`, `Returned`, `Unclaimed` and `Reconciliation Required`), strictly distinguishing submitted requests from provider-confirmed disbursements.
- **Resilient Verification Polling:** The verification store (`useContractStore.ts`) handles terminal background job states, cleanly terminating polling upon `interrupted`, `failed` or `needs_review` outcomes to prevent spinner hangs.
