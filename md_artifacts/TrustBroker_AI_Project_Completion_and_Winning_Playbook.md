# TrustBroker AI — Project Completion & Winning Playbook

**Purpose:** A practical working document for finishing TrustBroker AI, tightening its product positioning, strengthening the marketplace and AG Studio experience, validating the technical implementation and preparing a persuasive PayPal AI Hackathon submission.

**Prepared:** 2 November 2026  
**Repository:** [github.com/brianproducedit/trustbroker_ai](https://github.com/brianproducedit/trustbroker_ai)  
**Live frontend previously shared:** [trustbroker-ai.onrender.com](https://trustbroker-ai.onrender.com)  
**Hackathon:** [PayPal AI Hackathon — official rules](https://paypalaihackathon.devpost.com/rules)

---

## Important note about the repository review

This playbook consolidates the findings from the previous public-repository review and the product decisions discussed in this project. The repository inspection previously established a React frontend, a FastAPI backend direction, marketplace and contract workflows in the README, AI provider configuration, PayPal integration plans, AG Grid/AG Studio work and supporting documentation.

**I could not retrieve the newest GitHub README and source tree again during preparation of this file.** You have made further changes since the earlier review, so repository-specific observations below should be treated as the last inspected baseline, not a certification of the current `main` branch. In particular, re-check all environment variables, deployment URLs, implemented routes, AI provider settings and payment code against the latest commit before acting on an item marked “previously observed.”

This document deliberately distinguishes:

- **Previously observed / README-documented:** what was visible in the last repository review or described in the project documentation.
- **Needs code verification:** a feature or claim that must be checked in the implementation and through tests.
- **Recommendation:** a proposed product or engineering improvement, not a claim that it already exists.

A README claim is not proof that a workflow is functional. A working UI is not proof that the backend, database or payment provider has completed the corresponding action.

---

# 1. Executive assessment

TrustBroker AI has a stronger and more distinctive direction when presented as an **AI-assisted agreement, delivery-verification and payment-coordination platform for digital services**, with a focused marketplace that helps clients discover and engage freelancers.

The product should not try to become a general-purpose Upwork competitor before the hackathon. The marketplace is useful because it brings the client and freelancer into the same workflow. The differentiator is what happens after they find each other:

1. A project brief becomes a structured, editable agreement.
2. Both parties accept the same agreement version.
3. Payment activity is coordinated through PayPal and confirmed by the backend.
4. The freelancer submits evidence of the work.
5. AI assesses that evidence against the requirements agreed in advance.
6. Deterministic backend rules decide which next actions are permitted.
7. Both parties can inspect the contract, evidence, payment events and activity history.

**The product's central promise:** make expectations explicit before work begins, make delivery assessable against those expectations and make the transaction history transparent.

## Overall evaluation

| Area | Assessment | Main action |
|---|---|---|
| Product idea | Strong, with a meaningful trust problem to solve | Keep the agreement-to-evidence workflow at the centre |
| Marketplace | Valuable supporting feature, but scope can grow quickly | Keep discovery, applications, shortlist and award; defer social/community features |
| AI | High potential | Use structured outputs and demonstrate a genuine incomplete/needs-review result |
| PayPal | Essential for hackathon eligibility and product flow | Demonstrate real sandbox events; do not claim unsupported escrow or payouts |
| Backend and security | Must be proven, not inferred from README | Verify auth, database persistence, permissions, webhooks and idempotency |
| AG Grid / AG Studio | Potential sponsor-prize opportunity | Build a useful, interactive operations studio rather than a decorative dashboard |
| Demo | A major scoring opportunity | Record one complete, honest workflow in under three minutes |
| Impact | Needs real-world evidence | Gather concise feedback from actual clients and freelancers |

**Priority principle:** finish one trustworthy end-to-end journey before adding new products, integrations or marketplace features.

---

# 2. What was previously found in the repository

The last repository review described the following architecture and project assets. Confirm that these are still accurate in the latest branch.

## 2.1 Product workflow described in the README

The README described a marketplace-oriented lifecycle:

1. **AI project brief and SOW generation:** the client describes work in natural language; AI drafts a structured Statement of Work with scope, milestones, timelines and acceptance criteria.
2. **Publish an open project:** the client publishes a project with visibility, category and skill tags.
3. **Freelancer applications and AI vetting:** freelancers apply and provide portfolio or related evidence; AI assists with assessment.
4. **Award and mutual acceptance:** the client selects a freelancer and both parties accept the agreement.
5. **Milestone funding:** the client uses PayPal Checkout for the relevant milestone.
6. **Delivery and AI verification:** the freelancer submits work evidence, such as repository links, live URLs or screenshots; AI evaluates the evidence against the accepted criteria.
7. **Payment outcome:** the client authorises the next permitted action and the backend uses supported PayPal functionality where available.

This is a coherent product direction. However, each stage must be checked against the current frontend, API routes, database models, provider calls and tests. In particular, “AI vetting,” “funded milestone,” “verified delivery,” “release” and “payout completed” must not be used interchangeably.

## 2.2 Previously documented technology direction

| Layer | Previously documented direction | What to verify now |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind | Current dependencies, build and route handling |
| Dashboard | AG Grid / AG Studio | Whether AG Studio itself is embedded and interactive, not just AG Grid |
| Backend | Python 3.12, FastAPI, SQLModel | Current API routes, service boundaries, schema validation and error handling |
| Database | PostgreSQL / Supabase | Actual migrations, persistence, RLS and production database configuration |
| Authentication | Supabase Auth / JWT verification | Server-side token validation and role/contract authorization |
| AI | Groq primary, OpenRouter fallback; DeepSeek described as optional | Current provider adapter, real model IDs, fallback behaviour and output validation |
| Payments | PayPal Orders v2, Payouts and webhooks described | Actual order/capture/payout calls, signature checks, provider eligibility and event persistence |
| Hosting | Render | Current frontend/backend service URLs, environment variables and CORS |
| API tooling | OpenAPI / Postman collection | Whether examples work against the deployed backend |

## 2.3 Supporting assets previously seen

The previous repository review described a structure that included:

- `react_app/` for the frontend.
- `backend/` for FastAPI services, models and tests.
- `docs/` for guides and project documentation.
- `demo_assets/` for sample passing and failing evidence.
- `postman/` for API request collections.
- `supabase_setup.sql` for database setup.
- Render deployment configuration and deployment instructions.
- A public MIT licence.

Do not assume every file is current or every demo asset is connected to the live application. Verify that the README setup process works from a clean clone.

## 2.4 Previously observed documentation/configuration inconsistencies

These were identified during the earlier review and should be rechecked against the latest commit:

| Previously observed issue | Why it matters | Required correction |
|---|---|---|
| Root `.env.example` still referred to Gemini, while the README described Groq/OpenRouter/DeepSeek | New contributors may configure the wrong provider | Make the example match the actual provider adapter and code |
| Frontend/backend URLs differed between repository metadata, `.env.example` and CORS settings | CORS, login redirects and API calls can fail | Establish one canonical production URL for each service |
| `package.json` required Node.js 20+ while README said Node 18+ | Reproducibility and deployment failures | Use one accurate Node requirement everywhere |
| README described some seed/setup behaviour that needed comparison with the actual command | Clean setup may fail or create duplicate records | Document exact migration and seed order; make seeding safe and idempotent |
| README used strong payment/escrow-like wording | Could overstate PayPal functionality | Describe only provider-confirmed capabilities and actual sandbox behaviour |
| Demo credentials were documented | Shared credentials can expose data or become stale | Use disposable demo users, least privilege and clearly labelled sandbox data |

---

# 3. Perfect the product angle

## 3.1 Recommended positioning

**Recommended one-sentence positioning:**

> TrustBroker AI turns digital-service project briefs into mutually accepted, measurable agreements, assesses submitted work against those agreed requirements and coordinates the related transaction workflow with transparent records.

**Short pitch:**

> Freelance projects often begin with informal briefs and unclear definitions of completion. TrustBroker AI helps clients and freelancers agree on measurable deliverables before work begins, assess delivery evidence against those requirements and coordinate payment steps using a transparent, auditable workflow.

**Suggested tagline:**

> Clear agreements. Verifiable work. Transparent transactions.

## 3.2 What TrustBroker is — and what it is not

TrustBroker should be presented as:

- An agreement-generation and contract-versioning assistant.
- A marketplace workflow for matching clients and freelancers to digital-service projects.
- An evidence-based delivery assessment system.
- A transaction coordination layer that uses PayPal where the relevant capabilities are available.
- An auditable record of acceptance, evidence, verification and payment events.

Do **not** present it as:

- A legally certified contract service unless independently established.
- A guaranteed escrow provider.
- A platform that guarantees freelancer payouts in every country.
- An AI that can objectively determine all aspects of creative work.
- A system that executes arbitrary code submitted by freelancers.
- An automated hiring authority that makes final candidate selection without human control.

## 3.3 Why the idea is differentiated

The strongest distinction is the connection between the agreement and the evidence:

- Most project marketplaces help users discover one another and manage projects.
- Generic AI tools can draft briefs or summarise submissions.
- Payment tools process transactions.
- TrustBroker connects the agreed requirements, the submitted evidence and the next permitted transaction action in one traceable workflow.

The innovation is not simply “AI plus freelancing.” It is **evidence-linked transaction coordination**.

## 3.4 The memorable product demonstration

Show a project where the AI does **not** approve everything.

Example: a client commissions a responsive landing page with these acceptance criteria:

1. Desktop layout matches the agreed design.
2. Mobile layout works at the agreed viewport widths.
3. Contact form validates required fields.
4. Source repository is accessible.
5. Required README and deployment instructions are present.

The first submission might pass desktop layout, form validation and repository checks, but fail mobile layout or require review because no mobile evidence was provided.

TrustBroker should:

- Name the exact criterion that is incomplete.
- Explain what evidence was inspected.
- Avoid claiming that a URL or repository was tested if it was not actually accessed.
- Let the freelancer submit a correction.
- Reassess the corrected evidence.
- Save both assessment versions and their timestamps.

This is a stronger demonstration than a generic AI score of 94% with every criterion green.

---

# 4. Marketplace recommendations

The marketplace should serve the trust workflow, not become a separate full-scale freelancing social network.

## 4.1 Recommended MVP marketplace flow

### Client journey

1. Create a project brief.
2. Let AI ask for missing information and draft the SOW.
3. Review scope, exclusions, deliverables, milestones, price, deadline, revision policy and acceptance criteria.
4. Choose whether to publish the project or invite a known freelancer.
5. Review applications using structured, comparable information.
6. Shortlist and select a freelancer.
7. Send the final agreement for mutual acceptance.
8. Track delivery and payment states independently.

### Freelancer journey

1. Set up a profile with service categories, skills, experience and portfolio evidence.
2. Browse relevant public projects.
3. Apply with a proposal, availability and relevant examples.
4. Review the proposed agreement before accepting.
5. Submit deliverables and evidence against the agreed criteria.
6. Respond to incomplete or needs-review feedback.
7. Review the final transaction history and outcome.

### Shared principles

- One account can act as a client on one project and a freelancer on another.
- The sign-up workspace is a primary onboarding preference, not a permanent global identity lock.
- Permissions are project-specific and checked by the backend.
- Both parties accept the same contract version, not merely a project ID.
- Contract changes create a new version and require re-acceptance when material terms change.

## 4.2 Keep the marketplace category list focused

Recommended initial service categories:

1. Software and IT services.
2. Design and creative services.
3. Digital marketing and content services.
4. Research and digital-office services.

Use categories as a way to organise projects, not as a promise that TrustBroker can verify every possible type of work equally well. Begin with one excellent demonstrable use case: a React landing page or small web application. A logo-design example can be a secondary example if the evidence criteria are objective enough.

## 4.3 Freelancer profiles: fields worth supporting

- Display name and professional headline.
- Service categories and skills.
- Short professional overview.
- Portfolio items with links, descriptions and the freelancer's role.
- Availability and preferred project size.
- Location/time zone only when useful and voluntarily supplied.
- Relevant completed TrustBroker projects, once real platform history exists.
- Clear disclosure of whether a portfolio item is self-reported or platform-verified.

Do not imply identity verification, background checks or skill certification unless those processes are actually implemented and supported by evidence.

## 4.4 AI-assisted freelancer vetting: safe design

AI can help clients understand applications, but should not autonomously make the final hiring decision.

Recommended AI output:

- A concise summary of the proposal.
- Skills explicitly evidenced by the portfolio.
- Similarity to the stated project requirements.
- Missing information or questions for the applicant.
- Possible risk or inconsistency flags, explained with supporting evidence.
- A comparison against the same published criteria for every applicant.

Avoid scoring or ranking based on sensitive personal characteristics, nationality, ethnicity, religion, gender, age, disability or other protected traits. Do not infer these attributes from names, photographs or writing. Keep the human client responsible for shortlisting and selection. Show the evidence behind AI suggestions and allow the client to disregard them.

## 4.5 Application states

A compact state model is enough for the MVP:

`DRAFT → SUBMITTED → UNDER_REVIEW → SHORTLISTED → ACCEPTED`

Alternative terminal states:

`WITHDRAWN`, `REJECTED`, `CLOSED`

Once an applicant is accepted, create or activate the contract workflow. Keep application status separate from contract acceptance and payment status.

## 4.6 Marketplace features to defer

Do not spend the final build window on:

- Public social feeds or freelancer posts.
- Complex messaging and video calls.
- Public star-rating systems without enough verified transactions.
- Automated bidding or dynamic pricing.
- Subscription plans and commission optimisation.
- Sophisticated AI talent ranking.
- Multi-currency conversion guarantees.
- Broad support for every service category.

These features may be valuable later, but they do not prove the core trust proposition.

---

# 5. Agreement and contract system

The SOW is one of the most important parts of the product. It should be structured enough for verification, yet readable and editable by both parties.

## 5.1 Minimum SOW structure

- Contract/project title.
- Client and freelancer identities.
- Project summary and intended outcome.
- Scope and included work.
- Explicit exclusions.
- Deliverables.
- Milestones and due dates.
- Price, currency and agreed payment arrangement.
- Revision allowance and revision process.
- Acceptance criteria for every deliverable.
- Evidence required to assess each criterion.
- Client review window, if agreed.
- Handling of incomplete, inaccessible or ambiguous evidence.
- Cancellation and change-request process.
- Version number, creation time and status.

## 5.2 Make criteria testable

Weak criterion:

> The website must look professional.

Better criterion:

> The landing page must display the approved hero heading, primary call-to-action and supplied brand colours at desktop width, with no horizontal overflow at the agreed mobile viewport widths.

For each criterion, store:

- A stable criterion ID.
- A human-readable description.
- A type: functional, visual, content, technical or documentation.
- The evidence types accepted.
- Any objective thresholds or test steps.
- Whether human judgement is required.
- The assessment outcome and explanation.

## 5.3 Versioning and mutual acceptance

- Preserve every contract version.
- Calculate and store a content hash for the version both parties accept.
- Store user ID, role, timestamp and version/hash for each acceptance.
- Do not silently modify an accepted version.
- Material changes create a new version and invalidate prior acceptance for the changed terms.
- The project cannot progress to the appropriate next state until the required acceptances exist.

The audit history should make it easy to answer: **who accepted which exact terms and when?**

---

# 6. AI architecture and reliability

## 6.1 Provider approach

The previously documented direction was Groq as primary and OpenRouter as fallback, with DeepSeek as an optional additional provider. This is a sensible approach only if the current code actually implements a common provider interface and the fallback is tested.

Recommended architecture:

`React frontend → FastAPI AI route → provider adapter → selected model`

The browser must never call the provider directly with a secret API key.

Recommended configuration principles:

- One `AI_PROVIDER` setting.
- Model names configured explicitly per provider.
- API keys stored only in backend environment variables.
- Provider selection and fallback logic centralised in one module.
- Timeouts and bounded retry policy.
- Exponential backoff for rate limits and transient errors.
- No endless fallback loops.
- Provider/model and request metadata stored for audit, without logging secrets or unnecessary personal information.

Fallback is a best-effort reliability improvement, not a guarantee of zero downtime or zero cost. Free tiers have independent quotas, availability and model limits.

## 6.2 Structured AI responses

Use Pydantic models to validate outputs for:

- Project clarification questions.
- SOW drafts.
- Contract change proposals.
- Freelancer application summaries.
- Criterion-level verification reports.
- Human-review recommendations.

If the output is malformed or misses required fields, reject it, retry within limits or ask the user to clarify. Do not silently store malformed AI output as an agreement or verification result.

## 6.3 Separate AI judgement from backend authority

AI may:

- Draft terms.
- Identify missing requirements.
- Summarise applications.
- Compare evidence with criteria.
- Explain uncertainty.
- Recommend a revision or human review.

AI must not independently:

- Accept a contract on behalf of a party.
- Change an agreed price or milestone.
- Confirm a PayPal payment.
- Release or send money.
- Override a permission check.
- Mark a provider payout as completed without a confirmed provider result.

The backend policy engine owns permissions, required state transitions, payment prerequisites, idempotency and execution.

## 6.4 Verification result model

Recommended outcomes:

- `PASS` — available evidence supports the criterion.
- `FAIL_INCOMPLETE` — evidence demonstrates that the criterion was not met or required evidence is missing.
- `NEEDS_REVIEW` — evidence is ambiguous, inaccessible, conflicting or requires human judgement.
- `NOT_ASSESSED` — no valid assessment has been completed.

Every result should contain:

- Criterion ID and version.
- Evidence references inspected.
- Assessment outcome.
- Concise explanation.
- Confidence or uncertainty indicator, if supported by evaluation.
- Model/provider metadata.
- Timestamp.
- Whether human review is required.

A high aggregate score must not hide a failed critical criterion. Critical criteria should be treated individually by the policy engine.

## 6.5 Treat submitted evidence as untrusted

- Do not execute arbitrary uploaded code in the API server.
- Validate file type and size.
- Store private files in a private bucket with short-lived signed URLs.
- Treat repository contents, READMEs and webpages as untrusted input, not instructions for the AI.
- Protect against prompt injection in URLs and uploaded documents.
- If live URL browsing is implemented later, use an isolated service with SSRF protections, network restrictions, timeouts and no access to internal infrastructure.
- Record exactly which URLs/files were assessed and when.
- If a URL could not be accessed, say so rather than claiming verification.

## 6.6 Build a small evaluation set

Create at least these repeatable test scenarios:

1. Complete submission with all evidence.
2. Missing mobile screenshot or viewport evidence.
3. Broken or inaccessible repository URL.
4. Evidence conflicts with the contract.
5. Vague acceptance criterion that should trigger clarification before acceptance.
6. Malicious prompt-injection text inside a README or uploaded document.
7. Provider rate limit or outage.
8. Malformed AI JSON response.
9. Same verification request submitted twice.
10. Corrected delivery after a revision request.

Compare outcomes across providers where practical. Measure schema-valid response rate, assessment consistency, latency and failure handling rather than relying on an impressive-looking example alone.

---

# 7. PayPal integration: make claims accurate

PayPal is central to the hackathon requirement. The product must meaningfully use the PayPal Developer Platform and an AI tool. The official hackathon rules explicitly require both. See [official rules](https://paypalaihackathon.devpost.com/rules).

However, **PayPal Checkout is not automatically escrow**.

## 7.1 Required conceptual distinctions

| Event | Appropriate state wording |
|---|---|
| Client opens checkout | `CHECKOUT_INITIATED` |
| User approves PayPal order | `CHECKOUT_APPROVED` |
| Backend confirms capture | `PAYMENT_CONFIRMED` |
| Delivery evidence is accepted | `DELIVERY_VERIFIED` |
| Contract/payment prerequisites are met | `RELEASE_ELIGIBLE` |
| A supported payout is requested | `PAYOUT_REQUESTED` |
| PayPal confirms payout completion | `PAYOUT_COMPLETED` |
| Payout cannot be offered for the account/country | `PAYOUT_NOT_AVAILABLE` |
| Checkout/capture fails or is cancelled | `PAYMENT_FAILED` / `PAYMENT_CANCELLED` |

Do not show “funds held in escrow” after an ordinary order capture. Do not mark payout completed just because the frontend called a release endpoint.

## 7.2 PayPal implementation checks

- Create orders server-side.
- Use the correct sandbox credentials and API environment.
- Verify capture/order status server-side.
- Validate webhook signatures using PayPal's supported verification process.
- Persist provider event IDs and prevent duplicate processing.
- Make payment actions idempotent.
- Store provider references and raw status safely for reconciliation.
- Never accept the browser as the final authority on payment status.
- Make cancellation, capture failure, duplicate webhook and timeout outcomes explicit.
- Do not expose PayPal client secrets or access tokens in frontend code.

## 7.3 Country and delayed-disbursement caveat

PayPal's current developer documentation says delayed disbursement requires approved partner status and seller onboarding with the `DELAY_FUNDS_DISBURSEMENT` feature. It also says funds are automatically disbursed to the seller after 28 days. This is not a general-purpose escrow feature available to every integration.

PayPal's seller-onboarding eligibility page marks Zimbabwe as **Send only** for the relevant seller onboarding use case and the current Payouts supported-country list does not list Zimbabwe. This is a material limitation for a Zimbabwe-based freelancer marketplace.

Therefore:

- Keep the PayPal sandbox flow as a clear, meaningful hackathon integration.
- Do not promise live payouts to Zimbabwean freelancers through PayPal unless PayPal confirms a supported path for the exact account and integration.
- Do not claim that TrustBroker holds funds in escrow unless the relevant PayPal partner capability is approved and enabled.
- Show payment coordination and payout eligibility separately.
- State that actual payment options depend on PayPal account, seller onboarding, currency and country eligibility.

Official references:

- [PayPal delayed disbursement](https://developer.paypal.com/platforms/checkout/delayed-disbursement/)
- [PayPal seller onboarding and country eligibility](https://developer.paypal.com/platforms/seller-onboarding)
- [PayPal Payouts supported countries](https://developer.paypal.com/payouts/supported-features/)

This limitation does not negate the hackathon concept. It means the product must demonstrate sandbox transaction coordination honestly and avoid unsupported live payout claims.

---

# 8. AG Grid and AG Studio: turn this into a real differentiator

The hackathon includes an AG Grid sponsor prize. The AG Studio opportunity is stronger if it is used to solve a real operational problem, not merely to display a standard grid.

AG Studio has evolved beyond static dashboard composition. Its documented capabilities include custom widgets, server-side aggregation, data editing, pivot/hierarchical widgets, a visual expression builder, undo/redo, server-side pagination and the Studio Agent Framework. The Agent Framework allows a team to integrate its own LLM and tools into a dashboard workflow.

References:

- [AG Studio roadmap](https://www.ag-grid.com/studio/roadmap/)
- [AG Studio Agent Framework introduction](https://www.ag-grid.com/blog/introducing-the-ag-studio-agent-framework/)
- [AG Studio React custom widgets](https://ag-grid.com/studio/react/custom-widgets/)

## 8.1 Recommended feature: TrustBroker Operations Studio

Build an operations/oversight workspace for platform operators or reviewers. It should answer: **Where are projects getting stuck, which submissions need review and which payment states need attention?**

Suggested dashboard layout:

### Top KPI cards

- Active projects.
- Payment-confirmed projects awaiting delivery.
- Submissions awaiting verification.
- Revision requests outstanding.
- Payment exceptions.

All values must come from real backend queries or clearly labelled demo fixtures.

### Main visualisations

1. **Lifecycle funnel:** draft → published → awarded → accepted → payment confirmed → delivery submitted → verified.
2. **Verification outcomes:** pass, fail/incomplete, needs review.
3. **Milestone aging:** projects waiting for client action, freelancer delivery or review.
4. **Payment state breakdown:** initiated, confirmed, failed, cancelled, release eligible, payout unavailable/completed where supported.
5. **Category breakdown:** active projects and verification results by service category.

### Actionable data grid

Useful columns:

- Project ID and title.
- Client.
- Freelancer.
- Category.
- Contract version/acceptance status.
- Milestone.
- Payment status.
- Delivery status.
- Verification outcome.
- Time waiting in current state.
- Last activity.
- Link to the contract/activity history.

Useful interactions:

- Filter by payment status, delivery status, category and date.
- Sort by age or last activity.
- Click a chart segment to cross-filter the grid.
- Click a row to open the underlying contract or activity history.
- Keep payment and delivery dimensions separate.

## 8.2 Make the AG Studio Agent genuinely useful

Use the Studio Agent Framework with your chosen LLM provider only if it is working reliably. A focused read-only operations assistant is more defensible than a generic chatbot.

Example questions for the demo:

- “Show projects where payment is confirmed but delivery is overdue.”
- “Which submissions have been waiting for review the longest?”
- “Group revision requests by project category.”
- “Show payment exceptions from the last seven days.”
- “Compare completed and incomplete delivery outcomes by category.”

The agent should translate questions into approved, read-only analytics tools or dashboard configurations. It must not issue payouts, alter contracts or approve deliveries.

A strong implementation would demonstrate:

1. The agent interprets the question.
2. It uses a constrained tool/schema to query permitted data.
3. It adds/configures a relevant visualisation or filter.
4. The dashboard and grid update consistently.
5. The user can inspect the underlying records.

## 8.3 What not to do with AG Studio

- Do not present a static screenshot as an interactive Studio implementation.
- Do not call ordinary AG Grid usage “AG Studio.”
- Do not show hard-coded KPI cards while claiming live analytics.
- Do not give the agent unrestricted database or payment tools.
- Do not spend time implementing every Studio feature. A smaller, polished and meaningful use case is better.

## 8.4 Minimum AG Studio showcase

For a credible sponsor-prize attempt, aim to demonstrate:

- At least one real AG Studio dashboard.
- Real data binding or a documented API data source.
- Multiple useful visualisations.
- An interactive grid or custom widget.
- At least one useful filter/cross-filter interaction.
- A natural-language agent action, if using the Agent Framework.
- A clear explanation of why this helps TrustBroker operators.

Verify the exact AG Studio package, version, licensing and sponsor eligibility requirements before claiming the feature in the submission.

---

# 9. Security, data and backend completion

## 9.1 Authentication and authorization

- Supabase Auth manages registration, sign-in, email verification and password reset.
- FastAPI verifies the JWT server-side.
- Database RLS protects user and contract data.
- FastAPI checks contract membership, project role, ownership and allowed state transitions.
- A user can be a client on one project and a freelancer on another.
- The chosen primary workspace at signup is an onboarding preference, not global authority.
- Changing a URL ID must never reveal another party's private contract or evidence.
- Generic password-reset responses should avoid account enumeration.

## 9.2 Recommended core entities

| Entity | Purpose |
|---|---|
| `profiles` | User profile and primary workspace preference |
| `contracts` | Current project/contract identity and top-level state |
| `contract_versions` | Immutable SOW versions and content hashes |
| `contract_acceptances` | Who accepted which version and when |
| `applications` | Freelancer applications and review state |
| `milestones` | Deliverables, deadlines, amounts and progress |
| `payment_attempts` | Order/capture references and provider status |
| `provider_events` | PayPal webhook/event records and idempotency |
| `deliveries` | Submission metadata and evidence references |
| `verification_reports` | Criterion-level AI/human assessment results |
| `audit_events` | Immutable activity trail |
| `notifications` | User-facing notifications, if implemented |

Use migrations as the source of database schema truth. Avoid relying on ad hoc schema setup or frontend-only records.

## 9.3 Audit trail

Record important events such as:

- Project created/published.
- Application submitted/shortlisted/accepted/rejected.
- Contract version created.
- Client acceptance.
- Freelancer acceptance.
- PayPal order created/approved/captured.
- Webhook received and verified.
- Delivery submitted.
- AI verification report created.
- Human review completed.
- Revision requested/resubmitted.
- Payment action requested/confirmed/failed.

Each event should include an actor or provider, timestamp, object ID, event type and relevant non-secret metadata. Avoid mutable history records that can be silently rewritten.

## 9.4 Essential automated tests

- Authentication and expired JWT behaviour.
- Client cannot access unrelated contract.
- Freelancer cannot alter client-owned contract terms.
- Acceptance binds to exact contract version.
- Material change requires renewed acceptance.
- Duplicate PayPal webhooks do not duplicate state changes.
- Invalid webhook signature is rejected.
- Browser cannot mark payment confirmed.
- AI verification cannot directly release payment.
- Duplicate evidence submission is handled safely.
- Database persistence survives refresh and a new login.
- Provider outage returns a safe, understandable response.

---

# 10. UX and visual design enhancements

## 10.1 Terminology

Use **Client** and **Freelancer** consistently across:

- Landing page.
- Sign-up and workspace selection.
- Dashboards.
- Project creation.
- Contract and acceptance pages.
- Application forms.
- Notifications and emails.
- Demo data and documentation.

A user may hold either role on different projects. Avoid permanently locking a user's role at sign-up.

## 10.2 Distinguish payment and delivery states

These are independent dimensions. A project can be paid but not delivered, or delivered and verified while a permitted payment action remains pending.

Suggested display:

| Payment | Delivery |
|---|---|
| Not initiated | Awaiting submission |
| Pending confirmation | In progress |
| Confirmed | Submitted for review |
| Failed/cancelled | Revision requested |
| Release eligible | Verified |
| Payout unavailable | Needs review |
| Payout completed | Completed, where the overall project is also complete |

Use explicit labels and icons, not colour alone.

## 10.3 Important interface states

Every major page should include:

- Loading state.
- Empty state with a useful next action.
- Validation errors.
- API/provider failure state.
- Permission-denied state.
- Expired-session state.
- Success confirmation tied to an actual backend response.
- Responsive mobile layout.

Do not show success toasts before the server confirms the operation.

---

# 11. Demo strategy: make the judges remember one complete story

## 11.1 Main video requirements

The official Devpost requirements say:

- Demo video must be **under three minutes**.
- It must show the application functioning on the device it was built for.
- It must be uploaded to YouTube and publicly accessible.
- The video URL must be included in the submission.
- Judges are not required to watch past the three-minute mark.
- Do not use third-party trademarks, copyrighted music or copyrighted material without permission.

Source: [PayPal AI Hackathon Devpost page](https://paypalaihackathon.devpost.com/).

Target **2:40–2:50**, leaving room for export/editing differences.

## 11.2 Recommended 2:45 storyboard

| Time | What to show | Message |
|---|---|---|
| 0:00–0:10 | Live TrustBroker landing page and project workflow | Informal freelance briefs create uncertainty about what counts as completed work |
| 0:10–0:35 | Client brief → AI questions → structured SOW | AI turns a vague brief into measurable deliverables and acceptance criteria |
| 0:35–0:50 | Freelancer application/selection and matching contract acceptance | Both parties agree to the same version before proceeding |
| 0:50–1:12 | Real PayPal sandbox checkout and backend-confirmed status | PayPal is part of the actual transaction workflow |
| 1:12–1:50 | Freelancer submission → criterion-level verification, including an incomplete criterion | AI assesses evidence against the pre-agreed requirements |
| 1:50–2:16 | Policy engine result, separate statuses and audit history | Deterministic rules, not the AI alone, control the next permitted action |
| 2:16–2:36 | AG Studio dashboard and useful agent/filter interaction | Operations teams can identify stalled work and payment exceptions |
| 2:36–2:45 | Brand and concise tagline | Clear agreements. Verifiable work. Transparent transactions. |

If the marketplace selection flow consumes too much time, show a prepared project with a real application already submitted. Do not sacrifice the evidence-verification sequence; it is the most memorable differentiator.

## 11.3 Suggested continuous narration

> When a client hires a freelancer remotely, one question can create a dispute: what exactly counts as completed work?
>
> TrustBroker AI helps prevent that uncertainty before work begins.
>
> A client describes the project in natural language. Our AI turns that brief into a structured agreement, including deliverables, milestones and measurable acceptance criteria.
>
> The freelancer reviews the agreement and both parties accept the same contract version.
>
> TrustBroker integrates PayPal sandbox checkout into this workflow and records payment status confirmed by the backend.
>
> When work is submitted, AI evaluates the available evidence against the requirements agreed at the beginning. It identifies what passes, what is incomplete and what needs further review.
>
> The backend policy engine checks the agreement, acceptance, payment and verification records before allowing the next permitted action. AI assists with decisions, but it does not independently control money.
>
> Our operations studio provides visibility into projects, milestones, verification outcomes and payment activity.
>
> TrustBroker AI: clear agreements, verifiable work, more transparent transactions.

Edit this script to match what the current application can genuinely demonstrate. If a feature is not implemented, remove the associated claim rather than faking it.

## 11.4 Recording guidance

- Record at 1920×1080, 16:9, 30 FPS where possible.
- Use OBS Studio or another stable screen recorder.
- Use a clean browser profile and dedicated demo accounts.
- Use a consistent browser zoom and hide irrelevant tabs/bookmarks.
- Rehearse the workflow before recording.
- Record screen actions first; record narration separately.
- Use clear captions and subtle zooms for important evidence/results.
- Avoid long logo animations, excessive transitions and distracting music.
- Never expose API keys, access tokens, personal account information or private customer data.
- Do not edit a fake success result into the video.

## 11.5 Optional second video

A 4–6 minute technical walkthrough can be linked from the README or project page. It can explain:

- React frontend and FastAPI architecture.
- AI provider adapter and structured output.
- Contract versioning and acceptance model.
- Policy engine.
- PayPal order/capture and webhook processing.
- Supabase data model and access controls.
- AG Studio integration.
- Test scenarios and failure handling.

This is supporting material; it does not replace the required under-three-minute public YouTube demo.

---

# 12. Impact evidence and market story

Judges assess potential impact, not just technical ambition. Make the problem specific and show why the solution addresses it.

## 12.1 Initial target audience

Focus first on:

- Small businesses commissioning digital services.
- Startups hiring independent professionals.
- Small agencies coordinating work with freelancers.
- Freelancers who want clearer scopes, acceptance criteria and traceable project outcomes.

Do not claim the product serves every industry equally well. Start with software/web work and expand into adjacent digital services once the evidence framework is credible.

## 12.2 Get real user feedback

Where feasible, ask a small number of real clients and freelancers about:

- How they currently define project scope.
- Whether deliverables and completion criteria are written down.
- What causes disagreements or revisions.
- How they document submitted work.
- What makes them comfortable progressing with payment.
- Whether a structured, jointly accepted agreement and evidence report would help.

Use real quotes only with permission. Identify them accurately and avoid presenting informal feedback as a statistically representative survey.

## 12.3 Strong impact narrative

A credible narrative is:

> TrustBroker targets the uncertainty between agreeing on digital work and deciding whether that work has been completed. It helps both parties define measurable expectations before work begins, then assesses submitted evidence against those expectations and preserves an auditable history.

Avoid unsupported claims about billions of dollars in freelance disputes, market size, fraud rates or guaranteed reductions in disputes. Use sourced statistics if you include any.

---

# 13. Project finish-up roadmap

As of 2 November 2026, the submission deadline is 12 November 2026 at 12:00 noon Pacific Standard Time. Harare is UTC+2 and Pacific Standard Time is UTC−8, so the deadline is **22:00 Harare time on Thursday, 12 November 2026**.

The schedule below is a recommended scope plan, not a claim that the work is already complete.

| Date | Objective | Deliverable / exit condition |
|---|---|---|
| Nov 2–3 | Freeze scope and fix critical integrity issues | One agreed demo journey; no fake auth/payment/verification success in real mode |
| Nov 4 | Authentication and persistence verification | Clean signup/login, protected data, real database records |
| Nov 5 | Agreement and marketplace flow | Client brief, SOW, freelancer application/selection, mutual acceptance |
| Nov 6 | PayPal sandbox and backend events | Server-created order, confirmed capture, webhook verification and idempotency tests |
| Nov 7 | Evidence verification and policy engine | Pass, fail/incomplete and needs-review examples; saved reports; safe next-action rules |
| Nov 8 | AG Studio and usability | One valuable, interactive operations dashboard; rehearse complete flow |
| Nov 9 | Record and edit primary video | Final video comfortably below 3 minutes |
| Nov 10 | Submission page and documentation | README, public repository, licence, demo URL, YouTube video, tools list |
| Nov 11 | Clean-room testing and submission review | Fresh-browser test, setup test, links and credentials checked |
| Nov 12 | Submit early | Do not leave the submission to the final hour |

## 13.1 Feature freeze rule

After the planned feature freeze, only fix defects that block the demo, create security or payment-integrity risks, or violate the official submission requirements. Do not add new integrations because they look impressive on a roadmap.

---

# 14. Pre-submission release checklist

## Product and workflow

- [ ] The landing page explains the product in plain language.
- [ ] Client and Freelancer terminology is consistent.
- [ ] A user can switch primary workspace/role context without global role locking.
- [ ] The client can create a project and save a structured SOW.
- [ ] The SOW has scope, exclusions, milestones and testable acceptance criteria.
- [ ] A freelancer can apply or be invited.
- [ ] The client can select a freelancer.
- [ ] Both parties accept the exact same contract version.
- [ ] Contract revisions preserve version history.

## AI

- [ ] AI requests run through FastAPI, not directly from the browser with an exposed key.
- [ ] Groq/OpenRouter configuration matches actual code.
- [ ] Provider fallback is bounded and tested.
- [ ] AI output is validated by Pydantic or equivalent schemas.
- [ ] Verification reports map to accepted criteria.
- [ ] There is a real incomplete or needs-review scenario.
- [ ] Uploaded content and URLs are treated as untrusted.
- [ ] The AI cannot execute payment actions or override policy checks.

## PayPal

- [ ] PayPal sandbox order creation works server-side.
- [ ] Capture/order status is verified server-side.
- [ ] Cancelled and failed transactions are not shown as paid.
- [ ] Webhook signature verification works.
- [ ] Duplicate webhook events do not duplicate state changes.
- [ ] Provider references and events are persisted.
- [ ] Payout limitations are explained accurately.
- [ ] No normal capture is described as escrow.
- [ ] No unsupported Zimbabwe payout promise is made.

## Security and data

- [ ] Supabase Auth works in a clean browser session.
- [ ] FastAPI validates JWTs.
- [ ] RLS and API permissions protect contract membership.
- [ ] Private file storage uses safe access controls and short-lived links.
- [ ] No secrets appear in the frontend bundle or Git history.
- [ ] No public demo account exposes real data.
- [ ] Audit history records meaningful events.
- [ ] Database changes are handled by migrations.

## AG Studio

- [ ] AG Studio is genuinely integrated, not represented by static screenshots.
- [ ] Data comes from the application or clearly labelled fixture data.
- [ ] Dashboard visualisations answer useful operational questions.
- [ ] At least one interaction/cross-filter is demonstrated.
- [ ] Agent capability, if claimed, performs a real constrained action.
- [ ] Agent actions are read-only for the MVP.
- [ ] AG Studio use is described accurately in the submission.

## Deployment and documentation

- [ ] Frontend and backend URLs are correct and consistent.
- [ ] CORS includes the real frontend domain only as required.
- [ ] Supabase redirect and allowed URLs are current.
- [ ] Environment templates match the code.
- [ ] Node/Python requirements are consistent.
- [ ] README setup works from a fresh clone.
- [ ] Migrations and seeds are documented accurately.
- [ ] OpenAPI and Postman collection are useful and current.
- [ ] Repository is public and has a visible open-source licence.
- [ ] Demo instructions and disposable credentials are clear.

## Video and Devpost

- [ ] Main video is under three minutes.
- [ ] Video is public on YouTube.
- [ ] Video shows the actual application working on its intended device.
- [ ] Video includes an end-to-end project workflow.
- [ ] Video demonstrates a meaningful verification result.
- [ ] Video demonstrates PayPal sandbox integration accurately.
- [ ] No unsupported escrow/payout statement is made.
- [ ] No secrets or private customer data appear.
- [ ] Project description clearly identifies problem, target users and solution.
- [ ] Tools are listed with their actual contribution.
- [ ] Live demo and public repository links work.
- [ ] Submission is completed before the deadline.

---

# 15. Recommended Devpost positioning

## Project title

**TrustBroker AI — Evidence-Based Agreements and Payment Coordination for Freelance Work**

## Short description

AI turns digital-service project briefs into measurable, mutually accepted agreements, assesses submitted work against agreed requirements and coordinates PayPal-powered transaction workflows with transparent records.

## Problem

Clients and freelancers often begin work with informal briefs, incomplete scope definitions and subjective expectations about what “done” means. This creates avoidable uncertainty around deliverables, revisions, acceptance and payment progression.

## Solution

TrustBroker AI helps clients and freelancers create structured agreements, accept the same version, submit delivery evidence and assess that evidence against agreed criteria. A backend policy engine controls permitted workflow transitions, while PayPal sandbox integration demonstrates the related payment workflow. The platform preserves an auditable history.

## Innovation

The distinctive part is the connection between contract criteria, evidence-level AI assessment and transaction-state coordination. TrustBroker does not merely generate project documents or summarise submitted work; it links the pre-agreed requirements to the evidence assessed later.

## Tools and technologies

List only technologies genuinely used in the submitted build. For each tool, state what it does:

- Groq / OpenRouter: actual AI inference and fallback, if implemented.
- FastAPI: backend APIs and deterministic workflow policy.
- Supabase: authentication, database and private storage, if implemented.
- PayPal Developer Platform: sandbox checkout, verified payment events and supported operations.
- AG Grid / AG Studio: interactive transaction analysis and operations dashboard, if implemented.
- Render: hosted frontend/backend, as applicable.

---

# 16. Decisions to preserve and decisions to defer

## Preserve

- React + TypeScript frontend and FastAPI backend direction.
- Supabase authentication/database/storage direction, if current deployment uses it.
- Groq primary and OpenRouter fallback architecture, if current implementation supports it.
- Client/Freelancer terminology.
- Primary workspace selection at signup, with the ability to change context later.
- Contract versioning and mutual acceptance.
- Criterion-level evidence assessment.
- Deterministic backend policy engine.
- Separate payment and delivery states.
- Real PayPal sandbox verification.
- An operationally useful AG Studio dashboard.

## Defer

- KERNEL live-site browsing until secure isolation is justified.
- Bryntum Gantt until real users demonstrate a scheduling need.
- Complex freelancer ranking and automated hiring.
- Social feeds, broad messaging and subscriptions.
- Multi-provider payment routing.
- Claims of universal escrow or Zimbabwe PayPal payouts.
- Advanced agent actions that can change contracts or move money.

The best version of this hackathon project is not the version with the most integrations. It is the version with the smallest number of integrations working together convincingly.

---

# 17. Official sources and useful references

The following official references were consulted when preparing the current hackathon, AG Studio and PayPal guidance. Recheck them before submission if the provider publishes changes.

## PayPal AI Hackathon

- [Official rules](https://paypalaihackathon.devpost.com/rules)
- [Hackathon page and submission requirements](https://paypalaihackathon.devpost.com/)
- [Schedule and deadline](https://paypalaihackathon.devpost.com/details/dates)
- [FAQ](https://paypalaihackathon.devpost.com/details/faqs)
- [PayPal developer blog: Hackathon announcement](https://developer.paypal.com/community/blog/PayPal_AI_Hackathon/)

## PayPal payments and eligibility

- [Delayed disbursement](https://developer.paypal.com/platforms/checkout/delayed-disbursement/)
- [Seller onboarding and country eligibility](https://developer.paypal.com/platforms/seller-onboarding)
- [Payouts supported countries and features](https://developer.paypal.com/payouts/supported-features/)
- [PayPal Orders: authorize and capture](https://developer.paypal.com/platforms/checkout/standard/customize/auth-capture/)

## AG Studio

- [AG Studio roadmap](https://www.ag-grid.com/studio/roadmap/)
- [AG Studio Agent Framework](https://www.ag-grid.com/blog/introducing-the-ag-studio-agent-framework/)
- [AG Studio React custom widgets](https://ag-grid.com/studio/react/custom-widgets/)

## Project repository and application

- [TrustBroker AI GitHub repository](https://github.com/brianproducedit/trustbroker_ai)
- [TrustBroker AI frontend](https://trustbroker-ai.onrender.com)

---

# Final recommendation

Do not redesign TrustBroker AI again. Keep the marketplace as the route that brings clients and freelancers together, but make the agreement-to-evidence-to-transaction workflow the product's defining feature.

The next milestone is a single, repeatable, fully auditable demonstration:

**Client creates a project → AI drafts the agreement → freelancer applies and is selected → both accept the same version → PayPal sandbox payment is confirmed → freelancer submits evidence → AI identifies an incomplete criterion → freelancer corrects it → verification is saved → backend determines the next permitted payment state → activity history proves what happened.**

Add the AG Studio operations experience as a second visible strength: it should help a real operator understand stalled projects, verification queues and payment exceptions.

If those parts work reliably, are presented honestly and are demonstrated clearly in under three minutes, TrustBroker AI will have a much stronger hackathon submission than a broader collection of half-finished features.
