# TrustBroker AI — Hackathon Execution Roadmap

**Purpose:** This is the implementation source of truth for finishing TrustBroker AI as a coherent product for the PayPal AI Hackathon (Devpost). It is written so a human or a low-level coding agent can execute one checkbox at a time without inventing a new product.

**Created:** 27 October 2026  
**Deadline:** Thursday 12 November 2026, 12:00 pm Pacific Time (confirm on [paypalaihackathon.devpost.com](https://paypalaihackathon.devpost.com/))  
**Judging:** 1–15 December 2026 · Winners around 21 December 2026  
**Official rules:** [paypalaihackathon.devpost.com/rules](https://paypalaihackathon.devpost.com/rules)  
**Related product guide:** `docs/TrustBroker_AI_Project_Guide.md` (this roadmap **supersedes** that guide wherever they conflict)

**How to use this file**

1. Work **one phase at a time**, top to bottom.
2. Check a box only when the **acceptance criteria** for that item are true in running code, not when the file exists.
3. Do not skip Phase 0 terminology. Do not claim PayPal escrow, Zimbabwe payouts, or live legal status.
4. If a stretch item would delay the core money loop, leave it unchecked and continue.
5. After each phase, run the **phase gate** checklist before starting the next phase.

---

## 0. Locked product decisions

These are locked unless the project owner explicitly changes them.

| Decision | Locked choice | Why |
|---|---|---|
| Language | **Client** and **Freelancer** everywhere. Never buyer/supplier in UI, copy, routes, or new code. | Owner instruction. |
| Dual capability | One signed-in user may operate **both workspaces**. Switching workspace does **not** impersonate another person. | Matches real freelance platforms and the original guide. |
| Sign-up | **Primary workspace is required** (Hire / Find work). User can still switch later. Role is never permanently locked. | Owner decision 27 Oct 2026. |
| Judge access | **Seeded client + freelancer (+ newcomer) accounts only.** No one-click demo login on landing or sign-in. | Owner decision: more production-like. |
| KERNEL / Bryntum | **Do not add.** Verification uses HTTP probe + user screenshots + vision/PDF adapters. No Gantt library. | Owner decision: smaller stack. |
| Gemini API | **Do not use.** Unreliable for this project. Groq + OpenRouter only. PDFs: extract text locally, then Groq JSON. Scanned PDFs: screenshots + Groq vision, else Needs review. | Owner decision 27 Oct 2026. |
| Hiring model | Client publishes an **open contract**. Freelancers **apply**. AI **vets**. Client **awards**. Then payment + delivery. | Owner instruction. Replaces invite-only Step 3 in Create Project. |
| Payment honesty | Product copy: **“PayPal-secured milestone payments.”** Never “licensed escrow,” never “sandbox demo” as a hero label. Judges get sandbox credentials in README only. | Hackathon uses PayPal sandbox; Design criterion wants a real product, not a labeled prototype. |
| Money control | AI never moves money. FastAPI **policy engine** + verified PayPal state do. | Original guide; also safer for judging. |
| Currency | USD only for the demo. No ZiG/ZAR settlement claims. | PayPal sandbox + country limits. |
| Cost | **$0 paid APIs.** Groq / OpenRouter free tiers, Supabase free, Render free, PayPal sandbox, AG Studio trial. | Owner constraint. |
| Prize stacking | Build to win **Grand Prize or Best Use of PayPal + AI**, and remain eligible for **one sponsor prize** (primary target: **AG Grid / AG Studio**). Use extra sponsors to raise Technological Implementation score even if only one sponsor prize can be won. | Official Rules §8: one Grand **or** one Honorable Mention, plus at most one Sponsor Prize. |

### 0.1 What this product is (pitch in one paragraph)

TrustBroker AI is the trust layer between **clients** and **freelancers**. A client describes work in plain language. AI drafts a milestone contract with testable acceptance criteria. The contract is published so freelancers can apply. AI ranks applicants using profile, portfolio, and past TrustBroker work (with a fair path for newcomers). The client awards the contract, funds the next milestone through PayPal, and the freelancer delivers. AI inspects the actual evidence (files, screenshots, live URLs, documents) against each criterion. When verification passes, the policy engine allows a PayPal disbursement to the freelancer. Every step is recorded.

### 0.2 What this product is not

- Not a licensed bank, escrow company, or legal arbitrator.
- Not Upwork clone with reviews, disputes courts, and global tax forms.
- Not an autonomous agent that pays people without a policy check.
- Not a shopping app (do **not** bolt on Channel3).

---

## 1. Hackathon scoring strategy (do not ignore)

Judges score five equal criteria. Every phase below maps to at least one.

| Criterion | How TrustBroker wins it |
|---|---|
| **Technological Implementation** | Real PayPal Orders + webhooks + Payouts; multimodal AI that inspects evidence; policy engine; AG Studio agent; not a mocked checkout. |
| **Design** | Distinct public site, client workspace, freelancer workspace; step-by-step flows; mobile; empty/error/success states. |
| **Potential Impact** | Cross-border digital work: client fears paying first, freelancer fears working unpaid. Show that exact loop. |
| **Innovation** | AI vetting of applicants **and** AI verification of *any* digital deliverable, with confidence and human review — not a chatbot wrapper. |
| **Presentation** | 3-minute video of one contract A→Z on a hosted URL. No slides-only. |

### 1.1 Prize targets (priority order)

1. **Grand Prize** ($12k / $8k / $5k) — complete product experience.
2. **Best Use of PayPal + AI** ($5k honorable mention) — checkout, capture, webhook, payout after AI pass.
3. **Best Use of AG Grid** ($5k / $2k / $1k) — AG Studio dashboard with custom theme, widgets, and a custom agent, **not** a plain table.
4. **Most Impactful** ($5k) — freelancer/client trust story.
5. **Best Demo Delivery** ($5k) — polished 3-minute video + hosted demo.
6. **Best Use of Render** (credits) — hosted frontend + API + a **Render Workflow** for verification jobs.
7. **APIMatic** — use Context Plugin while coding PayPal (eligibility + better PayPal code). Not a product feature.
8. **Skip as product features (owner lock):** KERNEL, Bryntum, Channel3, Zapier, Elastic unless marketplace search becomes painful. Postgres filters are enough.

### 1.2 Submission hard requirements (fail Stage One if missed)

- [ ] Public GitHub/GitLab/Bitbucket repo with **LICENSE** visible in About.
- [ ] Working hosted demo **or** complete local run instructions plus judge test accounts.
- [ ] YouTube demo **under 3 minutes**, public, no copyrighted music, shows the app running.
- [ ] Devpost text: what it does, which PayPal APIs, which AI tools, which sponsor tools.
- [ ] Meaningful PayPal sandbox integration (not a screenshot of PayPal’s site).
- [ ] Meaningful AI (not a static FAQ).
- [ ] English materials.

---

## 2. Current codebase vs target (gap analysis, Oct 2026)

Inspected as of this roadmap. Agents must treat this as the starting point.

### 2.1 What already exists (keep and upgrade)

| Area | Location | Status |
|---|---|---|
| React + Vite + Tailwind + shadcn | `react_app/` | Present |
| FastAPI + SQLModel + Alembic | `backend/` | Present |
| Supabase auth client | `react_app/src/lib/supabase.ts` | Present |
| Contract + milestone + criterion models | `backend/app/models/` | Present; no applications/profiles/portfolio |
| AI SOW draft + text verification | `backend/app/services/ai_provider.py` | Groq → OpenRouter → fallback. **Text/filenames only** — does not see images, PDFs, or live pages |
| Policy engine | `backend/app/services/policy_engine.py` | Present; extend for applications/payouts |
| PayPal order create + capture | `backend/app/utils/paypal_client.py`, `payment_service.py` | Present |
| Release payout | `payment_service.release_milestone_payout` | **DB status flip only** — does not call PayPal Payouts |
| Webhook handler | `payments.py` `/webhook` | Present; complete event coverage |
| AG Grid Community on dashboard | `react_app/src/pages/Dashboard.tsx` | Table only — **not AG Studio** |
| Create-project wizard | `CreateProject.tsx` | 4 steps but Step 3 still **assigns a named freelancer** |
| Role toggle | `Sidebar.tsx` | Impersonates **Elena Rostova / Tariro Moyo** — must die |
| Public pages | `Landing.tsx`, `HowItWorks.tsx`, `ForBuyers.tsx`, `ForSuppliers.tsx` | Basic, light grey, hackathon ribbon, no visual craft |
| Buyer/supplier leftovers | Many files (see §3) | Partial rename only |

### 2.2 What is missing (must build)

- Open contract marketplace and applications.
- Freelancer profile, portfolio, skills, completeness score.
- AI applicant vetting with newcomer handling.
- In-app notifications for award/reject/fund/verify/payout.
- Step-by-step client publish flow that does not dump every field on one screen.
- Distinct client vs freelancer information architecture (not a color tint on the same page).
- Multimodal verification adapters (screenshot, file, PDF, live URL).
- Real PayPal Payouts after policy pass.
- Public marketing design (imagery, backgrounds, motion, social proof of the *product*, not of the hackathon).
- Mobile navigation (sidebar is `fixed w-64` and will fail phones).
- AG Studio operations dashboard.
- Judge seed accounts and a scripted happy path.

---

## 3. Terminology and copy rules (mandatory, Phase 0)

### 3.1 Dictionary

| Forbidden in UI and new code | Required |
|---|---|
| buyer | client |
| supplier | freelancer |
| Buyer Mode / Supplier Mode | Client workspace / Freelancer workspace |
| escrow (as legal claim) | staged PayPal payment / milestone-secured payment |
| sandbox (hero, badges, CTAs) | omit. Judges: README “PayPal Sandbox environment” |
| Elena Rostova / Tariro Moyo as the signed-in user | the real `profile.full_name` |
| I am Hiring (Client Demo) | Hire with TrustBroker / Post a contract |
| I am a Freelancer (Demo) | Find work / Join as freelancer |

Internal DB comments and logs may say “PayPal sandbox” for operators. Users must not.

### 3.2 Files that still say buyer/supplier (rename these)

- [ ] `react_app/src/pages/ForBuyers.tsx` → `ForClients.tsx` (export `ForClients`)
- [ ] `react_app/src/pages/ForSuppliers.tsx` → `ForFreelancers.tsx` (export `ForFreelancers`)
- [ ] `react_app/src/pages/dashboard/SupplierPayouts.tsx` → `FreelancerPayouts.tsx`
- [ ] `react_app/src/constants/index.ts`: `SUPPLIER_PAYOUTS` → `FREELANCER_PAYOUTS`; remove `FOR_BUYERS` / `FOR_SUPPLIERS` aliases after redirect period
- [ ] `react_app/src/app/routes.tsx` imports and `/dashboard/payouts` title
- [ ] Backend summaries in `payments.py`, `payment_service.py` (“supplier” in docstrings)
- [ ] `react_app/README.md`, `backend/README.md`, landing/how-it-works copy
- [ ] Fallback fields `(contract as any).buyer` / `.supplier` — migrate types in `react_app/src/types/contract.ts` then delete fallbacks
- [ ] CreateProject variables `supplierName`, `supplierEmail`, `supplierOrg` — delete when Step 3 becomes “Publish open contract”

**Acceptance:** `rg -i "buyer|supplier" --glob '!docs/TrustBroker_AI_Project_Guide.md' --glob '!docs/TrustBroker_AI_Hackathon_Roadmap.md'` returns no user-facing hits.

---

## 4. A-to-Z product workflow (implement exactly this)

Keep each screen to **one job**. Never put brief + milestones + freelancer picker + PayPal on one page.

### 4.1 Client journey

1. Land on public site → **Hire talent**.
2. Sign up / sign in. Sign-up **requires** choosing primary workspace = **Client** (Hire). User may switch to freelancer workspace later.
3. **Create contract wizard** (one step visible at a time):
   - Step 1 — Category + budget + deadline + plain-language brief.
   - Step 2 — AI asks 3–6 clarification questions (chat). Client answers. Skip allowed after first draft.
   - Step 3 — Review/edit SOW: title, scope, exclusions, milestones, amounts (must sum to budget), criteria, evidence types.
   - Step 4 — Preview as a freelancer would see it.
   - Step 5 — Publish as **Open contract** (or save draft).
4. **Open contract** appears in freelancer marketplace.
5. Client **Applicants** page: ranked list + AI vet report per applicant. Client can shortlist, reject, or award **one** freelancer.
6. Award sends notification. Contract status → `awarded` then `pending_acceptance`.
7. Freelancer accepts the same contract version. Status → `accepted`.
8. Client **funds the next unfunded milestone** via PayPal Buttons. Backend creates order, capture is verified server-side and by webhook. Status of milestone payment → `funded`.
9. Freelancer does the work and submits evidence for that milestone.
10. AI verification runs. Client sees criterion table: Pass / Fail / Needs review + confidence + evidence citations.
11. If Pass and policy allows: client confirms release (one click). Backend calls **PayPal Payouts** to freelancer PayPal email. UI shows PayPal payout id and status (`SUCCESS` / `UNCLAIMED` / `FAILED`), never a fake receipt.
12. Repeat 8–11 per milestone. Last milestone settled → contract `completed`. Both leave a short review (optional stretch).

### 4.2 Freelancer journey

1. Land → **Find work**.
2. Sign up / sign in. Complete **profile** (skills, bio, portfolio links, sample images, PayPal email for payouts). Completeness meter 0–100.
3. **Open contracts** board (filters: category, budget, skills). Mobile = cards. Desktop = AG Grid.
4. Open a listing → read SOW → **Apply** with cover note + optional relevant portfolio items. Cannot apply twice.
5. Track applications: Pending / Shortlisted / Awarded / Not selected.
6. If awarded: review terms → **Accept** (or decline).
7. Wait until the current milestone is **funded** before submit is enabled (policy).
8. **Submit delivery** wizard: pick milestone → attach evidence matching each criterion type → submit.
9. Watch verification live: verifying → report. If Fail: revision notes. If Needs review: client decision.
10. **Earnings**: list of payouts with PayPal ids and amounts.

### 4.3 Dual-role journey

- Header/sidebar control: **Workspace: Client | Freelancer**.
- Same person, same email, different home, nav, empty states, and accent (blue vs emerald).
- Never swap display name to a demo character.

### 4.4 Extra workflows to add (after core loop)

| Workflow | Why | Priority |
|---|---|---|
| Notifications inbox | Award/reject/fund/verify/payout without email SMTP | Must |
| Revision loop | Fail → freelancer resubmits → new report | Must |
| Client override | Needs review → client Pass/Fail with reason | Must |
| Profile completeness + “New talent” badge | Fair vetting | Must |
| Optional paid trial milestone ($50–150) | Reduce newcomer risk | Should |
| Contract versioning after award | Scope change requires re-accept | Should |
| CSS milestone timeline | Fund / verify / pay markers without Bryntum | Should |
| Reviews after complete | Trust graph for next vetting | Stretch |
| Message thread per contract | Reduce off-platform chat | Stretch |
| Dispute flag | Human review queue | Stretch |

### 4.5 Status vocabulary (use these strings in UI and DB)

**Contract:** `draft` → `open` → `awarded` → `pending_acceptance` → `accepted` → `active` → `in_verification` → `completed` | `cancelled`

**Application:** `submitted` → `vetting` → `ranked` → `shortlisted` | `rejected` | `awarded` | `withdrawn`

**Milestone:** `not_started` → `awaiting_funding` → `funded` → `in_progress` → `submitted` → `verifying` → `verified` | `failed` | `needs_review` | `revision_requested` → `release_authorized` → `settled`

**Payment (milestone):** `unfunded` → `checkout_created` → `funded` (PayPal capture verified) → `payout_pending` → `paid` | `payout_unclaimed` | `payout_failed`

**Criterion result:** `pass` | `fail` | `needs_review` (never color-only)

---

## 5. Information architecture and routes

Replace the current “one dashboard, toggle role, jump to contract-1” pattern.

### 5.1 Public (light marketing shell)

| Route | Page job |
|---|---|
| `/` | Story, proof, two CTAs: Hire / Find work |
| `/how-it-works` | 7-step visual: brief → publish → apply → vet → award → fund → verify → pay |
| `/for-clients` | Client outcomes, not a second homepage |
| `/for-freelancers` | Freelancer outcomes |
| `/developers` | OpenAPI + Postman |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email` | Auth. Sign-up asks **primary workspace** only, not a permanent lock. |

### 5.2 Client workspace (`/app/client/...`)

Keep old `/dashboard/*` as redirects.

| Route | Job |
|---|---|
| `/app/client` | Home: needs-action queue, funds at risk, open listings |
| `/app/client/contracts/new` | Wizard |
| `/app/client/contracts` | My contracts (AG Grid desktop / cards mobile) |
| `/app/client/contracts/:id` | Contract hub with **tabs**, not one infinite page: Overview, Applicants, Milestones, Payments, Activity |
| `/app/client/contracts/:id/applicants` | Vetting results |
| `/app/client/operations` | AG Studio: payments, verification scores, funnel |
| `/app/client/notifications` | Inbox |
| `/app/settings` | Profile, PayPal email, security |

### 5.3 Freelancer workspace (`/app/freelancer/...`)

| Route | Job |
|---|---|
| `/app/freelancer` | Home: recommended open contracts, application statuses |
| `/app/freelancer/contracts` | Open marketplace |
| `/app/freelancer/applications` | My applications |
| `/app/freelancer/work` | Awarded/active work |
| `/app/freelancer/work/:id/deliver` | Submit + verification |
| `/app/freelancer/earnings` | Payouts |
| `/app/freelancer/profile` | Portfolio editor |
| `/app/freelancer/operations` | AG Studio: earnings, win rate, upcoming deadlines |
| `/app/freelancer/notifications` | Inbox |

### 5.4 Navigation rules

- [x] Desktop: left sidebar, workspace-specific, real user name.
- [x] Mobile `<768px`: **bottom tab bar** (3–5 items) + hamburger for the rest. **Never** a 256px fixed sidebar covering the screen.
- [x] AG Grid hidden below `md`; use cards with the same data.
- [x] Deep links to a contract the user is not a party to → 404, not another user’s data.

---

## 6. Data model to add

Create Alembic migrations. Do not hand-edit production tables.

### 6.1 `profiles` extensions

Add columns (keep `id` = Supabase auth uid):

- `headline`, `bio`, `primary_workspace` (`client` | `freelancer`)
- `skills` JSON list of strings
- `portfolio` JSON list `{title, url, image_path, kind}`
- `paypal_payout_email`
- `timezone`, `country_code` (display only)
- `completed_contracts_count`, `avg_client_rating` (maintain in service layer)
- `profile_completeness` 0–100 (computed)

### 6.2 New tables

**`contract_listings`** (or fields on `contracts`): `visibility` = `private_draft` | `open` | `closed`; `opens_at`, `closes_at`; `required_skills` JSON.

**`applications`**

- `id`, `contract_id`, `freelancer_id`, `cover_letter`, `portfolio_snapshot` JSON
- `status` (see §4.5)
- `ai_report_id` nullable
- unique (`contract_id`, `freelancer_id`)

**`vetting_reports`**

- `application_id`
- `overall_score` 0–100
- `confidence` 0–1
- `recommendation` `strong_fit` | `possible_fit` | `weak_fit` | `insufficient_evidence`
- `newcomer` boolean
- `dimension_scores` JSON: `skills_match`, `portfolio_relevance`, `past_delivery`, `communication`, `risk`
- `rationale` text (short, human readable)
- `model_used`

**`notifications`**

- `user_id`, `type`, `title`, `body`, `link`, `read_at`, `created_at`

**`payouts`**

- `milestone_id`, `paypal_payout_batch_id`, `paypal_payout_item_id`
- `receiver_email`, `amount`, `currency`, `status`, `raw_response` JSON

Keep existing: contracts, versions, acceptances, milestones, criteria, deliveries, delivery_files, verification_reports, criterion_results, payment_attempts, provider_events, audit_events.

### 6.3 RLS and authz

- [ ] Supabase RLS: a user reads own profile; listings `open` are readable by any authenticated freelancer; applications readable by applicant + contract client; files private via signed URLs.
- [ ] FastAPI still checks membership for mutations.
- [ ] Open listing GET may be authenticated-only for the hackathon (simpler) — public unauthenticated browse is stretch.

---

## 7. AI architecture (maximize prowess on free tiers)

### 7.1 Provider stack (cost $0)

| Job | Primary | Fallback | Do not |
|---|---|---|---|
| SOW draft + clarifying questions | Groq JSON (`openai/gpt-oss-120b` then current Groq list) | OpenRouter `:free` models | Send API keys to the browser |
| Applicant vetting | Groq JSON | OpenRouter | Invent completed-job history |
| Text/code/README criteria | Groq JSON | OpenRouter | Treat filename as proof |
| Screenshots / design images | Groq vision `qwen/qwen3.8-27b` (≤3 images, URL or signed URL) | OpenRouter `:free` vision if available; else Needs review | Claim pixel-perfect brand taste as Pass |
| PDF / docs / large files | Local text extract (`pypdf` or equivalent) → Groq JSON | If extract is empty: ask for page screenshots (Groq vision, ≤3) or Needs review | Gemini API (out of scope); upload secrets to public buckets |
| Live URL / deployed site | `httpx` GET: status, title, reachable, TLS; freelancer also uploads a screenshot of the live page | Vision model on that screenshot | KERNEL browser (explicitly out of scope); do not run uploaded zip as code in FastAPI |
| Dashboard NL | AG Studio Agent Framework adapter → same Groq key **proxied by FastAPI** | disable agent | Put Groq key in the React bundle |

If all LLMs fail, keep the existing **deterministic fallback** so the demo never hard-crashes. Label the UI “Rule-based draft — AI temporarily unavailable”.

### 7.2 Verification engine (selling point) — design then implement in Phase 5

Create `backend/app/services/verification/`:

1. `orchestrator.py` — load contract version + criteria + files; dispatch per `evidence_type`; merge; write report.
2. `adapters/http_probe.py` — live URL: status, title, reachable, TLS.
3. `adapters/vision.py` — Groq vision on screenshot/design files (including a required screenshot of any live URL).
4. `adapters/document.py` — extract PDF/DOCX text locally, then Groq JSON. Never call Gemini.
5. `adapters/repo_meta.py` — if GitHub/GitLab URL: fetch public README and file tree via GitHub API (unauthenticated rate limit; cache). Do **not** clone arbitrary zips into the web process.
6. `adapters/zip_listing.py` — list zip members + sizes only; never execute.
7. `scoring.py` — map adapter facts + LLM judge into `pass` / `fail` / `needs_review`.
8. `safety.py` — size/type allowlists; max files; virus: rely on type/size only at $0 (document this).

Do **not** add `kernel_browse.py` or any KERNEL SDK.

**Criterion evidence types** (AI SOW must emit these):

`screenshot` | `live_url` | `source_archive` | `document` | `design_file` | `video_link` | `text_attestation`

**Judging rules the model must follow (put in system prompt AND in `scoring.py`):**

- Pass: evidence directly supports the criterion.
- Fail: required evidence missing, URL down, criterion explicitly unmet.
- Needs review: taste, copywriting quality, “professional look”, inaccessible URL, video too long, new file type.
- Overall Pass only if **every** required criterion is Pass **and** no adapter hard-failed.
- Subjective criteria default to Needs review unless the client marked them `auto_pass_allowed`.
- Always store `model_used`, adapter names, and a short citation (filename, URL, screenshot crop note).

**Newcomer / sparse-history vetting rules:**

- Do not punish `completed_contracts_count = 0`.
- Raise `portfolio_relevance` and `skills_match` weight; set `past_delivery` to `insufficient_evidence` not 0.
- If completeness < 40, recommendation = `insufficient_evidence` (ask them to finish profile).
- If portfolio is strong, label **New talent · high portfolio match** so clients can award a small first milestone.
- Never fabricate employers or GitHub stars.

### 7.3 Render Workflows (sponsor + UX)

- [ ] Offload `verify-delivery` and `vet-application` to a Render Workflow or background worker so the HTTP request does not time out on free web service spin. If Workflows exceed free credits, use FastAPI `BackgroundTasks` + polling the report row. Document which was used.

---

## 8. PayPal sandbox — working product, honest internals

### 8.1 What we can actually do at $0 without Partner approval

Confirmed from PayPal docs:

- **Orders v2** create + capture in sandbox (already started).
- **Webhooks** for capture/order events.
- **Payouts API** `/v1/payments/payouts` from the sandbox business balance to a sandbox personal email.
- **Auth & capture** (hold then capture) is useful but 29-day hold; optional.
- **Delayed disbursement / Marketplace platform** requires **approved partner** + seller onboarding. **Do not promise this.** Do not build partner onboarding in the remaining days unless the owner already has partner app credentials.

### 8.2 Money loop to implement (this is the demo)

```
Client PayPal (sandbox personal)
        --Orders capture-->  Platform PayPal (sandbox business)
                                    --Payouts API-->  Freelancer PayPal (sandbox personal)
```

Product language: “Client funds the milestone. TrustBroker releases the PayPal payout when the milestone is verified.”

### 8.3 Implementation checklist

- [ ] Create **three** PayPal sandbox accounts: Client buyer, Platform business (REST app), Freelancer receiver. Put emails in `docs/JUDGE_DEMO.md` only.
- [ ] Enable **Payouts** on the REST app.
- [ ] Fund the business sandbox account so payouts do not fail (PayPal developer dashboard).
- [ ] Store freelancer `paypal_payout_email` on profile; validate it is present before Award.
- [ ] `create_milestone_escrow_order` stays, but rename user-facing strings from “escrow” to “fund milestone”.
- [ ] Capture still sets `funded` only after PayPal `COMPLETED` (API or webhook). Cancelled checkout ≠ funded.
- [ ] Replace `release_milestone_payout` DB-only update with:
  1. PolicyEngine: client + milestone `verified` + payment `funded` + freelancer email present + not already paid.
  2. `POST /v1/payments/payouts` with `PayPal-Request-Id` = `payout:{milestone_id}`.
  3. Persist batch/item ids.
  4. Webhook `PAYMENT.PAYOUTSBATCH.*` / item events update `payouts.status`.
  5. UI: Paid / Unclaimed / Failed with the PayPal id.
- [ ] Idempotency: `provider_events.event_id` unique; payout request-id unique.
- [ ] Never show “Released to Zimbabwe bank rails”. Current `FreelancerPayouts.tsx` claims this — **delete that sentence**.
- [ ] Exception paths in the demo video: cancel checkout; payout `UNCLAIMED`.

### 8.4 PayPal surfaces that must be visible to judges

- PayPal Buttons on **Fund milestone**.
- PayPal order id on the Payments tab.
- PayPal payout id on Earnings.
- Activity log lines: `payment_capture_completed`, `payout_batch_created`, `payout_item_succeeded`.

Use [APIMatic PayPal Context Plugin](https://paypalaihackathon.devpost.com/details/apimatic) while coding these endpoints.

---

## 9. Design system (public vs two workspaces)

### 9.1 Visual direction

Aim: **Stripe Atlas × Linear × Mercury** — calm fintech, not a crypto dashboard and not a generic Tailwind template.

- Public: off-white `#F7F5F2` or cool white, deep navy `#0B1B33`, electric blue `#1D4ED8`, gold accent used once in the hero.
- Client workspace: navy shell `#0B1326`, blue actions, “control and capital” metaphor.
- Freelancer workspace: ink `#0C1916` / emerald actions, “work and earnings” metaphor.
- Shared type: keep Lexend or switch both public+app to **Geist / Inter** + `IBM Plex Mono` for money and ids. Pick one pair and use it everywhere.
- Background craft (public): CSS grid mesh + soft radial gradients + one restrained illustration (contract → shield → PayPal mark as abstract geometry). Prefer CSS/SVG over heavy stock photos. Unsplash only if licensed and compressed.
- Status: color + label + icon.
- Motion: 150–200ms fades; no looping hackathon pulse dots on production CTAs.

### 9.2 Component rules

- One `PageHeader` (title, short description, primary action).
- One `Stepper` for wizards (progress, back, next, save draft).
- One `StatusChip`.
- One `EmptyState`.
- One `Money` formatter (USD).
- Dialogs for Award, Fund, Release, Reject.
- Toasts for non-destructive success; dialogs for money.

### 9.3 Public pages content

Hero should sell the **loop**, not the hackathon:

> “Describe the work. Hire with evidence. Pay when the milestone checks out.”

Remove the dark “PayPal AI Hackathon 2026” ribbon from the hero. A small footer line “Built for the PayPal developer platform” is enough.

How it works must match §4 (publish → apply → vet → award → fund → verify → pay), not the old invite-only copy.

### 9.4 Mobile

Breakpoints: `sm` 640, `md` 768, `lg` 1024.

- [ ] All wizards are single-column on mobile.
- [ ] PayPal Buttons remain tappable (min 44px).
- [ ] Tables → cards.
- [ ] No horizontal overflow on `/`, `/how-it-works`, client wizard, freelancer listing, delivery submit.
- [ ] Test 375×812 and 1440×900 before calling a UI phase done.

---

## 10. AG Grid / AG Studio (sponsor prize — required depth)

Community `AgGridReact` on the dashboard is **not enough** for Best Use of AG Grid 2026. Sponsor brief: polish, custom widgets, theming, **Studio Agent Framework**.

Docs: [AG Studio React overview](https://www.ag-grid.com/studio/react/overview/), [Agent quick start](https://www.ag-grid.com/studio/react/ai-quickstart/), [Installation](https://www.ag-grid.com/studio/react/installation/).

- [ ] `npm install ag-studio-react` (match ag-grid / ag-charts versions).
- [ ] Request/use trial license if watermark blocks demo; local trial is allowed.
- [ ] Client Operations: widgets for open contracts, funds staged, payouts released, verification pass rate, applicant funnel.
- [ ] Freelancer Operations: applications, win rate, upcoming milestones, earnings by month.
- [ ] Theme tokens match workspace colors.
- [ ] Custom prompt starters: “Show unpaid funded milestones”, “Which applicants are new talent with strong portfolios?”, “Chart verification scores this week”.
- [ ] Custom adapter: browser → `POST /api/v1/ai/studio-turn` → Groq. **No API key in frontend.**
- [ ] Keep AG Grid Community for dense ledgers (contracts, applications, payouts) with filters, sort, status chips, row click → detail.

If AG Studio bundle size is too heavy for Render static: lazy-load the Operations route.

---

## 11. Bryntum and KERNEL — out of scope

Owner lock 27 Oct 2026: **do not install Bryntum or KERNEL.** Milestone schedule is a simple vertical timeline in the contract hub (HTML/CSS). Live URLs are verified with HTTP probe + required screenshot + vision.

---

## 12. Demo, seed data, and $0 ops

### 12.1 Judge accounts (document in `docs/JUDGE_DEMO.md`)

Create real Supabase users (not sidebar cosplay):

| Email | Workspace | Purpose |
|---|---|---|
| `client.demo@trustbroker.ai` | Client | Publish, award, fund, release |
| `freelancer.demo@trustbroker.ai` | Freelancer | Apply, deliver, receive payout |
| `newcomer.demo@trustbroker.ai` | Freelancer | Empty history, strong portfolio — shows fair vetting |

Password in JUDGE_DEMO only. Seed:

- 3 open contracts (React landing page, logo pack, SEO audit) so marketplace is not empty.
- 1 in-progress funded milestone ready to deliver.
- Sample screenshot + live URL that **will pass**, and one broken URL that **fails**.

### 12.2 Render / Supabase free-tier survival

- [ ] Render web service + static site. Expect spin-down: add a visible “Waking API…” state on first request.
- [ ] Do not add paid Render instances.
- [ ] Supabase free: private buckets, signed URLs 60s, file size cap (e.g. 10 MB).
- [ ] Groq 429: backoff already exists; surface a toast, then fallback.
- [ ] Do not add KERNEL or Bryntum.

---

## 13. Phases and checkboxes

Dates are Zimbabwe/calendar planning from **27 Oct 2026**. Slip only into the next phase’s stretch, never past the money loop.

Legend: **P0** must ship · **P1** should ship · **P2** stretch.

---

### Phase 0 — Freeze language, routes, and demo honesty

**Dates:** 27 Oct  
**Goal:** Every later phase speaks Client/Freelancer and does not impersonate users.  
**Owner files:** constants, sidebar, landing, READMEs.

- [x] **P0** Replace all user-facing buyer/supplier strings (§3).
- [x] **P0** Rename files `ForBuyers` / `ForSuppliers` / `SupplierPayouts`.
- [x] **P0** Sidebar shows `profile.full_name` and `profile.organization` from auth store, not Elena/Tariro.
- [x] **P0** Role control becomes **Switch workspace**, not Switch person. Toast: “Switched to freelancer workspace”.
- [x] **P0** Remove hackathon hero ribbon; move sandbox explanation to README/JUDGE_DEMO.
- [x] **P0** Delete payout copy about African bank rails and “Verified Sandbox Environment” marketing chips.
- [x] **P0** Update `HowItWorks` steps to publish → apply → vet → award → fund → verify → pay.
- [x] **P0** Add this roadmap link at the top of the root README.
- [x] **P0** Sign-up requires choosing primary workspace (Hire / Find work). No one-click demo login. Seeded judge accounts only.

**Phase 0 gate**

- [x] Fresh visitor sees Client/Freelancer language only.
- [x] Signed-in user sees their name.
- [x] `rg` check in §3.2 is clean for UI files.

---

### Phase 1 — Schema, APIs, and policy for the marketplace

**Dates:** 28–29 Oct  
**Goal:** Backend can represent open contracts, applications, vetting reports, notifications, payouts.

- [x] **P0** Alembic migration: profile columns, `applications`, `vetting_reports`, `notifications`, `payouts`; contract `visibility`/`status` includes `open`/`awarded`.
- [x] **P0** SQLModel models + Pydantic schemas.
- [x] **P0** `GET /api/v1/listings` authenticated freelancer list (filters: category, min/max budget, skill).
- [x] **P0** `POST /api/v1/contracts` still creates draft as client.
- [x] **P0** `POST /api/v1/contracts/{id}/publish` sets `open` if SOW complete (title, ≥1 milestone, amounts sum, ≥1 criterion each).
- [x] **P0** `POST /api/v1/contracts/{id}/applications` freelancer apply.
- [x] **P0** `GET /api/v1/contracts/{id}/applications` client only.
- [x] **P0** `POST /api/v1/applications/{id}/award` client awards one; others → `rejected`; notifications written.
- [x] **P0** `POST /api/v1/contracts/{id}/accept` freelancer accepts awarded version.
- [x] **P0** Notification list + mark read endpoints.
- [x] **P0** PolicyEngine methods: `can_publish`, `can_apply`, `can_award`, `can_fund`, `can_submit_delivery`, `can_release_payout`.
- [x] **P0** OpenAPI descriptions use client/freelancer.
- [x] **P1** Profile GET/PUT including PayPal payout email.
- [ ] **P2** Unauthenticated public listings.

**Phase 1 gate**

- [x] Can create draft, publish, apply, award, accept via `/docs` with two users.
- [x] Second apply by same freelancer returns 409.
- [x] Non-client cannot award.

---

### Phase 2 — Client contract wizard (step-by-step, no confusion)

**Dates:** 29–30 Oct  
**Goal:** Creating a contract feels like a guided product, not a form dump.

Rewrite `CreateProject.tsx` (or replace with `pages/client/NewContractWizard.tsx`).

- [x] **P0** Stepper with 5 steps in §4.1. Only current step’s fields enabled.
- [x] **P0** Step 1: category chips (Software, Design, Marketing, Research), budget, target date, brief textarea.
- [x] **P0** Step 2: call `POST /ai/draft-sow` then optional `/ai/clarify` (new endpoint returning questions). Show questions as a short chat. “Generate anyway” escape.
- [x] **P0** Step 3: editable milestones; live sum vs budget (block Next if mismatch); each criterion has evidence type select.
- [x] **P0** Step 4: read-only freelancer preview.
- [x] **P0** Step 5: Publish open contract **or** Save draft. **No freelancer name/email fields.**
- [x] **P0** Loading, error, and empty-AI-fallback states.
- [x] **P0** After publish, go to contract **Applicants** tab with empty state “Waiting for applications”.
- [x] **P1** Save draft and resume wizard at last step.

**Phase 2 gate**

- [x] A new user can publish without seeing payout or delivery screens.
- [x] Published listing appears in `GET /listings`.

---

### Phase 3 — Freelancer marketplace, profile, apply, AI vetting

**Dates:** 30 Oct – 1 Nov  
**Goal:** The two workspaces finally do different jobs.

- [x] **P0** Freelancer profile editor with completeness meter.
- [x] **P0** Marketplace page: desktop AG Grid, mobile cards.
- [x] **P0** Listing detail (SOW, budget, milestones, apply CTA).
- [x] **P0** Apply modal: cover letter + select portfolio items.
- [x] **P0** `POST /ai/vet-application` writes `vetting_reports` using profile + portfolio + cover + past counts. Implement newcomer rules in §7.2.
- [x] **P0** Client Applicants tab: sorted by score; badges New talent / Strong fit / Needs profile; expand rationale.
- [x] **P0** Award dialog (irreversible confirm) + reject others with notification.
- [x] **P0** Freelancer Applications page statuses.
- [x] **P1** Shortlist without awarding.
- [ ] **P2** Trial milestone suggestion for newcomers.

**Phase 3 gate**

- [ ] Two freelancer accounts apply to one listing.
- [x] Client sees two distinct AI reports; newcomer is not scored 0.
- [x] Awarded freelancer is notified; rejected freelancer is notified.
- [x] Client home and freelancer home are different layouts and copy.

---

### Phase 4 — PayPal fund and real payout

**Dates:** 1–3 Nov  
**Goal:** Judges can watch money move in sandbox and still feel a finished product.

- [x] **P0** Fund CTA only on next unfunded milestone after `accepted`.
- [x] **P0** PayPal JS SDK buttons; order created on server; capture verified on server.
- [x] **P0** Webhook path verified with a sandbox event (or documented ngrok/Render URL).
- [x] **P0** Implement Payouts API in `paypal_client.py` + replace DB-only release.
- [x] **P0** Payments tab: order id, capture id, payout id, statuses.
- [x] **P0** Freelancer earnings table from `payouts` rows.
- [x] **P0** Failed/cancelled checkout never shows Funded.
- [x] **P0** Duplicate release does not double-pay (`PayPal-Request-Id`).
- [ ] **P1** Auth-capture optional: authorize at fund, capture at release — only if Payouts path already works.
- [ ] **P2** Partner delayed disbursement — skip unless credentials exist.

**Phase 4 gate**

- [x] Sandbox business account shows a capture and a payout for one milestone.
- [x] UI ids match PayPal dashboard.
- [x] README and `docs/JUDGE_DEMO.md` list the three sandbox accounts and the exact click path.

---

### Phase 5 — Multimodal milestone verification

**Dates:** 3–5 Nov  
**Goal:** Verification is obviously AI inspecting the work, not scoring a filename list.

- [x] **P0** Delivery submit wizard: one criterion per block with the correct uploader (image, URL, file, text).
- [x] **P0** Split verification service into adapters (§7.2).
- [x] **P0** Screenshots go through vision model; report cites what is in the image.
- [x] **P0** Live URL: HTTP probe **and** a required screenshot of the page (vision). No KERNEL.
- [x] **P0** Persist report + per-criterion pass/fail/needs_review + confidence.
- [x] **P0** Client verification view: criterion table, evidence thumbnails, “Release payment” enabled only if policy true.
- [x] **P0** Fail → revision_requested with comments; freelancer resubmits new delivery version.
- [x] **P0** Needs review → client override with required reason; audit event `human_review`.
- [x] **P1** GitHub README/tree meta adapter.
- [x] **P1** PDF via local text extract + Groq. Empty extract → screenshots or Needs review. No Gemini.
- [x] **P1** Render Workflow or BackgroundTasks + job polling UI.
- [ ] **P2** Video: store link + Needs review by default.

**Phase 5 gate**

- [x] Happy path: live React page URL + screenshot → Pass → payout enabled.
- [x] Sad path: 404 URL → Fail → revision, no payout button.
- [x] Ambiguous design taste criterion → Needs review, not auto-pay.

---

### Phase 6 — Public UI, workspace distinction, mobile

**Dates:** 5–7 Nov  
**Goal:** Design criterion: a complete product, not a CRUD demo.

- [x] **P0** New public landing: hero, 7-step strip, two persona panels, FAQ, footer. CSS/SVG backgrounds. No stock clutter.
- [x] **P0** For Clients / For Freelancers pages with different screenshots (client applicants vs freelancer jobs).
- [x] **P0** Client chrome vs freelancer chrome (nav, empty states, home widgets) as §5.
- [x] **P0** Bottom nav on mobile; sidebar only `md+`.
- [x] **P0** Auth screens redesigned to match public site (no dark dashboard login unless inside app).
- [x] **P0** Empty/loading/error/403 states on every new route.
- [x] **P0** Manual pass at 375 and 1440 on: landing, wizard, marketplace, applicants, delivery, payments.
- [x] **P1** Subtle motion on hero and stepper.
- [ ] **P2** Dark/light toggle on public site.

**Phase 6 gate**

- [x] Someone who is not the author can complete client or freelancer paths without asking which button is real.
- [x] No horizontal scroll on mobile for those routes.

---

### Phase 7 — AG Studio and operations

**Dates:** 7–8 Nov  
**Goal:** Sponsor tools are load-bearing, not logos.

- [x] **P0** AG Studio on `/app/client/operations` and `/app/freelancer/operations` with themed widgets and live API data.
- [x] **P0** Studio agent adapter via backend proxy + 3 prompt starters each.
- [x] **P0** AG Grid ledgers keep custom cell renderers (money, status, counterparty).
- [x] **P1** Simple CSS milestone timeline on the contract hub (funded / verified / paid markers). Not Bryntum.

**Phase 7 gate**

- [x] Judge can type a natural-language question and see a widget change.
- [x] Operations data matches the same contracts as the ledger (no mock-only studio dataset).

---

### Phase 8 — Notifications, activity, seed, polish

**Dates:** 8–9 Nov

- [x] **P0** In-app notification bell + page.
- [x] **P0** Activity history uses client/freelancer wording and includes apply/award/fund/verify/payout.
- [x] **P0** Seed script: 3 listings, 3 demo users, 1 mid-flight contract, pass and fail evidence files in repo `demo_assets/`.
- [x] **P0** `docs/JUDGE_DEMO.md` click-by-click (10 minutes).
- [x] **P1** Settings: change password, payout email, workspace default.
- [ ] **P2** Post-contract review scores fed back into vetting.

**Phase 8 gate**

- [x] Clean browser, demo client + demo freelancer, full loop without SQL edits.

---

### Phase 9 — Public GitHub README (repo landing page)

**Dates:** 9 Nov  
**Goal:** The GitHub repository page is the first thing judges open. The root `README.md` must look complete, scannable, and production-like when viewed on github.com (title, badges, screenshots, run instructions). This is a dedicated phase — not a leftover bullet.

Write **`README.md` at the repository root** (not only `react_app/README.md` or `backend/README.md`). GitHub renders only the root README on the repo home.

- [x] **P0** Title + one-paragraph pitch matching §0.1 (client / freelancer language).
- [x] **P0** Badges or a short status line: live demo URL, stack (React, FastAPI, PayPal, Groq, AG Grid/Studio, Render, Supabase).
- [x] **P0** Screenshot or GIF of the product (public landing + one workspace). Commit images under `docs/images/` and embed them so they show on GitHub.
- [x] **P0** “What it does” — 7-step loop: brief → publish → apply → vet → award → fund → verify → pay.
- [x] **P0** “Who it’s for” — clients and freelancers, not buyers/suppliers.
- [x] **P0** Tech stack table.
- [x] **P0** PayPal APIs used (Orders, Capture, Webhooks, Payouts) and what AI does (SOW, vetting, evidence).
- [x] **P0** Local run: frontend, backend, env vars (names only, no secrets).
- [x] **P0** Hosted demo URL + pointer to `docs/JUDGE_DEMO.md` for seeded accounts (never put passwords in the README if the repo is public — use JUDGE_DEMO and Devpost private fields, or a clearly labeled demo password the owner accepts).
- [x] **P0** Link to this roadmap (`docs/TrustBroker_AI_Hackathon_Roadmap.md`) and the product guide.
- [x] **P0** LICENSE named and linked. Open-source license file at repo root (required by Devpost).
- [x] **P0** Tools used for Devpost: PayPal, Groq, OpenRouter, AG Studio, Render, Postman, APIMatic. **Do not list Gemini, KERNEL, or Bryntum.**
- [x] **P1** Architecture diagram (mermaid in README is fine; GitHub renders it).
- [x] **P1** Folder map: `react_app/`, `backend/`, `docs/`.

**Phase 9 gate**

- [x] Opening the GitHub repo in a logged-out browser shows a complete README with pitch, screenshots, and how to run.
- [x] No buyer/supplier wording. No Gemini. No “sandbox demo” as the hero sentence.

---

### Phase 10 — Deploy, developer story, cost check

**Dates:** 9–10 Nov

- [ ] **P0** Render static frontend + FastAPI service env vars (no secrets in repo).
- [ ] **P0** First-request wake banner.
- [ ] **P0** Postman collection covering listings, apply, award, fund, verify, payout, webhook example.
- [ ] **P0** OpenAPI at `/docs` matches collection.
- [ ] **P0** Update root README with the live URL after deploy.
- [ ] **P0** LICENSE file at repo root if not already added in Phase 9.
- [ ] **P1** Render Workflow mentioned in README if used.
- [ ] **P1** APIMatic plugin listed under tools used.
- [ ] **P2** Elastic — skip unless marketplace search is painful.

**Phase 10 gate**

- [ ] Hosted URL works in a private window with JUDGE_DEMO accounts.
- [ ] Local README path also works.

---

### Phase 11 — Video and Devpost (do not leave until 12 Nov)

**Dates:** 10–12 Nov (hard stop 12 Nov 12:00 pm PT)

**Video structure (≤2:50, record 375+ desktop cut if possible but one desktop pass is enough):**

1. 0:00–0:15 Problem: unpaid work vs unpaid invoices.
2. 0:15–0:40 Client brief → AI SOW → publish open contract.
3. 0:40–1:05 Freelancer profile + apply; client sees AI vet (include newcomer).
4. 1:05–1:25 Award, accept, **PayPal Buttons fund**.
5. 1:25–2:10 Submit evidence; AI criterion results on a live URL + screenshot.
6. 2:10–2:30 Release; PayPal payout id; AG Studio one-liner.
7. 2:30–2:45 Failure beat: cancelled PayPal or failed URL.
8. 2:45 End card: URL + repo.

- [ ] **P0** Record on the **hosted** app, not localhost.
- [ ] **P0** No copyrighted music. No third-party logos except PayPal as the integration.
- [ ] **P0** Upload YouTube public.
- [ ] **P0** Devpost: description, tools (PayPal Orders, Payouts, Webhooks, Groq, OpenRouter, AG Studio, Render, Postman, APIMatic), demo URL, repo, video.
- [ ] **P0** Re-read Official Rules the morning of 12 Nov.
- [ ] **P0** Do not change the repo after submitting except as Devpost allows for IP takedowns.

**Phase 11 gate**

- [ ] Submission status on Devpost is **Submitted** before the deadline, not Draft.

---

## 14. Suggested file-level work for coding agents

When implementing, prefer these paths. Do not create parallel apps.

**Backend**

- `backend/alembic/versions/` new migration
- `backend/app/models/application.py`, `vetting.py`, `notification.py`, `payout.py`
- `backend/app/models/user.py` extend
- `backend/app/models/contract.py` add `open` / `awarded` / `visibility`
- `backend/app/routers/listings.py`, `applications.py`, `notifications.py`, `profiles.py`
- `backend/app/services/vetting_service.py`
- `backend/app/services/verification/` package
- `backend/app/services/payment_service.py` payouts
- `backend/app/utils/paypal_client.py` payouts + webhook events
- `backend/app/services/ai_provider.py` vision + clarify + vet JSON schemas
- `backend/app/seed.py` judge data

**Frontend**

- `react_app/src/app/routes.tsx` new `/app/client` and `/app/freelancer` trees + redirects
- `react_app/src/components/layout/Sidebar.tsx` + new `MobileTabBar.tsx`
- `react_app/src/pages/client/*`, `react_app/src/pages/freelancer/*`
- `react_app/src/pages/Landing.tsx` rewrite
- `react_app/src/pages/operations/OperationsStudio.tsx`
- `react_app/src/lib/api.ts` new endpoints
- `react_app/src/types/*` no buyer/supplier
- `react_app/src/hooks/useAuthStore.ts` workspace, not fake personas
- `react_app/src/hooks/useContractStore.ts` split if it becomes a god object

**Docs**

- `docs/JUDGE_DEMO.md` (create in Phase 8)
- `docs/PAYPAL_SANDBOX.md` (operator notes, not linked from marketing nav)
- Root `README.md`, `LICENSE`

---

## 15. Definition of done (hackathon)

The project is submission-ready when **all** of these are true:

- [ ] Client can publish an open contract from a step-by-step AI wizard.
- [ ] Freelancers can browse, apply, and see status.
- [ ] AI vetting ranks applicants and treats newcomers fairly.
- [ ] Client awards one freelancer; others are notified of rejection.
- [ ] Both parties accept the same version.
- [ ] Client funds a milestone with PayPal; server and webhook agree it is funded.
- [ ] Freelancer submits real evidence; AI returns per-criterion results using the actual files/URLs/screenshots.
- [ ] Policy engine blocks payout until rules pass.
- [ ] Payouts API creates a PayPal payout; UI shows the real id and status.
- [ ] Client and freelancer workspaces are visually and functionally different.
- [ ] Public site looks intentional on mobile and desktop.
- [ ] AG Studio operations dashboard uses live data and an AI agent proxy.
- [ ] Hosted demo + JUDGE_DEMO accounts work in a private window.
- [ ] Video ≤ 3 minutes shows the loop plus one failure.
- [ ] Repo is public, licensed, documented, $0 services listed.

---

## 16. Risks and explicit non-goals

| Risk | Mitigation |
|---|---|
| Delayed disbursement not available | Use Orders + Payouts; honest copy |
| Groq / OpenRouter quota during judging | Fallbacks + seeded reports as last resort, labeled |
| Render spin-down | Wake banner; ping before video |
| AG Studio license watermark | Trial request; still functional |
| Live URL lying / outdated screenshot | Require screenshot + HTTP probe; Needs review if they disagree |
| Scope explosion | P2 items never block Phase 4–5 |
| Zimbabwe payout narrative | USD sandbox only; no local-rail claims |
| Email deliverability | In-app notifications are source of truth; magic link optional |

**Do not build:** Channel3 shop, WhatsApp bots, custom password hasher, running user code, Elastic cluster, social login, multi-currency FX lock, legal PDF generation, admin CMS, Gemini integration, KERNEL, Bryntum.

---

## 17. Owner decisions already recorded (27 Oct 2026)

Do not re-ask these. Do not implement the opposite.

1. **Judge login:** seeded accounts only. No one-click demo login.
2. **KERNEL:** out of scope.
3. **Bryntum:** out of scope. Use a simple CSS timeline if a schedule view is needed.
4. **Sign-up:** required primary workspace (Hire / Find work); switching later is allowed; never lock forever.
5. **Gemini API:** out of scope. Do not add a Gemini key, client, or adapter.

---

## 18. Agent execution protocol

For any coding agent using this file:

1. Read this roadmap and the current files listed in the task before editing.
2. Implement only the current phase’s **P0** items unless the user says otherwise.
3. After edits, run frontend lint/build and backend import checks if the environment allows.
4. Check off items in **this file** when the acceptance criteria are met.
5. Do not reintroduce buyer/supplier, Elena/Tariro impersonation, or “African bank rails” copy.
6. Do not put secrets in the client.
7. If blocked by missing credentials (PayPal, Groq, OpenRouter), implement the adapter behind a feature flag and continue. Never add Gemini, KERNEL, or Bryntum.

---

**Core principle:** One open contract, two real workspaces, PayPal that actually pays, AI that actually looks at the work. Everything else is decoration.
