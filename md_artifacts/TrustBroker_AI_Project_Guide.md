# TrustBroker AI — Project Guide

**Purpose:** A single, readable source of truth for the product direction, MVP scope, design, technology, security, payment limitations, and hackathon plan.

**Planning date:** October 2026  
**Target hackathon:** PayPal AI Hackathon  
**Working demo:** AI-assisted coordination of a digital-services contract, payment status, delivery evidence, and review.

---

## 1. What is TrustBroker AI?

TrustBroker AI is an **AI-assisted transaction coordination platform for digital services**. It helps a client and a service provider agree on work, record the contract, coordinate a supported payment workflow, assess submitted work against agreed requirements, and keep a traceable history of what happened.

The goal is to reduce misunderstandings and improve transparency. The platform connects four things that are often scattered across chats, emails, files, and payment pages:

1. What the client and provider agreed to do.
2. Whether both parties accepted the same version of the agreement.
3. What work or evidence the provider submitted.
4. What the payment provider actually confirmed and what the next permitted action is.

TrustBroker is **not automatically a legal escrow service**. It is an AI-powered conditional-payment coordination prototype, with payment actions limited to the capabilities that the payment provider actually supports for the account and country involved.

## 2. Who is it for?

The initial users are:

- Freelancers and independent digital-service providers.
- Small agencies and startups.
- Businesses commissioning work from providers in another country.
- Clients who need clear scope, deadlines, deliverables, and acceptance rules.

### Service categories

TrustBroker should be designed so it can support different kinds of digital services, not only software development. Potential categories include:

- **Software and IT:** websites, apps, API integrations, dashboards, bug fixes, cloud deployments, and IT assessments.
- **Design and creative work:** logos, branding, UI/UX design, illustrations, video editing, and other digital assets.
- **Marketing and business services:** content, SEO audits, market research, campaign setup, and lead-generation work.
- **Research and digital office work:** data analysis, business reports, spreadsheet automation, transcription, and documentation.

The same basic contract and delivery workflow should be reusable across categories. Different categories can have different evidence types and acceptance criteria.

### MVP scope

Build the platform for multiple digital-service categories at the data-model and user-interface level, but **make one software-development example work exceptionally well** for the hackathon: a buyer commissions a React landing page for an agreed USD amount. Where time permits, demonstrate that the same workflow can also handle a design deliverable, such as a logo, using custom acceptance criteria.

Do not attempt to build every category as a separate product during the hackathon.

## 3. The main problem we solve

A project can start as an informal conversation on WhatsApp, email, or another messaging platform. That can leave both parties uncertain about scope, deadlines, revisions, payment, and what qualifies as complete work.

The client may worry about paying and receiving poor or incomplete work. The provider may worry about completing the work and not getting paid. TrustBroker makes the agreement and process more structured and traceable.

## 4. Main product capabilities

### AI-assisted project brief and contract

The client describes the project in ordinary language. The AI extracts the requirements, asks useful clarification questions, and drafts an editable **Statement of Work (SOW)**.

The SOW should include:

- Client and provider details.
- Project scope and exclusions.
- Price and currency.
- Deliverables and milestones.
- Deadlines.
- Revision expectations.
- Acceptance criteria.
- Evidence required to assess completion.
- What happens when work is incomplete or unclear.

The client can edit the draft. The provider must be able to review the same version before accepting it.

### Contract versions and acceptance

Every meaningful contract revision creates a new version. Record which version each party accepted. If the terms change after acceptance, the agreement must return to a revision/amendment process; do not silently change an already accepted contract.

### Payment coordination

Use PayPal sandbox checkout for the hackathon. FastAPI creates orders and verifies payment status through PayPal's APIs and relevant webhook events. The browser alone must never be treated as proof that payment succeeded.

### Delivery submission and verification

The provider submits supported evidence, such as a file, source archive, screenshot, report, or repository link. TrustBroker records the submission and time.

The AI compares available evidence with the agreed criteria and reports a result for each criterion:

- **Pass** — evidence appears to satisfy the criterion.
- **Fail / Incomplete** — the evidence does not satisfy it or required material is missing.
- **Needs Review** — evidence is ambiguous, subjective, inaccessible, or beyond reliable automated assessment.

Save each report and link it to the relevant contract version, criteria, and submission. A design's visual quality or a report's usefulness may require the client or a human reviewer to make the final judgment.

### Deterministic policy engine

AI may draft text, assess evidence, summarize results, and recommend a next step. **The AI must not independently control money.** FastAPI checks the contract state, permissions, party acceptance, verified payment status, evidence, required approvals, and duplicate-processing safeguards before permitting any sensitive action.

### Traceable activity history

Both parties should be able to inspect the contract version, acceptances, payment events, submitted evidence, verification results, review decisions, timestamps, and permitted actions that occurred.

## 5. End-to-end demo workflow

The main demonstration should show one project moving through the whole lifecycle without manual database edits.

1. The buyer describes a digital project in the AI chat.
2. TrustBroker asks questions if essential details are missing.
3. The AI drafts and saves an editable SOW with structured acceptance criteria.
4. The client reviews the draft and invites or identifies the provider.
5. Both parties review and accept the same contract version.
6. The buyer completes PayPal sandbox checkout.
7. FastAPI verifies the resulting payment state with PayPal.
8. The provider submits the agreed deliverable or evidence.
9. The AI assesses the evidence against the accepted criteria.
10. The policy engine decides whether the next permitted status is revision, human review, release eligibility, or another supported state.
11. The dashboard and activity history show what happened.

Also demonstrate exception handling:

- A cancelled or failed checkout must not appear as paid.
- Incomplete work should lead to a revision or failed/incomplete result.
- Ambiguous evidence should lead to human review.
- A duplicate webhook or repeated request must not duplicate a payment action.
- If a payout is not supported, the UI must state that honestly instead of showing a fake receipt.

## 6. Payment limitations and honest wording

PayPal Orders checkout does not automatically create escrow. Authorization and capture have time limits. Delayed disbursement requires the appropriate partner status and seller onboarding, and funds may be automatically disbursed according to PayPal's rules. Availability depends on the account, country, product, and current provider permissions.

PayPal's documentation has identified Zimbabwe as send-only for seller onboarding, and Zimbabwe is not listed among the supported payout destinations in the relevant payout documentation. PayPal's supported-currency list also does not establish ZiG or ZAR as supported payment currencies for this use case. Recheck the official documentation and verify the specific sandbox/production account permissions before making a claim.

Therefore:

- Describe the product as **“AI-powered conditional-payment coordination prototype.”**
- Demonstrate PayPal sandbox checkout and server-verified payment states.
- Treat release eligibility as a backend decision, not as proof that money was transferred.
- Use states such as `RELEASE_ELIGIBLE` or `PAYOUT_NOT_AVAILABLE` when appropriate.
- Only show payout success after the provider confirms it.
- Do not promise live escrow, guaranteed payouts to Zimbabwean suppliers, or guaranteed local-currency settlement.
- If currency estimates are shown, label them **indicative** and include their source and timestamp. Do not promise a locked exchange rate without a supported mechanism.

Useful PayPal references to recheck during implementation:

- [Authorization and capture](https://developer.paypal.com/platforms/checkout/standard/customize/auth-capture/)
- [Delayed disbursement](https://developer.paypal.com/platforms/checkout/delayed-disbursement/)
- [Seller onboarding](https://developer.paypal.com/platforms/seller-onboarding)
- [Supported currencies](https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/)

## 7. Web application pages

Use the following routes and keep labels, statuses, navigation, and components consistent across the application.

| Route | Purpose | Key elements |
|---|---|---|
| `/` | Landing page and AI project chat | Product explanation, project brief, AI questions, saved draft creation |
| `/register` | Create an account | Name, email, password, confirmation, terms acceptance, validation |
| `/login` | Sign in | Email, password, password visibility, forgot-password link, errors |
| `/verify-email` | Confirm email | Verification instructions, resend option, expired/success states |
| `/forgot-password` | Request recovery email | Email input, generic confirmation, error and rate-limit states |
| `/reset-password` | Set a new password | New password, confirmation, requirements, invalid/expired-link states |
| `/settings/security` | Account security settings | Email verification status, change password, sign out |
| `/contract/:id` | Review contract and checkout | SOW, version, parties, terms, acceptance controls, PayPal checkout state |
| `/dashboard` | Active contracts | AG Grid ledger with filters, sorting, statuses, counterparty, amount, last activity, actions |
| `/deliver/:id` | Submit and assess delivery | Criteria, supported uploads/links, submission history, verification results, revisions |
| `/contract/:id/activity` | Auditable activity history | Ordered events, timestamps, contract versions, payment and delivery history |
| `/developers` | Developer portal | API overview, OpenAPI schema, endpoint descriptions, Postman collection |

Keep exception handling, revision requests, and human review inside the relevant contract and delivery pages where practical, rather than adding unnecessary standalone modules. A minimal admin-only review view can be added for ambiguous results.

## 8. Authentication and permissions

### Recommended approach

Use **Supabase Auth** for identity and password management. Do not build a custom password-storage or password-reset system.

### Required authentication screens and functionality

- Registration using name, email, and password.
- Terms and Privacy Policy acceptance.
- Email verification and resend-verification flow.
- Sign in and sign out.
- Forgot-password request.
- Secure password-reset flow.
- Change password while signed in.
- Clear validation, loading, success, invalid-credentials, expired-link, and error states.
- Session-aware redirects and protected routes.

Password-reset responses should not reveal whether a particular email address is registered. Test the actual email service early; the default service may be too limited for a deployed demo, so suitable SMTP may be needed.

### Roles

The application has at least these permission groups:

- **Buyer:** create contracts, edit drafts, accept terms, perform permitted payment actions, and review submissions.
- **Supplier:** view invited contracts, accept terms, submit work, and provide revisions.
- **Admin/reviewer:** access explicitly authorized review cases and record review decisions.

One account may act as a buyer on one contract and a supplier on another. Do not permanently lock users into one role at registration.

### Authentication versus authorization

Authentication proves who signed in. Authorization determines which contracts, files, and actions that user may access. We need both.

- Use Supabase Row Level Security (RLS) for database and storage access where applicable.
- Check identity, contract membership, ownership, role, contract state, and permissions in FastAPI on sensitive operations.
- Do not trust role names or IDs supplied by the frontend without server-side checks.
- Never allow a user to access another user's files by changing an ID in the URL.

### Defer from the MVP

Do not make social login, SMS verification, enterprise SSO, or mandatory multifactor authentication a blocker for the first release. MFA can be added later. Do not skip the required authentication and authorization safeguards just because this is a hackathon.

## 9. File storage decision: Supabase Storage first

**We do not need Cloudflare R2 for the MVP.** Use Supabase Storage's private buckets for contract files, submitted deliverables, screenshots, and evidence. Store metadata and references to those files in PostgreSQL.

Use private storage, access rules, and short-lived signed URLs when appropriate. Validate file type and size. Avoid running uploaded archives or arbitrary code inside the main FastAPI process.

Keep file storage behind a small backend abstraction where practical, so R2 can be added later if real storage volume, download activity, cost, or operational requirements justify it. Do not add a second storage provider just to make the architecture look more complex.

## 10. Recommended technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite | Web application and routes |
| UI styling/components | Tailwind CSS, shadcn/ui, Lucide | Consistent, responsive user interface |
| Contract dashboard | AG Grid Community | Sortable and filterable contract ledger |
| Backend | Python, FastAPI, Pydantic | APIs, validation, policy rules, AI orchestration, payment integration, audit events |
| Database access | SQLAlchemy or SQLModel, Alembic | Data models and tracked schema migrations |
| Database | Supabase PostgreSQL | Persistent application records |
| Authentication | Supabase Auth | User identity, verification, recovery, sessions |
| File storage | Supabase private Storage | Deliverables and evidence files |
| AI | Gemini API initially | Structured SOW drafting and evidence assessment; keep behind a provider adapter |
| Payments | PayPal JavaScript SDK and Orders API sandbox | Checkout and provider-confirmed payment states |
| Hosting | Render static site and FastAPI service, subject to current limits | Public demonstration deployment |
| API documentation/testing | FastAPI OpenAPI and Postman | Documentation and repeatable API tests; APIMatic optional |

Do not place API keys, PayPal secrets, Supabase service-role keys, or unrestricted payment operations in the frontend.

## 11. Architecture in plain language

1. **React frontend:** shows the chat, contract pages, checkout, dashboard, delivery screens, and activity history.
2. **FastAPI backend:** validates requests, verifies permissions, calls the AI provider, creates PayPal orders, processes provider events, applies the policy engine, and records audit events.
3. **Supabase:** stores users/authentication, contract and workflow records, and private uploaded files.
4. **External services:** Gemini (or a replaceable AI provider) and PayPal sandbox. An optional FX reference API can be considered later, but it is not required for the MVP.

The frontend is not the authority for payment success, identity permissions, or whether a payout may occur. Those decisions must be enforced or verified by the backend and relevant providers.

## 12. Suggested data entities

The initial data model should account for:

- **Profiles/users:** application profile and preferences linked to Supabase Auth.
- **Contracts:** project parties, category, amount, currency, lifecycle state, and current version.
- **Contract versions:** versioned SOW content and acceptance criteria.
- **Contract acceptances:** party, accepted version, timestamp, and relevant audit metadata.
- **Payment attempts:** PayPal order/reference IDs, requested operation, verified state, and errors.
- **Provider events:** webhook/provider event IDs and processing status for idempotency.
- **Deliveries:** uploader, file or repository reference, timestamp, and version.
- **Verification reports:** criterion-level results, explanation, evidence references, AI/model metadata where useful, and human-review status.
- **Audit events:** ordered record of important actions and transitions.

Use database constraints and idempotency protections for operations that must not be duplicated. Store enough provider information to investigate a failed or duplicate event without treating the browser response as proof.

## 13. Design direction for Google Stitch

Use Google Stitch to generate and iterate on the user interface. It can help design screens and support handoff, but **it does not replace implementation of the backend, database security, payment verification, or business logic**. Those still need to be built and tested in code.

### Visual style

- Professional fintech interface.
- Deep navy navigation and text.
- White content surfaces and restrained light-grey backgrounds.
- Blue for primary actions, particularly payment-related actions.
- Green for confirmed success; amber for pending or uncertain states; red for failures or blockers.
- Always pair status colors with text or icons so status is not communicated by color alone.
- Clear spacing, consistent borders, accessible typography, responsive layouts, and useful empty/loading/error states.

Keep payment status separate from delivery status. For example, payment can be confirmed while work is still outstanding, and work can pass verification while a payment action remains pending or unavailable.

### Consistency rules for Stitch

- Create one shared design system and reuse it on every screen.
- Reuse consistent navigation, page headers, form fields, status chips, tables, dialogs, alerts, and loading states.
- Keep the same names for states and actions across all pages.
- Design for desktop and mobile layouts.
- Use realistic but clearly demonstrative sample data; never imply a sandbox transaction is a live payout.
- Generate screens in a deliberate sequence instead of asking Stitch to design the entire app in one prompt.
- Treat all clickable prototype interactions as prototypes until they are connected to and verified against real backend endpoints.

## 14. UX rules and important states

The interface should clearly distinguish:

- Draft versus accepted contract.
- Contract version accepted by each party.
- Payment pending, confirmed, failed, cancelled, release eligible, or payout unavailable.
- Delivery not submitted, submitted, incomplete, passed, or needing review.
- AI suggestion versus human decision versus provider-confirmed event.

Every operation that changes important state should provide feedback and a traceable event. Show useful empty states when no contracts or deliveries exist. Confirm important actions such as accepting a contract version. Give clear recovery instructions when uploads, verification, checkout, login, or email delivery fail.

## 15. Features to defer

These are longer-term ideas, not MVP requirements:

- Automated supplier sourcing across freelance marketplaces.
- A full supplier marketplace with ranking, availability, fraud controls, and discovery.
- WhatsApp bots and automated messaging campaigns.
- Guaranteed local-currency rate locking or complex multi-currency settlement.
- Unrestricted autonomous payment release.
- Running arbitrary submitted code inside the main backend.
- Formal legal arbitration or automated dispute resolution.
- Social login, enterprise SSO, SMS recovery, and other advanced account features.
- Cloudflare R2 unless actual requirements justify adding it.

Design the core models so that future capabilities can be added, but do not make the first release depend on them.

## 16. Definition of done for the MVP

The MVP is ready when all of the following are true:

- [ ] A user can register, verify an email, sign in, reset a forgotten password, and sign out.
- [ ] FastAPI and Supabase enforce access to private contract and delivery data.
- [ ] The buyer can describe a project in chat and get clarification questions when needed.
- [ ] The AI produces a structured, editable SOW with acceptance criteria.
- [ ] The draft is saved and can be reopened by its ID.
- [ ] Contract versions are recorded, and both parties can accept the same version.
- [ ] A working PayPal sandbox checkout is available.
- [ ] Payment state is verified server-side; a cancelled or failed checkout is never displayed as paid.
- [ ] A supplier can submit supported files or repository links and see submission history.
- [ ] AI verification creates saved criterion-level Pass, Fail/Incomplete, or Needs Review results.
- [ ] Incomplete and ambiguous cases lead to revision or human review as appropriate.
- [ ] Backend rules block unauthorized actions and protect against duplicate processing.
- [ ] AG Grid shows real API-backed records with useful sorting, filtering, details, and statuses.
- [ ] Activity history links the contract, payment events, evidence, verification, and review events.
- [ ] The demo is deployed and can be used in a clean browser session.
- [ ] Setup instructions, environment-variable documentation, an open-source licence, OpenAPI documentation, and a Postman collection are available.
- [ ] The video demonstrates a successful path and at least key failure/exception paths.

## 17. Hackathon strategy

Our product has a plausible fit with an AI-and-payments hackathon, but winning is not guaranteed. We should aim for a strong special-award entry while building to grand-prize quality.

Potential angles include:

- **PayPal + AI:** PayPal must be part of a real sandbox transaction flow, while AI performs useful contract and evidence work.
- **AG Grid:** the dashboard should use the grid for real operational work, not merely display a basic table.
- **Impact:** explain a specific problem for freelancers, agencies, and cross-border clients and show how TrustBroker improves traceability.

Do not claim a prize is likely based on the idea alone. The implementation, differentiation, actual competition, and presentation quality all matter. Verify the current official rules, entrant eligibility, any country restrictions, prize-payment requirements, and deadlines before submission: [PayPal AI Hackathon rules](https://paypalaihackathon.devpost.com/rules).

The planning date discussed for the deadline is **November 12, 2026 at 12:00 noon Pacific time (10:00 p.m. Zimbabwe time)**. Confirm this on the official competition page before relying on it.

## 18. Proposed roadmap

| Dates | Focus | Exit condition |
|---|---|---|
| Oct 23–25 | Foundation | Repository/app skeleton, Supabase configured, frontend calls FastAPI, AI and PayPal sandbox tested, permissions understood |
| Oct 26–29 | Authentication and contracts | Registration/login/recovery, ownership checks, saved drafts, structured SOW, contract versions |
| Oct 30–Nov 2 | Payments | Server-side order creation and verification, webhook/event storage, error handling, idempotency |
| Nov 3–5 | Delivery and verification | Evidence submission, saved reports, pass/fail/needs-review cases, revisions, human-review state, policy rules |
| Nov 6–8 | Integration and UX | AG Grid, contract details, role-aware views, status indicators, audit history; one contract completes the flow |
| Nov 9–10 | Release candidate | Deploy, README/setup guide, licence, OpenAPI/Postman, hosted-demo tests |
| Nov 11–12 | Submission | Record and publish demo, verify repository access and Devpost fields; reserve deadline day for checks |

This timeline is a planning proposal, not a claim that the work has already been completed. Prioritize a working core transaction loop over optional features.

## 19. Three-minute demo outline

A concise demonstration should tell one coherent story:

1. **Problem (15–20 seconds):** a client and remote provider need a clear agreement and proof of delivery.
2. **Brief to contract:** enter a plain-language project request and show the AI-created editable SOW and criteria.
3. **Agreement and payment:** show both parties accepting the same version and complete PayPal sandbox checkout; show the backend-verified state.
4. **Delivery and verification:** submit evidence and show criterion-by-criterion AI results.
5. **Controlled next step:** show the backend policy result, with human review or revision when needed, and do not imply a payout occurred unless PayPal confirms it.
6. **Audit trail:** finish with the dashboard and activity history.
7. **Resilience:** briefly show a failed/cancelled payment or an incomplete/ambiguous delivery.

Explain what the AI does and what deterministic backend rules do. The final video must follow the official hackathon rules, including the current time limit and public-access requirements.

## 20. Immediate priorities

1. Confirm the current hackathon rules, eligibility, deadline, and available PayPal sandbox features.
2. Create the repository and configure the frontend, FastAPI, and Supabase project.
3. Test registration, email verification, password recovery, file storage, AI calls, and PayPal sandbox checkout early.
4. Implement the contract/version lifecycle before adding optional services.
5. Make delivery submission, criterion-level verification, and the deterministic policy engine work end to end.
6. Add the dashboard, activity history, and consistent UI states.
7. Deploy early enough to test from a clean browser session.
8. Record the demo only after the core path and failure paths have been tested.

---

## Official and implementation references

- [PayPal authorization and capture](https://developer.paypal.com/platforms/checkout/standard/customize/auth-capture/)
- [PayPal delayed disbursement](https://developer.paypal.com/platforms/checkout/delayed-disbursement/)
- [PayPal seller onboarding](https://developer.paypal.com/platforms/seller-onboarding)
- [PayPal supported currencies](https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/)
- [Supabase billing and plan limits](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Render free services](https://render.com/docs/free)
- [PayPal AI Hackathon rules](https://paypalaihackathon.devpost.com/rules)

**Core principle:** Build a secure, reproducible transaction workflow first. Expand categories and add optional services only after the core product reliably connects the accepted agreement, provider-confirmed payment state, submitted evidence, verification outcome, and audit history.
