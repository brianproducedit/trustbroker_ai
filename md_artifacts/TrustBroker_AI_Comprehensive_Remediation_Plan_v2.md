# TrustBroker AI — Comprehensive Remediation & Verification Plan (v2)

**Supersedes:** `TrustBroker_AI_P0_Remediation_Workplan.md`  
**Source reviewed:** uploaded `trustbroker_ai-main.zip` snapshot (repository archive dated 6 November 2026)  
**Purpose:** Close every material issue identified in the code audit, plus several related defects confirmed during the completeness check.  
**Status:** This is an implementation specification. It does **not** mean the source code, database, deployment or GitHub repository has already been changed.

---

## 0. Executive conclusion

The previous P0 workplan covered the eight main engineering areas from the audit: authentication, PayPal capture, webhooks, payouts/policy, verification, file uploads, refund/reclaim and CI. It was a strong starting point, but it was **not complete enough to serve as the single final remediation specification**.

This v2 adds missing tasks for:

1. Unsafe Alembic migration recovery and startup error suppression.
2. Production demo-data seeding and overwriting of seeded profiles.
3. Verification jobs that can remain queued/verifying after a background failure.
4. Server-side request forgery (SSRF) exposure in the live-URL probe.
5. Contract completion being marked before all milestones are financially settled.
6. Confusing release-eligibility, client authorization, payout processing and payout success states.
7. README, route, judge-demo and submission-copy contradictions.
8. Deployment configuration, demo-user and PayPal recipient claims that must be checked before a judge-facing release.
9. A single end-to-end acceptance gate that proves the fixes work together, not just as isolated unit tests.

**Recommended rule:** do not add new marketplace or dashboard features until the security, payment-state and evidence-integrity workstreams below are complete.

### What this plan means by “solved”

An issue is solved only when all four conditions are met:

- The unsafe or misleading code path has been changed.
- A regression test proves the old failure mode is blocked.
- The relevant user interface and documentation report the resulting state accurately.
- The deployed environment is configured consistently with the tested behaviour.

A code edit alone is not completion. A passing mock test alone is not proof of live PayPal, Supabase or AI-provider behaviour.

---

## 1. Complete issue-coverage register

This table explicitly maps every finding from the previous audit to a remediation section in this document.

| ID | Finding from the audit / follow-up review | Required remediation |
|---|---|---|
| R01 | `dev-user-*` backend token bypass is not restricted to development | Workstream A |
| R02 | Frontend can fall back to development personas after Supabase sign-in failure; weak demo passwords are accepted | Workstream A |
| R03 | PayPal capture errors can be converted into fabricated `COMPLETED` captures and synthetic capture IDs | Workstream B |
| R04 | Duplicate milestone orders can be created, including concurrent requests; checkout-created state is not treated as an active attempt | Workstream B |
| R05 | Webhook verification accepts all events when `PAYPAL_WEBHOOK_ID` is missing | Workstream C |
| R06 | Webhook capture processing does not fully reconcile order/capture identity, amount and currency | Workstream C |
| R07 | Payout API errors can become fabricated successful payout batches; pending statuses can be promoted to success | Workstream D |
| R08 | Payout policy accepts submitted work or lets `RELEASE_AUTHORIZED` bypass verification | Workstream D |
| R09 | Sandbox payout fallback invents a receiver email if none is configured | Workstream D |
| R10 | AI verification adapters can pass evidence they could not actually inspect | Workstream E |
| R11 | `evaluate_delivery_against_criteria()` can pass criteria from description length, a link or filenames alone | Workstream E |
| R12 | Orchestrator leaves `llm_eval` as `None` and invents a default model label when no model ran | Workstream E |
| R13 | Browser `blob:` URLs are persisted as file storage paths instead of uploading file bytes | Workstream F |
| R14 | Reclaim endpoint changes internal ledger only, yet reports `refunded`; it accepts uncaptured checkout state | Workstream G |
| R15 | Seven-day reclaim/auto-release language is not enforced by backend time checks or a durable scheduler | Workstream G |
| R16 | Background verification exception can leave a submission in verifying/queued state without a terminal result | Workstream H |
| R17 | `start.py` stamps Alembic to `head` after migration failure, can hide missing migrations | Workstream I |
| R18 | Migration/startup paths swallow errors; both `start.py` and FastAPI lifespan perform schema work | Workstream I |
| R19 | Production startup runs demo seeding and can overwrite fields on existing demo-email profiles | Workstream I |
| R20 | CI only type-checks/builds the frontend and does not run backend tests | Workstream J |
| R21 | README/Judge Demo refer to routes that do not exist and omit the actual verification-status route | Workstream K |
| R22 | README and demo materials overstate escrow, instant payouts, no mock fallbacks and AI verification capability | Workstream K |
| R23 | Public README says Node 18+ while root `package.json` requires Node 20+ | Workstream K |
| R24 | The project can mark a contract `COMPLETED` when every milestone is only `VERIFIED`, before payouts are settled | Workstream L |
| R25 | `release_eligible` is conflated with `RELEASE_AUTHORIZED`; AI verification currently sets the latter before the client acts | Workstream L |
| R26 | User-supplied live URLs are probed by the backend without sufficient SSRF controls or redirect revalidation | Workstream M |
| R27 | Generic GitLab/Bitbucket URL patterns can be marked as existing/passing without an actual repository check | Workstream E |
| R28 | Judge/demo account and production configuration claims need to match actual Supabase Auth and PayPal sandbox setup | Workstream N |
| R29 | CORS allows every `*.onrender.com` origin and the global exception handler reflects arbitrary request origins with credentials | Workstream N |
| R30 | Startup seed data contains pre-populated staged/released totals and historical payment/audit claims that can be mistaken for real PayPal transactions | Workstreams I, K and N |

**Coverage result:** v2 explicitly addresses all 28 items above. Some items are separate from the original P0 defects but are necessary to make the resulting system coherent and safe.

---

# Workstream A — Authentication and identity integrity

**Priority:** P0 — do first.  
**Primary files:**

- `backend/app/config.py`
- `backend/app/utils/security.py`
- `react_app/src/hooks/useAuthStore.ts`
- `react_app/src/lib/api.ts`
- `react_app/src/hooks/useContractStore.ts`
- `.env.example`
- `backend/.env.example`
- `render.yaml`
- auth-related tests in `backend/tests/`

### Current defects

`decode_supabase_jwt()` accepts a token beginning with `dev-user-` and maps it to fixed demo-user IDs without checking `settings.environment`. The frontend also has `signInWithDevRole()` and fallback branches after Supabase errors. Demo sign-in accepts `password123` and `demo123` in addition to the configured demo password.

The Render blueprint sets `ENVIRONMENT=production`, but that does not currently disable the backend token bypass because the bypass does not inspect the environment.

### Required implementation

1. Add an explicit setting such as `allow_dev_auth_tokens: bool = False`. Production must override this setting: development tokens are rejected whenever `ENVIRONMENT=production`, even if a flag is accidentally enabled.
2. Permit a `dev-user-client` or `dev-user-freelancer` token only for local development/test environments and only when the feature flag is explicitly enabled.
3. Reject unknown `dev-user-*` values. Do not map arbitrary suffixes to the freelancer identity.
4. Keep Supabase JWT cryptographic verification as the only hosted authentication path. Preserve signature, expiry, algorithm and subject checks. Confirm that the JWT audience/issuer settings match the actual Supabase project configuration rather than disabling relevant checks without a documented reason.
5. Gate all frontend demo-token generation behind a build-time development flag. Set it to false for hosted builds. A Supabase outage, rejected password or expired session must show an authentication error; it must not silently create a client/freelancer session.
6. Remove `password123` and `demo123` aliases. Demo users should authenticate through actual seeded Supabase Auth accounts with a unique, documented demo password, or the demo login should be disabled.
7. Verify that workspace switching changes the UI workspace only. It must never change the identity, user ID or backend authorization role.
8. Validate required production configuration at startup. A production backend must not start with an unsafe default environment or missing authentication configuration.
9. Review `get_optional_current_user()`: on endpoints where an Authorization header is supplied but invalid, do not silently downgrade an invalid credential to anonymous access unless that behaviour is explicitly intended and tested. Public unauthenticated access and invalid authenticated access should be distinguishable.

### Acceptance tests

- Production rejects both known development tokens and arbitrary `dev-user-*` strings.
- Development accepts only the two explicit local demo identities when the local flag is enabled.
- Production Supabase sign-in failure never produces a local demo session.
- Invalid/expired JWTs return 401; valid Supabase JWTs resolve the correct profile.
- Client cannot invoke freelancer-only operations by changing a workspace selector; freelancer cannot invoke client-only actions.
- Browser local storage manipulation cannot create server-side identity or authorization.
- CI includes tests for these cases.

**Completion gate:** no hosted API request can authenticate through a fabricated token or frontend-only persona.

---

# Workstream B — PayPal Orders and capture: provider truth only

**Priority:** P0.  
**Primary files:**

- `backend/app/services/payment_service.py`
- `backend/app/utils/paypal_client.py`
- `backend/app/services/policy_engine.py`
- `backend/app/models/payment.py`
- `backend/app/models/milestone.py`
- `backend/app/schemas/payment.py`
- `backend/alembic/versions/` (if adding columns/constraints)
- `backend/tests/test_phase4_paypal.py`
- `backend/tests/test_e2e_lifecycle.py`

### Current defects

`capture_milestone_escrow_payment()` converts several PayPal errors, including `ORDER_NOT_APPROVED`, `INSTRUMENT_DECLINED`, HTTP 422 and `ORDER_ALREADY_CAPTURED`, into a synthetic capture object with `status=COMPLETED` and an invented `SANDBOX-CAP-*` ID. That response can reach `_mark_milestone_funded()`.

`create_milestone_escrow_order()` also creates a new external PayPal order before it records the local `PaymentAttempt`. `CHECKOUT_CREATED` is not treated as an existing active attempt by the policy or `_next_unfunded_milestone()` helper. Repeated or concurrent clicks can create multiple live orders.

### Required implementation

1. Remove every fallback that invents a successful capture response, PayPal capture ID, payer or capture status.
2. Only mark an attempt funded when a real PayPal response or verified webhook/reconciliation confirms:
   - capture status is exactly `COMPLETED`;
   - capture ID exists and is a provider-issued ID;
   - order ID relates to the stored attempt;
   - amount and currency exactly match the stored milestone/payment attempt;
   - the capture has not already been applied to another attempt or milestone.
3. Add `GET /v2/checkout/orders/{order_id}` to `paypal_client.py` for reconciliation. If capture reports already captured or a state conflict, fetch the real order and inspect its actual purchase unit/capture. Do not synthesize an ID.
4. Treat not-approved, declined, pending, cancelled, unknown and ambiguous outcomes as not-funded. Persist the provider status and a safe error code for support/debugging.
5. Introduce an idempotent create-order key for each milestone funding attempt. Use PayPal `PayPal-Request-Id` support where appropriate and persist the key before or atomically with the request workflow.
6. Serialize order creation per milestone. Use a database transaction and row lock/advisory lock or an equivalent concurrency-safe mechanism. Add a uniqueness rule for one nonterminal funding attempt per milestone if the schema can support it. Do not rely only on a frontend disabled button.
7. If an existing nonexpired `CHECKOUT_CREATED` attempt exists, return/reconcile it rather than creating another order. Define when it expires and how the previous PayPal order is voided or reconciled before replacement.
8. Handle the case where PayPal creates an order but the database commit fails. Use the idempotency key to recover the existing provider order or mark the attempt for reconciliation; do not silently create an untracked second order.
9. Make `_mark_milestone_funded()` idempotent at both the attempt and milestone/contract aggregate levels. Duplicate capture calls/events must not add staged totals twice.
10. Ensure a checkout-created milestone cannot be selected as a new unfunded milestone for a different active order.

### Acceptance tests

- Genuine completed capture with real ID, matching order, amount and currency → funded exactly once.
- `ORDER_NOT_APPROVED`, `INSTRUMENT_DECLINED`, 422 or unknown capture response → never funded.
- `ORDER_ALREADY_CAPTURED` → fetch real order and accept only its matching actual completed capture.
- Missing capture ID, amount mismatch, currency mismatch or wrong order reference → not funded.
- Repeated and concurrent create-order calls for one milestone produce one active provider order.
- Database failure after order creation is recoverable by idempotency/reconciliation without a second live order.
- Repeated capture/webhook events do not double-increment `contract.staged_amount`.

**Completion gate:** there is no code path that can convert a failed/ambiguous PayPal capture into a funded milestone.

---

# Workstream C — PayPal webhooks: fail closed, validate and reconcile

**Priority:** P0.  
**Primary files:**

- `backend/app/utils/paypal_client.py` — `verify_webhook_signature()`
- `backend/app/services/payment_service.py` — `process_paypal_webhook()`
- `backend/app/routers/payments.py`
- `backend/app/models/payment.py` — `ProviderEvent`
- `render.yaml`
- `.env.example`, `backend/.env.example`
- `backend/tests/test_phase4_paypal.py`

### Current defects

`verify_webhook_signature()` returns `True` when `PAYPAL_WEBHOOK_ID` is missing. Webhook processing then locates an attempt by order/capture references but does not verify that the event resource amount and currency match the stored attempt before funding it. `CHECKOUT.ORDER.COMPLETED` and `PAYMENT.CAPTURE.COMPLETED` also have different resource shapes and should not be treated as interchangeable without reconciliation.

### Required implementation

1. Remove the `if not settings.paypal_webhook_id: return True` path. In production, missing ID/configuration is a startup/configuration error and webhook verification returns false.
2. Require the relevant PayPal transmission headers and call PayPal signature verification with the configured webhook ID.
3. Validate event ID, event type, resource ID, related order ID, capture ID, amount, currency and associated local attempt before changing state.
4. Process `PAYMENT.CAPTURE.COMPLETED` only after confirming the capture resource is actually `COMPLETED` and matches an existing attempt.
5. For `CHECKOUT.ORDER.COMPLETED`, retrieve the order/capture and reconcile it; do not store the order resource ID as though it were necessarily a capture ID.
6. Treat capture denied, reversed, refunded and voided events according to their actual event resource and current local state. Do not turn an unrelated resource into a cancellation/refund of the found attempt.
7. For payout events, reconcile the batch/item IDs and `sender_item_id` against the stored payout and map provider statuses explicitly. Unknown/unexpected status must be nonterminal or flagged for review, never treated as success by string passthrough.
8. Keep `ProviderEvent.event_id` idempotency, but make the processing transaction robust: a valid event should be recorded as received, then processed exactly once; failed processing should remain retryable and visible, not permanently marked complete.
9. Store valid unknown events for audit without applying financial state changes.
10. Add structured logs without exposing secrets, full card details, webhook signing material or sensitive personal information.

### Acceptance tests

- Missing webhook ID in production → rejected/verification false.
- Missing headers or invalid signature → rejected.
- Valid signature + matching resource/order/amount/currency → processed exactly once.
- Valid signature but mismatched amount/currency/IDs → no payment transition; alert/audit outcome.
- Duplicate event ID → no duplicated totals or actions.
- `CHECKOUT.ORDER.COMPLETED` is reconciled to the actual capture.
- Unknown event/status is recorded but does not advance financial state.
- Payout success webhook changes state only when it matches the stored payout item/batch.

**Completion gate:** an unsigned, mismatched or replayed webhook cannot create or finalize a financial event.

---

# Workstream D — Payouts and milestone policy: no synthetic disbursements

**Priority:** P0.  
**Primary files:**

- `backend/app/services/payment_service.py`
- `backend/app/services/policy_engine.py`
- `backend/app/utils/paypal_client.py`
- `backend/app/models/marketplace.py`
- `backend/app/models/milestone.py`
- `backend/app/routers/payments.py`
- `react_app/src/pages/DeliveryVerification.tsx`
- client/freelancer payout and earnings components
- payout-related tests

### Current defects

`release_milestone_payout()` fabricates `SANDBOX-BATCH-*` and `SANDBOX-ITEM-*` identifiers and a `SUCCESS` result for selected sandbox API errors. It also converts `PENDING`, `PROCESSING` and `SUBMITTED` to `SUCCESS` in sandbox mode. `_apply_payout_status()` then marks the milestone released/settled.

If a freelancer payout email is missing, the service creates a fallback recipient address and writes it to the profile. The payout policy allows `SUBMITTED` milestones and permits `RELEASE_AUTHORIZED` to bypass milestone verification state.

### Required implementation

1. Remove every synthetic payout batch ID, item ID and success payload.
2. Remove all conversions of `PENDING`, `PROCESSING` or `SUBMITTED` into `SUCCESS`.
3. A successful Payouts API submission normally means the request was accepted, not necessarily that the recipient received funds. Store provider-reported batch/item state exactly and reconcile later.
4. Only a provider-confirmed successful payout item (`transaction_status=SUCCESS` from a verified response/reconciliation or signed webhook) may make the local payout `SUCCESS` and milestone `RELEASED/SETTLED`.
5. Map statuses explicitly: pending/processing/submitted → processing; unclaimed → unclaimed; failed/denied/returned/canceled → correct non-success state; unknown → needs reconciliation. Do not let unknown strings silently become success.
6. Never invent a freelancer payout email. Require the freelancer to configure a valid recipient address and show a clear blocking message if absent. Demo recipient addresses must be deliberately configured test-account values, not automatic fallbacks.
7. Preserve the existing `PayPal-Request-Id` idempotency key, but ensure concurrent requests cannot create duplicate local payout records or duplicate external payout requests. Add a transactional lock/unique constraint if necessary.
8. If a payout request fails, store a failed/retryable state and safe failure reason. Retrying must reuse the correct idempotency key or follow a documented PayPal retry strategy.
9. Notify the freelancer “payout submitted/processing” when the provider has only accepted a batch. Notify “payout completed” only after confirmed success.
10. Avoid describing this Orders + Payouts flow as escrow. A captured payment and a later Payouts transfer are not the same as a legally/provider-supported escrow product. Use “PayPal sandbox payment coordination” or “payment staging” unless a specifically approved escrow product is actually integrated.

### Policy correction

Refactor `PolicyEngine.can_release_payout()` so it requires:

- authenticated caller is the contract client;
- milestone belongs to the contract and is currently `VERIFIED`;
- milestone has a genuinely completed capture (`STAGED_IN_SANDBOX` or the explicitly modelled eligible state);
- milestone is not `REVISION_REQUESTED`, canceled, settled or already released;
- a valid assigned freelancer and configured payout destination exist;
- amount/currency and provider transaction references match the staged payment.

`SUBMITTED` must not be accepted as verified. `RELEASE_AUTHORIZED` must not bypass verification. Human approval should be written as a separate auditable review decision and should explicitly move the work state to `VERIFIED` only after a client review action with a required rationale.

### Acceptance tests

- Verified + real staged payment + client + configured recipient → payout request can be submitted.
- Submitted-but-not-verified milestone → blocked.
- Revision-requested milestone → blocked, including if stale payment state says release-authorized.
- Freelancer/unrelated account → blocked.
- Missing payout recipient → blocked with no database-invented email.
- Provider returns pending/processing → not released.
- Provider returns an error → failed/retryable; not released.
- Verified successful payout item → released once.
- Duplicate release requests/webhooks → no second disbursement and no double aggregate updates.

**Completion gate:** no milestone is marked released based on a synthetic, pending or unverified payout result.

---

# Workstream E — Verification engine: evidence-based decisions only

**Priority:** P0.  
**Primary files:**

- `backend/app/services/verification/adapters/vision.py`
- `backend/app/services/verification/adapters/repo_meta.py`
- `backend/app/services/verification/adapters/http_probe.py`
- `backend/app/services/verification/adapters/document.py`
- `backend/app/services/verification/adapters/zip_listing.py`
- `backend/app/services/verification/orchestrator.py`
- `backend/app/services/verification/scoring.py`
- `backend/app/services/ai_provider.py` — `evaluate_delivery_against_criteria()`
- `backend/app/services/verification/safety.py`
- `backend/tests/test_phase5_verification.py`
- `backend/tests/test_e2e_lifecycle.py`

### Current defects

- Vision fallback can return `passed=True` when a vision provider is unavailable or the image cannot be inspected.
- GitHub 403/rate limit and network exception fallbacks return `exists=True` and `passed=True` with assumed files.
- Non-GitHub GitLab/Bitbucket URL patterns can be returned as existing/passing without actually fetching or inspecting a repository.
- HTTP probe treats selected 401/403/429 bot-protection responses as passed. A CDN challenge is not proof that a requested feature works.
- Text fallback passes a criterion if the description exceeds 30 characters.
- `evaluate_delivery_against_criteria()` can set every criterion to passed when any substantial-looking description, URL or filename is present.
- Orchestrator leaves `llm_eval=None` and therefore does not use the existing criterion-level evaluator in this path.
- The orchestrator defaults `model_used` to `groq-qwen-3.8-27b` even when no model actually ran.
- Live URL reachability, repository existence and ZIP structure are sometimes treated as proof of a higher-level functional requirement.

### Required common result contract

Every adapter must return a normalized state, not just an ambiguous boolean:

- `PASS`: evidence was actually inspected and the objective requirement was met.
- `FAIL`: evidence was actually inspected and it demonstrated a required condition was not met.
- `NEEDS_REVIEW`: provider unavailable, timeout, rate limit, inaccessible file, bot challenge, ambiguous result, insufficient evidence or criterion beyond the adapter's scope.

An adapter exception, missing evidence object or absent result must never default to PASS. The scoring engine must preserve `NEEDS_REVIEW` as a separate status.

### Adapter-specific changes

1. **Vision:** read actual uploaded bytes from private storage. Missing image bytes, provider quota, unsupported image, parse failure or model error → `NEEDS_REVIEW`. Never use a heuristic that assumes the screenshot satisfies the criterion.
2. **Repository metadata:** a 404 can fail only a criterion explicitly requiring a publicly accessible repository. 403/rate limit/timeout → `NEEDS_REVIEW`. Repository existence may satisfy only a repository-existence criterion; it cannot prove code quality, a working feature, successful tests or deployment behaviour. Do not pass GitLab/Bitbucket URLs unless an adapter actually inspects them.
3. **HTTP probe:** 2xx/3xx proves only reachability. 404/5xx may fail a public availability criterion. 401/403/429 and edge challenges → `NEEDS_REVIEW`. A homepage returning 200 cannot prove a feature works; use criterion-specific checks or manual review.
4. **Document adapter:** successful extraction may establish that a file is readable and may provide text to AI assessment. Empty extraction, corrupted/password-protected files or unavailable file → `NEEDS_REVIEW`; do not pass based only on the filename.
5. **ZIP adapter:** archive safety and structure inspection can establish that a valid archive exists and identify entries. It cannot establish that source code runs or satisfies a feature criterion unless actual, bounded static checks support that conclusion. Do not execute uploaded code in the FastAPI process.
6. **Text attestation:** length is not evidence of completion. Treat free text as the freelancer's claim/context, not proof. Use AI/human assessment with supporting artifacts or mark `NEEDS_REVIEW`.
7. **Video links:** remain `NEEDS_REVIEW` unless a safe, explicitly supported video inspection workflow exists; otherwise say human playback is required.

### AI evaluator and orchestrator integration

1. Remove the deterministic “any evidence exists, therefore all criteria pass” fallback in `evaluate_delivery_against_criteria()`.
2. If all AI providers are unavailable, return explicit provider-unavailable/needs-review outcomes. It is acceptable to deterministically verify narrow facts (HTTP status, file existence, ZIP entry presence), but not semantic project completion.
3. Actually call the evaluator from the orchestrator when adequate evidence content is available. Supply criterion, requirement text, extracted evidence and factual adapter results.
4. Do not claim that an LLM inspected screenshots/documents unless the actual bytes/content were supplied to that model.
5. Validate returned JSON against a strict schema and reject missing criterion IDs, unsupported statuses, out-of-range scores or fabricated evidence citations.
6. Require each AI criterion result to cite a specific submitted item and a short supporting excerpt/observation. A URL or filename alone is not a content citation.
7. Record the actual provider/model used for each report. If no AI provider ran, record `none`, `unavailable` or a deterministic adapter name; never invent a model label.
8. Consider prompt injection in README, source files, documents and screenshots. Treat all uploaded content as untrusted data, not as instructions to the verification system. Do not execute code, scripts, macros or package lifecycle commands from submissions.
9. The scoring engine must check `NEEDS_REVIEW` before any generic adapter-pass logic. Any mandatory criterion in `NEEDS_REVIEW` prevents automatic overall PASS.
10. AI `PASS` is advisory evidence assessment. Human client review remains available and must be recorded separately; AI cannot call payout functions or authorize money.

### Acceptance tests

- Vision provider unavailable or image unreadable → `NEEDS_REVIEW`.
- GitHub 403/429/timeout → `NEEDS_REVIEW`; unsupported GitLab/Bitbucket URL → `NEEDS_REVIEW`, not assumed pass.
- HTTP 403/429 challenge → `NEEDS_REVIEW`; 200 homepage alone does not pass a functional criterion.
- Long text submission without supporting evidence → `NEEDS_REVIEW`.
- AI provider unavailable → no synthetic pass and no fake model name.
- LLM response with missing criterion, invalid status, fabricated citation or invalid score is rejected or sent to review.
- `NEEDS_REVIEW` criterion blocks automatic overall pass.
- No evidence adapter executes user-supplied code.
- Human override has authenticated client, reason, timestamp, evidence/report reference and audit event.

**Completion gate:** no inability to inspect evidence, URL syntax, filename or arbitrary text can turn into a positive automated verification result.

---

# Workstream F — Real, private delivery evidence uploads

**Priority:** P0 for any claim of actual file-based/multimodal verification.  
**Primary files:**

- `react_app/src/pages/DeliveryVerification.tsx`
- `react_app/src/hooks/useContractStore.ts`
- `react_app/src/lib/api.ts`
- `backend/app/utils/supabase_client.py`
- `backend/app/config.py`
- `backend/app/routers/deliveries.py`
- `backend/app/services/delivery_service.py`
- `backend/app/models/delivery.py`
- `backend/app/schemas/delivery.py`
- `backend/app/services/verification/orchestrator.py`
- `backend/app/services/verification/safety.py`
- Supabase Storage bucket and access policies in setup SQL files

### Current defect

`DeliveryVerification.tsx` uses `URL.createObjectURL(file)` and passes the resulting browser-local `blob:` URL through Zustand as `storage_path`. Those URLs are scoped to the browser and cannot be fetched later by FastAPI or a different client browser. A helper `get_signed_upload_url()` exists in `supabase_client.py`, but the upload workflow does not use it.

### Required implementation

1. Create/use a private Supabase Storage bucket for evidence (for example `delivery-evidence`).
2. Add an authenticated API endpoint that issues signed upload credentials only after verifying the requesting user is the assigned freelancer on that active contract/milestone.
3. Generate the storage object path on the server, scoped by user, contract, milestone and a random ID. Do not accept arbitrary user-supplied object paths.
4. Validate filename, allowed extension, claimed MIME type, actual content signature where feasible, maximum per-file size and maximum total submission size. Reject MIME/extension mismatches.
5. Upload the actual browser `File` bytes directly to Supabase Storage using the signed upload response. Never save a `blob:` URL as `storage_path`.
6. Persist only storage key, sanitized original filename, actual content type, byte size, checksum (if implemented), owner and upload timestamp.
7. Before a delivery is accepted, confirm that each referenced object exists and belongs to that user's allowed contract/milestone scope.
8. Backend verification adapters must fetch bytes from private storage through a server-side helper. The service-role key must never be sent to the browser.
9. Clients and assigned freelancers can receive short-lived signed download URLs only after contract-party authorization. Unrelated users cannot enumerate or read the objects.
10. Ensure evidence object paths and metadata are immutable once attached to a submitted delivery. A resubmission should create a new delivery/evidence version, not silently replace evidence from an earlier assessment.
11. Add safe file handling: no executing uploaded code, no opening archives with path traversal, enforce decompression limits and consider malware scanning if a suitable no-cost mechanism is available. Do not claim antivirus scanning if none exists.

### Acceptance tests

- Upload succeeds and object remains after page reload, logout and login.
- Database contains a storage key, never a `blob:` URL.
- Authorized client/freelancer can read through a signed URL; an unrelated user cannot.
- Missing/expired object cannot be treated as verified evidence.
- File size, total size, extension, MIME mismatch and path traversal are rejected.
- Verification adapter receives actual stored bytes and correctly processes a known fixture.
- A new delivery submission preserves the earlier submission and report for audit history.

**Completion gate:** a judge can submit a genuine file, refresh the browser and the backend can retrieve and assess the same file securely.

---

# Workstream G — Refund, reclaim and time-based protection

**Priority:** P0 for financial language; real refund implementation can be deferred only by disabling the refund action.  
**Primary files:**

- `backend/app/services/payment_service.py` — `refund_milestone_escrow()`
- `backend/app/utils/paypal_client.py`
- `backend/app/routers/payments.py`
- `backend/app/models/payment.py`
- `backend/app/models/marketplace.py` or a dedicated refund model
- `backend/app/models/milestone.py`
- `backend/app/services/policy_engine.py`
- `react_app/src/pages/DeliveryVerification.tsx`
- payment UI components and tests

### Current defects

`refund_milestone_escrow()` changes internal `contract.staged_amount`, milestone status and payment status but does not call PayPal's capture-refund API. It returns `status: refunded` and logs/notifications use “escrow reclaimed” language. It also accepts `CHECKOUT_CREATED` although no capture may have happened. The function does not enforce a seven-day eligibility period; no durable seven-day automatic release scheduler was found.

### Required implementation — choose one path

**Path 1: implement real PayPal refunds.**

- Persist the actual PayPal capture ID and use the PayPal capture-refund endpoint.
- Use a unique idempotency key for each refund.
- Store a refund attempt/provider refund ID/status (preferably a dedicated `RefundAttempt` model or equivalent durable record).
- Keep `REFUND_PENDING`, `REFUNDED`, `REFUND_FAILED` distinct from payout/cancel states.
- Update internal staged totals only when the provider outcome permits it; reconcile pending/failed states and verified refund webhooks.
- Never mark `refunded` from a local ledger edit.

**Path 2: narrow the MVP honestly.**

- Disable the money-returning reclaim/refund action in hosted demo.
- If a purely internal demo reset is retained, label it “Reset demo milestone state” or equivalent and state that it does not move money.
- Do not show “refund issued”, “funds returned” or “escrow reclaimed”.

### Time rules

1. Do not claim automatic seven-day release or reclaim unless an actual durable scheduler/worker enforces the policy.
2. If seven-day manual reclaim eligibility is retained, record a timestamp for the relevant event (`revision_requested_at`, last freelancer activity or another precisely defined start point) and enforce `now >= eligible_at` on the backend. Do not rely on a UI countdown.
3. Define what resets/pauses the clock. A revision request should freeze any timer only if the backend persists and enforces that pause.
4. If an automatic action is ever implemented, use a durable job table/worker, idempotent state transition and provider reconciliation. FastAPI in-process `BackgroundTasks` is not a reliable scheduler for seven-day financial obligations.
5. Do not automatically release a payout while a revision request is open, evidence is under review, payment state is ambiguous or payout recipient configuration is missing.

### Acceptance tests

- Captured payment + eligible refund → actual refund request references the real capture ID.
- Refund pending/failed → never shown as refunded.
- Confirmed refund → internal totals/state update exactly once.
- `CHECKOUT_CREATED` with no capture → no refund request is attempted.
- Already released/settled milestone → refund/reclaim denied unless a supported reversal process exists.
- Reclaim requested before the permitted time → backend rejects even if UI calls endpoint directly.
- Open revision blocks any automatic payout/release clock.
- If refund feature is disabled, API and UI clearly communicate unavailability and do not mutate money totals.

**Completion gate:** “refunded” means PayPal confirmed a refund; any local-only reset is explicitly labelled as a simulation/reset.

---

# Workstream H — Verification job lifecycle and retry safety

**Priority:** P1 reliability; P0 if the submission demo depends on asynchronous verification.  
**Primary files:**

- `backend/app/routers/deliveries.py`
- `backend/app/services/verification_service.py`
- `backend/app/services/verification/orchestrator.py`
- `backend/app/models/verification.py` (or new `VerificationJob` model)
- `backend/app/schemas/delivery.py`
- `react_app/src/pages/DeliveryVerification.tsx`
- verification tests

### Current defect

Delivery submission queues `run_verification_background()` using FastAPI `BackgroundTasks`. If an exception occurs, the service logs it and returns. The delivery can remain in `VERIFYING` and the polling endpoint may continue to report queued/processing without a terminal failure or retry path.

### Required implementation

1. Add a persisted verification-job state, either to a dedicated `VerificationJob` table or a robust status record associated with the delivery:
   `QUEUED → RUNNING → COMPLETED | FAILED | NEEDS_REVIEW`.
2. Record created/start/finish timestamps, attempt count, safe error code/message, report ID and `model_used`.
3. Set `RUNNING` before execution and set a terminal state in `finally`/exception handling. Do not leave a job indefinitely in queued/verifying because an exception was logged.
4. Make job start idempotent for a delivery; duplicate submit/poll calls must not run two assessments concurrently.
5. Provide an explicit retry action for retriable failures. Reuse the same delivery evidence version; do not create duplicate reports for the same attempt without recording a new attempt/version.
6. Ensure a process restart does not silently lose job state. For this hackathon, a DB-backed job and manual retry can be sufficient; for production, use a durable queue/worker rather than relying on in-process `BackgroundTasks` for important work.
7. Poll endpoint must return the actual job state, last error, attempt and report reference to authorized contract parties only.

### Acceptance tests

- Successful run → completed + report ID.
- Provider timeout/exception → failed or needs-review terminal status, not indefinite queued.
- Worker/process restart after queueing → job remains visible and can be recovered/retried.
- Duplicate job launch → one active run.
- Unauthorized user cannot poll a private delivery job.

**Completion gate:** every verification job reaches a visible terminal state or a recoverable retry state.

---

# Workstream I — Database migrations, startup and seeding safety

**Priority:** P0 before production deployment.  
**Primary files:**

- `backend/app/start.py`
- `backend/app/main.py`
- `backend/app/migrations.py`
- `backend/app/seed.py`
- `backend/alembic/versions/`
- `render.yaml`
- environment examples

### Current defects

`backend/app/start.py` attempts `command.upgrade(cfg, "head")`; on failure it calls `command.stamp(cfg, "head")`. Stamping records a revision but does not apply missing migrations. The same file's `ensure_schema_columns()` catches and ignores each SQL exception. `backend/app/main.py` also calls `run_auto_migrations()` in the FastAPI lifespan and logs/continues after failure. `start.py` can additionally call `SQLModel.metadata.create_all()` and performs demo seeding on startup. This creates multiple overlapping schema-management paths and can hide a broken schema.

`seed_database()` updates fields on existing profiles matching the demo emails, including names, profile details and payout email. Because `app.start` invokes this during service startup, deploy/restart may overwrite profile values for those demo accounts.

### Required implementation

1. Remove automatic `stamp head` recovery after a failed migration. A failed migration must stop startup with a clear actionable error. Never claim a schema is up to date just because a revision was stamped.
2. Choose one migration owner. Prefer a controlled Alembic migration step during deploy/release; do not run both a startup migration runner and a second automatic schema reconciler unless the responsibility is explicit and safe.
3. Keep `SQLModel.metadata.create_all()` for disposable local/test setup only. Production schema changes must be versioned Alembic migrations.
4. Remove broad `except: pass` around schema changes. Log and fail on unexpected SQL errors. If a specific compatibility error is safe to ignore, catch that exact exception and document the condition.
5. Make FastAPI startup fail when required production migration/configuration checks fail. Do not continue to serve API routes against a partially migrated schema.
6. Add a read-only schema/migration preflight and a rollback/backup procedure for production changes. Test migrations against a copy of the current schema and data before Render deployment.
7. Add `SEED_DEMO_DATA` (default false in production). Only run the seed script explicitly for local/demo initialization or a deliberate one-off setup. Production restarts must not reseed automatically.
8. Make seed data strictly insert-only or upsert only known demo fixture records. Do not overwrite a profile's name, portfolio, payout email or other user-edited fields on every startup. Separate seeded showcase fixtures from authentic user data.
9. Ensure demo account provisioning in Supabase Auth is an explicit controlled setup step. A local SQL `UserProfile` row alone does not create a working Supabase Auth login.
10. Audit all seeded showcase contracts, milestones, payment statuses, audit events, verification reports and payout-like records. They must be explicitly classified as seeded/sample/demo data, never represented as real PayPal transactions. Do not seed fabricated PayPal order, capture, batch or item IDs.
11. Do not reassign an existing non-demo contract to fixed demo account IDs during a production restart. Seed scripts must be scoped to known fixture IDs and must not alter unrelated records.
12. Review migration `f081cc3b0317_initial_schema.py` and subsequent revisions for idempotency, constraints and migration ordering. Avoid mixing direct ALTER scripts with Alembic state in ways that make the migration graph inaccurate.

### Acceptance tests

- Deliberately failing Alembic migration makes the deployment fail; it does not stamp `head` and start.
- Missing required column/schema is detected clearly.
- API does not launch when production schema is incompatible.
- `SEED_DEMO_DATA=false` leaves production profiles and contracts unchanged across restart.
- Explicit seed run creates the expected judge fixture without overwriting user-modified demo profile fields or reassigning unrelated contracts.
- Seeded showcase ledger/audit figures are visibly marked sample/demo and are not treated as provider-confirmed transactions.
- Fresh database migration from base to head works.
- Existing snapshot database upgrades to head without data loss.

**Completion gate:** production database state is controlled by versioned migrations and restart cannot overwrite real user data.

---

# Workstream J — Backend tests and CI quality gate

**Priority:** P0/P1.  
**Primary files:**

- `.github/workflows/ci.yml`
- `backend/requirements.txt`
- `backend/pytest.ini`
- `backend/tests/conftest.py`
- all files under `backend/tests/`
- `react_app/package.json`
- root `package.json`

### Current defect

The current GitHub Actions workflow runs frontend TypeScript checks and build only. It does not install Python requirements or run the backend tests. The archive contains five backend test modules and test functions, but test presence or a historical session-log result does not prove the current snapshot passes.

### Required implementation

1. Add a backend CI job using the supported Python version from the repository. Install `backend/requirements.txt` and run `pytest` from `backend/`.
2. Use a disposable test database or SQLite-compatible fixtures where possible. Mock Supabase, PayPal, Groq/OpenRouter and GitHub/HTTP dependencies for unit tests. No real secrets in CI.
3. Add migration tests: fresh DB upgrade, current DB upgrade and failure must stop startup.
4. Add the regression tests specified in Workstreams A–I, including concurrency/idempotency and unauthorized resource access.
5. Keep the existing frontend job with Node 20, TypeScript check and production build.
6. Make CI fail if backend or frontend tests fail. Do not make tests optional or use `continue-on-error` for critical checks.
7. Separate mock-based CI from optional live sandbox smoke tests. Label the latter clearly and do not conflate mocked success with PayPal sandbox evidence.
8. Add a security/static analysis check appropriate to the stack if it can be run reliably without adding high-cost infrastructure.

### Acceptance tests

- Pull request CI runs both frontend build/type-check and backend tests.
- A deliberately reintroduced synthetic capture/payout fallback fails a regression test.
- A deliberately reintroduced auth bypass fails a test.
- Provider unavailable tests produce `NEEDS_REVIEW` rather than PASS.
- CI runs migrations in a disposable database and verifies the expected revision.

**Completion gate:** no PR is considered ready while only the frontend has been validated.

---

# Workstream K — Documentation, routes and judge-facing truthfulness

**Priority:** P0 before submission/video.  
**Primary files:**

- `README.md`
- `backend/README.md`
- `react_app/README.md`
- `docs/JUDGE_DEMO.md`
- `docs/TrustBroker_AI_Hackathon_Roadmap.md`
- `docs/TrustBroker_AI_Session_Development_Log.md`
- `md_artifacts/DEVPOST_SUBMISSION.md`
- `md_artifacts/TrustBroker_AI_Demo_Script.md`
- `md_artifacts/TrustBroker_AI_Status_Report.md`
- `md_artifacts/TrustBroker_AI_Project_Completion_and_Winning_Playbook.md`
- `RENDER_DEPLOYMENT_GUIDE.md`
- `md_artifacts/RENDER_DEPLOYMENT_GUIDE.md`

### Current inconsistencies found

- `backend/README.md` lists `POST /deliveries/{id}/verify` and `POST /deliveries/{id}/manual-verify`; these do not match the router implementation. The router queues verification during `POST /deliveries` and exposes `GET /deliveries/{delivery_id}/verification-status`; manual approval is implemented through a contract/milestone review route.
- `docs/JUDGE_DEMO.md` and `md_artifacts/TrustBroker_AI_Demo_Script.md` refer to `/app/client/new-contract`; the current canonical route is `/app/client/contracts/new`.
- Root README says Node 18+ while root `package.json` declares Node `>=20`.
- Public README contains “Zero Mock Fallbacks on Payouts” despite the synthetic sandbox fallback code.
- README and judge instructions use “escrow”, “instant payout”, “funds secured” and “PayPal-secured” as if the integrated Orders + Payouts flow were a formal escrow product.
- Demo material claims real PayPal batch/item IDs and successful verification in all paths, which must not be claimed unless the actual provider and evidence records demonstrate it.
- Documentation has stale/broken relative references between `docs/` and `md_artifacts/`.

### Required implementation

1. Build an actual route inventory from `react_app/src/app/routes.tsx` and backend route decorators/OpenAPI. Update every route table and demo click path from those sources.
2. Document the actual API paths and HTTP methods, including `GET /api/v1/deliveries/{delivery_id}/verification-status`. Remove nonexistent endpoints from `backend/README.md` or implement them intentionally.
3. Reconcile app routes in README, Judge Demo and Demo Script. Use canonical `/app/client/contracts/new` and verify all other routes against `routes.tsx`.
4. Change the runtime requirement to Node 20+ in the root README and all relevant setup guides.
5. Remove “Zero Mock Fallbacks” and other statements disproved by current code. Do not restore those claims until the fallback code is removed and a real sandbox smoke test is recorded.
6. Replace “escrow” with “payment staging”, “PayPal sandbox payment coordination” or another precise term unless a supported escrow product is integrated and approved. Do not promise funds are legally held in escrow.
7. Replace “instant payout” with “PayPal payout request” or “provider-confirmed payout” depending on actual status. Distinguish `submitted`, `processing`, `unclaimed`, `failed` and `success`.
8. Make all seeded demo and screenshot/dashboard figures clearly labelled “sample data” or remove them. Never imply fictitious values are live aggregate metrics.
9. Update verification copy to say what adapters actually inspected. If AI provider was unavailable or an artifact could not be loaded, show Needs Review; do not claim Groq analysed the file.
10. Clearly label PayPal sandbox activity as sandbox. Do not describe it as a real customer payment or live payout. Do not claim Zimbabwe recipients can receive live payouts without checking current PayPal eligibility and the specific account setup.
11. Keep claims about AG Studio, AG Grid, Groq, OpenRouter, Render and Supabase tied to code that actually runs in the hosted application.
12. Fix relative Markdown links after moving/renaming documents. The roadmap currently links some artifacts using `docs/` paths even when the files are in `md_artifacts/`.
13. Replace the “100% functionally complete” status statement in `md_artifacts/TrustBroker_AI_Status_Report.md` with a dated, evidence-based status report and a clearly separated list of implemented, partial, blocked and not verified features.
14. Update judge guide to explain genuine Supabase Auth login, sandbox limitations, real evidence-upload behaviour, verification results and what is simulated/disabled.
15. Ensure the demo script only narrates actions that are visible and completed in the current hosted build. Do not use the old 12-minute script as the primary submission video if the competition limit is under three minutes.

### Acceptance tests

- Every documented frontend route exists or is clearly marked as a legacy redirect.
- Every documented backend endpoint matches OpenAPI and router source.
- Markdown links to files resolve in the repository.
- Node version agrees with package requirements and CI.
- Search the documentation for unsupported phrases such as “escrow”, “instant payout”, “zero mock”, “guaranteed”, “100% complete”, “automated refund”, “auto-release”; each remaining use is justified and qualified.
- Judge guide has separate sections for what is live, sandbox, sample/seeded and not implemented.

**Completion gate:** a judge following the README and demo guide cannot be directed to a nonexistent route or misled about whether money moved or evidence was inspected.

---

# Workstream L — Correct lifecycle semantics and aggregate states

**Priority:** P0 because financial and contract status are core product records.  
**Primary files:**

- `backend/app/services/verification/orchestrator.py`
- `backend/app/services/delivery_service.py`
- `backend/app/services/payment_service.py`
- `backend/app/services/policy_engine.py`
- `backend/app/models/contract.py`
- `backend/app/models/milestone.py`
- `backend/app/models/payment.py`
- `backend/app/models/marketplace.py`
- frontend contract detail, delivery review and payout state components

### Current defects

The verification orchestrator sets `milestone.payment_status = RELEASE_AUTHORIZED` automatically when the AI verification passes. That can make “release authorized” appear to have happened before the client explicitly authorizes a payout. Separately, it sets `contract.status = COMPLETED` when all milestones are either `VERIFIED` or `SETTLED`. A contract can therefore be marked completed even while payout remains pending/not executed.

### Required implementation

1. Separate these concepts clearly:
   - **Work verified:** the evidence has passed or the client has recorded a human approval.
   - **Release eligible:** deterministic policy says a verified, genuinely funded milestone may be presented for client authorization. This can be derived, not necessarily stored.
   - **Release authorized:** the authenticated client explicitly clicks and confirms the payout action; record actor, time, amount, currency and milestone.
   - **Payout processing:** PayPal has accepted a request but final recipient transaction status is not confirmed.
   - **Released/settled:** provider-confirmed payout item success.
2. When AI verification passes, set the milestone work status to `VERIFIED`; leave the payment status at genuine staged/funded state. Do not set `RELEASE_AUTHORIZED` automatically.
3. When client invokes the payout endpoint, recheck policy and then persist the explicit authorization/action record before or as part of the payout request. Preserve a clear failure/retry state if PayPal rejects the request.
4. Ensure a manual client override follows the same audited route: client identity, reason, timestamp, report/evidence reference and resulting verified state.
5. Mark the contract `COMPLETED` only when all milestones satisfy the documented financial completion definition (recommended: all milestones are `SETTLED` and their payout records are provider-confirmed successful). If work has passed but payouts remain pending, keep the contract active/in-verification or introduce an explicit `AWAITING_SETTLEMENT` status via migration.
6. Recalculate contract staged/released aggregates from ledger records or use one transactional source of truth. Do not mask divergent totals with `Math.max` or silently force staged amount to zero when a reversal exceeds the current value; detect and log an invariant violation.
7. Define transitions centrally and test illegal transitions: e.g. `REVISION_REQUESTED → RELEASED` must not be allowed; `PROCESSING → RELEASED` requires provider success; `FAILED → SUCCESS` requires a valid retry/provider confirmation.
8. Preserve contract/milestone state history for all important transitions rather than overwriting the only record of a prior status.

### Acceptance tests

- AI pass makes work `VERIFIED` but does not claim the client authorized payout.
- Client action records authorization once; non-client cannot do so.
- Payout processing does not mark milestone released or contract completed.
- Verified but unpaid final milestone leaves contract not completed.
- Provider-confirmed payout of every milestone completes contract exactly once.
- Revision-requested milestone cannot be released through any status combination.
- Aggregates reconcile with payment attempts and payout/refund rows; mismatches raise an observable error.

**Completion gate:** UI, contract state, milestone state and payment ledger tell the same lifecycle story.

---

# Workstream M — SSRF and external URL safety

**Priority:** P0 security fix before public verification endpoints are enabled.  
**Primary files:**

- `backend/app/services/verification/adapters/http_probe.py`
- `backend/app/services/verification/adapters/repo_meta.py`
- `backend/app/services/verification/orchestrator.py`
- `backend/app/services/verification/safety.py`
- relevant verification tests

### Current defect

The HTTP probe accepts user-submitted URLs and performs a server-side GET with redirects enabled. There is no visible resolution check/block for loopback, private, link-local, reserved or cloud metadata addresses and redirect destinations are not explicitly revalidated. A malicious freelancer could use the URL as a server-side request forgery attempt against internal services or cloud metadata endpoints.

### Required implementation

1. Allow only `http` and `https` schemes; reject credentials embedded in URLs, malformed hostnames and unexpected ports where practical.
2. Resolve DNS and reject private, loopback, link-local, multicast, reserved and unspecified IPv4/IPv6 addresses, including cloud metadata destinations.
3. Disable automatic redirects or handle each redirect manually with a strict redirect limit. Revalidate scheme, DNS resolution and destination IP at every hop.
4. Protect against DNS rebinding by pinning/validating resolved addresses for the request or using an HTTP transport that guarantees the connection uses the validated destination. Do not validate one IP then connect to a different resolution unchecked.
5. Set low connect/read/overall timeouts and bounded response size. Do not load arbitrary multi-gigabyte pages into memory.
6. Do not pass arbitrary user URLs to image/document fetch functions without the same validation. Prefer private Supabase storage references for uploaded evidence.
7. Add security tests for localhost, `127.0.0.1`, `::1`, `169.254.169.254`, RFC1918 subnets, IPv6 local ranges, redirects to private IPs, DNS rebinding patterns, non-HTTP schemes and oversized responses.
8. Keep GitHub API calls pinned to `api.github.com` and validate parsed owner/repository identifiers; do not construct arbitrary request destinations from untrusted host strings.

### Acceptance tests

- Public HTTPS URL is probed within time/size limits.
- Localhost/private/link-local/metadata IP URL is rejected before request.
- Public URL redirecting to a private IP is rejected.
- Redirect loop and oversized body are stopped safely.
- HTTP challenge/rate limit remains `NEEDS_REVIEW`, not PASS.

**Completion gate:** user-submitted evidence URLs cannot make the backend fetch internal services or cloud metadata.

---

# Workstream N — Hosted environment, judge accounts and provider eligibility

**Priority:** P0 before judge access.  
**Primary files:**

- `render.yaml`
- `backend/app/config.py`
- `backend/app/start.py`
- `backend/app/seed.py`
- `react_app/.env.example`
- `backend/.env.example`
- root `.env.example`
- `README.md`
- `docs/JUDGE_DEMO.md`

### Required implementation and checks

1. Confirm Render service names, frontend URL, API URL, `VITE_API_BASE_URL`, `FRONTEND_URL`, CORS origins and Supabase redirect URLs all match the actual deployed services.
2. Make required variables explicit in production: `ENVIRONMENT=production`, Supabase URL/JWT configuration, `PAYPAL_MODE=sandbox` for the demo, PayPal credentials and webhook ID (if webhook functionality is demonstrated), AI provider keys, private storage configuration and allowed origins.
3. Remove all credentials/secrets from tracked files, images, Markdown, demo snippets and build artifacts. Rotate any secret that was ever committed.
4. Confirm all judge accounts exist in Supabase Auth, their Auth IDs match seeded `profiles` IDs and their passwords work through normal Supabase login in a private/incognito browser.
5. The frontend must not create a local demo session after remote auth fails. A profile row alone is not a functioning judge login.
6. Payout receiver email must be a real, configured PayPal sandbox personal account email for the sandbox demo. Do not create it automatically from a placeholder.
7. Do not promise live payout availability for Zimbabwean freelancers until PayPal's current live product eligibility and the receiving account's country/type are verified. A PayPal sandbox payout demonstration is not proof of live local payout support.
8. If any PayPal Payouts endpoint/permission is unavailable in the configured sandbox account, show a truthful “unavailable in this sandbox configuration” status. Do not create mock success to hide that limitation.
9. Run an end-to-end hosted check after each deploy using the public URLs, not only localhost. Check cold-start behaviour on Render free tier.
10. Ensure demo account/profile seeding is disabled in production restarts after the initial explicit setup.
11. Restrict CORS to exact, configured frontend origins. In `backend/app/main.py`, remove the wildcard `allow_origin_regex` for arbitrary `*.onrender.com` subdomains.
12. In `global_exception_handler`, do not reflect an arbitrary `Origin` header into `Access-Control-Allow-Origin` while also enabling credentials. Return CORS headers only for an origin in the explicit allowlist, or let the configured CORS middleware own the response.

### Acceptance tests

- Judge login works through actual Supabase Auth on a clean browser.
- Hosted API rejects dev tokens and unauthorized user/resource pairs.
- Frontend, backend, CORS and Supabase callback URLs agree.
- Only exact allowed CORS origins receive credentialed cross-origin responses; arbitrary subdomains and reflected origins are rejected.
- An arbitrary `https://attacker.onrender.com` origin is not allowed by CORS.
- A request with an untrusted Origin does not receive reflected `Access-Control-Allow-Origin` plus credentials from the global exception handler.
- PayPal sandbox transaction IDs match actual PayPal Developer dashboard records for any transaction claimed as completed.
- Any unsupported payout configuration is displayed as unavailable, not success.
- No live-money or Zimbabwe local payout claims appear without current verified support.

**Completion gate:** a judge can use the hosted app with genuine credentials and every provider claim can be matched to real provider state.

---

## 2. Updated implementation sequence

This is the order to execute. Do not parallelize dependent financial state work across multiple coding agents unless one person owns the shared state-machine design.

| Sequence | Workstream | Priority | Reason |
|---:|---|---|---|
| 1 | A — Authentication | P0 | Close hosted identity impersonation first |
| 2 | M — SSRF protection | P0 | Protect public URL-verification endpoint before further use |
| 3 | B — PayPal order/capture | P0 | Make inbound money state truthful and idempotent |
| 4 | C — Webhooks | P0 | Secure provider event reconciliation |
| 5 | L — Lifecycle semantics | P0 | Clarify verified vs eligible vs authorized vs paid |
| 6 | D — Payout policy and Payouts API | P0 | Prevent fake/premature releases |
| 7 | E — Verification integrity | P0 | Make criterion results evidence-based |
| 8 | F — Real evidence uploads | P0 for multimodal claims | Give the verifier actual persistent evidence |
| 9 | G — Refund/reclaim | P0 for money-return claims | Implement real refund or disable feature |
| 10 | H — Verification job lifecycle | P1 | Prevent indefinite queued jobs |
| 11 | I — Migration and seed safety | P0 before deployment | Prevent partial schema and overwritten data |
| 12 | J — Backend CI and regression suite | P0/P1 | Keep defects from returning |
| 13 | N — Hosted environment and judge accounts | P0 before demo | Validate the actual hosted setup |
| 14 | K — Documentation and demo claims | P0 before submission | Ensure judges see truthful, reproducible claims |

### Time-constrained hackathon fallback

If the full implementation cannot be finished before the deadline, reduce claims and disable the incomplete features rather than keeping unsafe fallbacks:

- If payouts cannot be provider-confirmed, show the payout request as unavailable/pending; do not show a completed release.
- If refunds are not integrated, disable reclaim/refund or label a local-only reset as a demo reset.
- If persistent uploads cannot be implemented, do not claim screenshots/documents are uploaded and inspected end-to-end. Restrict verification to supported, actually fetched URLs/text and Needs Review for unsupported evidence.
- If live AI assessment is unavailable, mark verification Needs Review or clearly identify a deterministic fact-check. Do not manufacture an AI pass.
- If webhook configuration is incomplete, do not claim webhook verification is live. Use a securely verified server-side reconciliation path or disable webhook-based state changes.

---

## 3. Cross-system acceptance journey (the release gate)

The following single scenario must pass against the current code after all workstreams are implemented. Use real Supabase Auth, PayPal sandbox and actual storage uploads; mock providers only in CI tests.

1. Client signs in through Supabase Auth.
2. Client creates a contract and publishes it to the marketplace.
3. Freelancer signs in through Supabase Auth, opens the listing and submits an application.
4. Client reviews the application and awards the freelancer.
5. Both parties accept exactly the same contract version and content hash.
6. Client creates one PayPal order for the next milestone. Repeated clicks do not create multiple active orders.
7. Client completes the PayPal sandbox approval flow. The backend captures the order and confirms a real capture ID, amount and currency. Only then does the milestone become staged/funded.
8. Freelancer submits a screenshot and/or document. Actual file bytes are uploaded to a private bucket; a browser refresh does not lose them.
9. Verification retrieves the real file, records which adapter/provider actually inspected it, cites the evidence used and returns PASS/FAIL/NEEDS_REVIEW per criterion.
10. A missing image, rate-limited repository, blocked URL or unavailable AI model produces NEEDS_REVIEW, not PASS.
11. Client reviews the report. A human override, if chosen, requires a reason and is recorded with actor/time.
12. A revision request blocks payout. Reclaim/refund is either a real provider refund with confirmed status or the feature is disabled/explicitly demo-only.
13. Client explicitly authorizes payout only after the milestone is verified and genuinely funded.
14. PayPal Payouts returns a real batch/item. If pending, UI says pending/processing. It does not say paid/released.
15. A verified provider success event/reconciliation moves payout to success, milestone to settled/released and updates contract totals exactly once.
16. Contract becomes completed only after all milestones satisfy the defined completion state.
17. Audit history shows contract version acceptance, provider order/capture, evidence submission, verification, human review (if any), payout request and final provider status.
18. An unrelated account cannot access the contract, evidence, verification report, payment history or payout action.

### Negative journey that must also pass

Repeat the journey with one deliberately bad condition at a time:

- invalid/development token in production;
- declined or unapproved PayPal checkout;
- webhook with invalid signature;
- mismatched webhook amount/currency;
- repeated order creation;
- payout API permission failure;
- payout response pending;
- missing payout destination;
- revision requested;
- invalid/expired storage upload;
- HTTP 403/429 bot challenge;
- GitHub rate limit;
- AI provider unavailable;
- malicious localhost/metadata URL;
- verification worker exception;
- Alembic migration failure.

For each condition, the system must show a truthful non-success state and must not advance money or contract aggregates incorrectly.

---

## 4. Required regression-test matrix

| Test category | Must prove |
|---|---|
| Authentication | No dev-token hosted access; valid Supabase identity and role enforcement |
| Contract lifecycle | Same version accepted; no completion before all milestones settle |
| Order creation | One active order per milestone under repeated/concurrent requests |
| Capture | Only real provider-completed capture with matching amount/currency funds milestone |
| Webhooks | Signature required; event/resource matching; duplicate idempotency |
| Payout | Client only; verified only; pending is not success; real item success required |
| Refund | Actual provider refund or disabled; no fake refunded state; time eligibility enforced |
| Verification | All adapters produce truthful PASS/FAIL/NEEDS_REVIEW; no permissive fallbacks |
| Evidence storage | Real bytes, private access, expiry, MIME/size/path validation |
| SSRF | Private/metadata IPs and redirect-to-private attempts blocked |
| Background jobs | Terminal failure state and retry; no stuck queued job |
| Migrations | Fresh and upgrade paths; no stamp-on-failure; fail startup on incompatible schema |
| Seeding | Production restart does not overwrite profiles or reseed fixture transactions |
| CI | Backend tests and frontend checks run on PRs |
| Documentation | Routes/claims/Node version/demo instructions match code and deployed behaviour |
| Hosted E2E | Real credentials, live hosted routes, real sandbox IDs and correct status labels |

---

## 5. Documentation wording and state vocabulary to standardize

Use the same vocabulary across backend enums, frontend labels, API docs, README and demo video.

| Technical state | User-facing wording | Do not call it |
|---|---|---|
| PayPal order created | Checkout created / Awaiting payment | Funded |
| Capture confirmed completed | Payment confirmed / Staged in PayPal sandbox | Escrow guaranteed |
| Verification queued | Verification queued | Verified |
| Adapter/provider unavailable | Needs review | Passed |
| All criteria passed | Delivery verified | Funds released |
| Client has not acted yet | Release eligible / Awaiting client approval | Release authorized |
| Client explicitly approves payout | Payout authorized / Request submitted | Paid |
| PayPal payout pending/processing | Payout processing | Released / Received |
| PayPal payout item success confirmed | Payout completed / Provider confirmed | Instant payout (unless proven) |
| Local demo reset | Demo state reset | Refund / Escrow reclaimed |
| Actual PayPal refund confirmed | Refund completed | Internal balance reset |
| Synthetic/mock CI object | Simulated test result (tests only) | Real PayPal ID |

The term “escrow” should not be used in marketing or judge claims for a normal Orders capture plus Payouts transfer. If used in internal code naming for legacy compatibility, make the UI and docs accurately describe the underlying behaviour.

---

## 6. Coding-agent execution protocol

Give a coding agent **one workstream at a time**. The agent must:

1. Read this document and inspect the named source files and callers before editing.
2. Report the current implementation and planned change before altering shared state enums/models.
3. Create a separate branch/commit per workstream or a clearly isolated set of commits.
4. Add or update the regression tests alongside code changes.
5. Include database migrations for model/enum/index changes. Do not rely on startup `create_all()` to modify production schemas.
6. Preserve public routes and UI flows where possible, but do not preserve unsafe behaviours just for demo continuity.
7. Never invent provider IDs, successful statuses, recipient accounts, model names, uploaded files, verification citations or refund outcomes.
8. Never execute uploaded code or trust instructions contained within submitted evidence.
9. Do not commit secrets, service-role keys, PayPal credentials, test account passwords or real user data.
10. At the end, report: files changed, migration IDs, tests run, test results, provider calls mocked vs live, configuration still required and any remaining limitations.

### Definition of done per workstream

A workstream is not complete until:

- tests cover both success and failure paths;
- at least one regression test reproduces the original defect and now passes;
- front-end status/copy reflects the updated backend state;
- documentation is updated if a route, configuration or user-visible claim changed;
- no new bypass/fallback was introduced to make a demo appear successful.

---

## 7. Final sign-off checklist

- [ ] Hosted development-token auth is disabled and tested.
- [ ] Frontend no longer silently falls back to fake demo identities.
- [ ] No synthetic PayPal capture IDs or completed capture responses exist.
- [ ] One active order per milestone is enforced under concurrency.
- [ ] Webhook signature verification fails closed and reconciles resource values.
- [ ] No synthetic payout IDs or pending-to-success conversions exist.
- [ ] Payout policy requires verified work, real staged payment and client action.
- [ ] Release eligible and release authorized are distinct states.
- [ ] Contract only becomes completed after all required milestone settlement conditions are met.
- [ ] Verification adapters never pass inaccessible/uninspected evidence.
- [ ] AI evaluator is actually used only when relevant evidence is available; fallback is Needs Review, not automatic pass.
- [ ] Actual provider/model used is recorded accurately.
- [ ] Evidence upload stores real bytes in private Supabase Storage and works after refresh.
- [ ] SSRF checks block private, loopback, link-local, metadata and redirect-to-private URLs.
- [ ] Refund/reclaim is a real confirmed provider refund or is disabled/clearly labelled demo-only.
- [ ] Seven-day/automatic timing promises are enforced or removed.
- [ ] Verification jobs cannot remain indefinitely queued after an exception.
- [ ] Startup never stamps Alembic head after a failed migration.
- [ ] Production startup does not run unsafe schema healing or overwrite demo/user profiles.
- [ ] Backend tests run in CI together with frontend build/type-check.
- [ ] README routes, setup instructions, status claims and demo script match actual code.
- [ ] Render/CORS/API/Supabase URLs and secrets are checked.
- [ ] Judge accounts use real Supabase Auth.
- [ ] PayPal sandbox IDs shown as completed match real PayPal records.
- [ ] Live recipient eligibility and country limitations are not overpromised.
- [ ] Full positive and negative hosted lifecycle journeys pass.

**Final sign-off statement:** TrustBroker AI may be described as submission-ready only after all P0 items are complete, all P0 regression tests pass, the hosted judge journey is reproducible and all remaining limitations are stated accurately. No status in this checklist should be marked complete based solely on a development-log claim or a mocked test.
