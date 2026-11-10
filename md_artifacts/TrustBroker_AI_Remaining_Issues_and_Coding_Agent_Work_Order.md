# TrustBroker AI — Remaining Issues & Coding-Agent Work Order

**Document type:** Implementation and investigation instructions for AI coding agents  
**Repository snapshot reviewed:** `trustbroker_ai-main.zip` uploaded 9 November 2026  
**Review date:** 10 November 2026  
**Companion specification:** `md_artifacts/TrustBroker_AI_Comprehensive_Remediation_Plan_v2.md`  
**Purpose:** Continue remediation from the latest reviewed code. Preserve completed improvements, fix confirmed remaining defects, investigate areas not yet fully validated, and prove completion with regression tests.

---

## 0. Instructions to the coding agent

You are continuing work on the existing TrustBroker AI repository. This document is based on the 9 November ZIP snapshot, not on assumptions about later unprovided commits. First inspect the current working tree and confirm whether each finding below still exists. Source code may have changed since the snapshot.

### Mandatory rules

1. Read this document and `md_artifacts/TrustBroker_AI_Comprehensive_Remediation_Plan_v2.md` before editing.
2. Inspect the current source and tests. Do not rely on line numbers from this document; use function names and search terms.
3. Preserve improvements already present in the 9 November snapshot. Do not reintroduce development authentication in production, synthetic PayPal capture success, synthetic payout success, open webhook verification, or fabricated payout recipients.
4. Make security, evidence-ownership, verification and financial-state decisions on the backend. Frontend-only disabling, labels or checks are not security controls.
5. AI can draft, interpret and assess evidence. It must never authorize or execute a payment, payout, refund, contract acceptance or other privileged state transition.
6. An unavailable provider, unreadable file, failed HTTP request, missing evidence or ambiguous result must never be converted into a successful verification or financial state.
7. Never invent provider transaction IDs, capture IDs, payout batch IDs, refund IDs, repository files, model execution, verification observations or test results.
8. Use real database migrations for schema changes. Do not silently mark a schema as migrated when migrations failed.
9. Keep private evidence storage private. Never trust a client-supplied storage path or use a local filesystem path without canonical path validation.
10. Do not execute uploaded freelancer code in the FastAPI process.
11. Preserve the existing React/TypeScript frontend, FastAPI backend, PostgreSQL/Supabase data layer, PayPal integration, AI provider chain, marketplace, client/freelancer portals, AG Grid and AG Studio features.
12. Do not introduce Gemini, KERNEL or Bryntum.
13. Do not perform unrelated redesigns or broad refactors while implementing these fixes.
14. Never commit or print `.env` secrets, Supabase service-role keys, JWT secrets, PayPal secrets, webhook material or AI API keys.
15. Add a focused regression test for every corrected defect. Rewrite tests that encode the unsafe old behaviour.
16. Run the actual checks. A code edit, mocked assertion or successful syntax compile alone does not establish that a workstream is complete.
17. If a provider credential, sandbox capability or external account is unavailable, implement safe failure behaviour and document the limitation. Do not simulate a provider success.

### Required task reporting

For every workstream, record:

- Current source behaviour and whether the finding still applies.
- Root cause.
- Files inspected.
- Files changed.
- Exact behaviour changed.
- Tests added/modified.
- Commands actually executed and results.
- Any external credential/account dependency.
- Remaining limitation.
- Status: `PASS`, `PARTIAL`, `FAIL` or `NOT TESTED`.

Do not mark the overall project complete while any P0 gate is `PARTIAL`, `FAIL` or `NOT TESTED`.

---

## 1. Improvements to preserve from the 9 November snapshot

The following improvements were present in the reviewed ZIP. Verify that they still exist in the current branch and protect them with regression tests:

| Area | Improvement present in snapshot | Required safeguard |
|---|---|---|
| Authentication | Development tokens are checked through `settings.is_dev_auth_allowed`, and production explicitly rejects them. | Keep the production prohibition and test it. |
| Development identities | Only `client` and `freelancer` token roles are accepted. | Reject all other role strings. |
| PayPal capture | Synthetic completed captures and fabricated `SANDBOX-CAP-*` IDs were removed. Already-captured/422 outcomes are reconciled against the actual PayPal order. | Require complete provider data; do not accept missing transaction fields. |
| Webhook configuration | Missing `PAYPAL_WEBHOOK_ID` fails closed. | Keep fail-closed behaviour in every environment. |
| Payout API | Synthetic batch/item IDs and forced `SUCCESS` conversions were removed. | Preserve provider status exactly and reconcile ambiguous responses. |
| Payout recipient | Missing freelancer PayPal recipient blocks payout creation. | Never auto-invent recipient details. |
| Release policy | Payout requires a verified milestone and blocks an open revision request. | Keep all checks server-side; test every state. |
| SSRF | URL validation and redirect revalidation were added. | Address DNS rebinding/connection-time validation as described below. |
| Evidence upload | Frontend uses a multipart upload endpoint rather than relying on browser `blob:` URLs. | Secure ownership, storage durability and file reads. |
| Backend CI | GitHub Actions contains a Python backend test job. | Ensure it tests the full suite and does not use unsafe production configuration. |

---

# 2. P0 — Evidence verification must not manufacture a pass

**Snapshot status: NOT COMPLETE.** This is the most important remaining product defect because evidence-based delivery verification is TrustBroker AI's central differentiator.

### Relevant files

- `backend/app/services/verification/adapters/vision.py`
- `backend/app/services/verification/adapters/repo_meta.py`
- `backend/app/services/verification/adapters/http_probe.py`
- `backend/app/services/verification/adapters/document.py`
- `backend/app/services/verification/adapters/zip_listing.py`
- `backend/app/services/verification/orchestrator.py`
- `backend/app/services/verification/scoring.py`
- `backend/app/services/ai_provider.py`
- `backend/app/services/verification_service.py`
- `backend/tests/test_phase5_verification.py`
- `backend/tests/test_e2e_lifecycle.py`
- `backend/tests/test_ssrf_safety.py`

## 2.1 Vision adapter fallback still returns PASS

In the snapshot, `inspect_screenshot_with_vision()` falls back to `vision_heuristic_fallback` and returns `matches_criterion=True` and `passed=True` when the image could not be inspected by the model.

### Required change

- Remove the successful fallback.
- If image bytes are unavailable, unreadable, unsupported, or the vision provider cannot complete the assessment, return `NEEDS_REVIEW` (or a safe adapter representation that the scoring engine maps to `NEEDS_REVIEW`).
- Do not invent visual elements, observations, citations or confidence values.
- Use `model_used=None` or an explicit unavailable value when no model ran.
- Distinguish a genuine model evaluation from a mere file-presence check.
- Validate the returned JSON schema and criterion association. Invalid model output must become `NEEDS_REVIEW`.

### Required tests

1. Genuine visual pass.
2. Genuine visual failure.
3. Missing API key.
4. Timeout and network error.
5. Provider rate limit.
6. Unsupported format.
7. Corrupt image bytes.
8. Missing file.
9. Malformed JSON.
10. Model output missing required fields.

Every unavailable/invalid-inspection case must not pass.

## 2.2 Repository exception fallback still returns fake success

In the snapshot, `inspect_repository()` correctly treats GitHub API 403 rate limiting as a review case, but its general exception handler still returns:

- `exists=True`
- `passed=True`
- fabricated `files_found` entries such as `src/` and `README.md`

### Required change

- Remove all synthetic repository metadata.
- A network exception, timeout, DNS failure, API rate limit or unavailable provider must return `NEEDS_REVIEW`.
- A genuine public GitHub 404 can fail a repository-existence criterion.
- A private/inaccessible repository must be marked inaccessible/review-required unless authenticated access is deliberately implemented.
- Do not infer repository functionality from existence, language, root file names or README presence.
- Tighten URL parsing: parse the hostname and require exactly `github.com`; do not accept a deceptive hostname that merely contains the text `github.com`.
- GitLab/Bitbucket are not currently inspected by a matching provider API in the snapshot; they must not pass. Return review-required until real inspection is implemented.

### Required tests

GitHub 200, 404, private/inaccessible, 403, 429, timeout, DNS error, malformed URL, deceptive host (`evilgithub.com`), GitLab, Bitbucket, missing README and unexpected API response schema.

## 2.3 The orchestrator does not call the criterion-level AI evaluator

In `orchestrator.py`, the snapshot sets `llm_eval` to `None` and passes it to `score_criterion_result()`. The existing `evaluate_delivery_against_criteria()` function in `ai_provider.py` is not connected to the orchestration path.

### Required change

Connect the actual AI criterion evaluator to the verification orchestration, or implement an equivalent single, testable assessment service. For each acceptance criterion, provide only the evidence actually retrieved:

- Original criterion ID, title, description and expected evidence type.
- Freelancer's written submission.
- Repository inspection observations.
- Live URL probe facts.
- Extracted document text.
- Actual image observations from successful vision inspection.
- Archive inspection facts.
- Evidence references that can be traced to stored files.

The AI must not invent unavailable evidence. It must be instructed to treat uploaded files, README text, web pages, repository files and freelancer descriptions as untrusted data, not as instructions capable of overriding the system policy.

### Validate model output

Validate the AI response against a strict schema:

- Correct criterion ID.
- Permitted result: `PASS`, `FAIL` or `NEEDS_REVIEW`.
- Score within 0–100.
- Confidence within 0–1.
- Explanation.
- Evidence citation/reference.
- Human-review flag.

Reject unknown criterion IDs, missing fields, duplicate criteria, malformed JSON, out-of-range scores and unsupported claims. If model output and deterministic evidence facts conflict, do not silently pick the positive result: use `NEEDS_REVIEW` unless the deterministic rule establishes a hard failure.

## 2.4 Text length must not pass a criterion

The snapshot's orchestrator has a text fallback equivalent to `len(delivery.description) > 30`.

Remove this as a verification decision. A long description is a freelancer attestation, not proof of completed work. It may be considered context for the AI or human reviewer, but cannot independently pass a criterion.

## 2.5 Correct model attribution

The snapshot defaults `primary_model` to a hardcoded Groq model name when no model has been recorded in `models_used`.

Remove the fabricated default. Persist the actual provider and model that performed the assessment. If no model ran, report `fallback:none`/`AI unavailable` or the equivalent. Never attribute deterministic fallback work to an AI model.

## 2.6 Review all other adapters for structural false positives

Do not stop after fixing vision and repository adapters. Inspect the following behaviours from the snapshot:

- `document.py` has a deterministic keyword matcher that can pass a document when criterion-title keywords appear in extracted text. A keyword match is not necessarily semantic compliance. It may be a preliminary observation, but uncertain cases require AI/human review.
- `zip_listing.py` can pass a non-empty ZIP archive that has no suspicious paths. This establishes archive structure, not that the archive contains the promised deliverables. Use it only for archive-integrity/contents facts; the criterion must still be assessed.
- `http_probe.py` treats an HTTP success response as a reachability fact. A reachable URL does not prove an application feature works or that the acceptance criterion is met.
- Repository metadata establishes repository facts, not successful builds or behaviour.
- A `video_link` is not verified merely because a URL exists. Keep it `NEEDS_REVIEW` unless actual playback/content inspection is implemented.
- In the orchestrator's live URL + screenshot path, confirm that screenshot success can only offset a blocked URL probe when the criterion explicitly allows screenshot evidence as an alternative and the image was genuinely inspected by a model.

Every adapter must state what it actually verified and what it did not verify.

## 2.7 Scoring and overall decision

In `scoring.py`, ensure `NEEDS_REVIEW` is preserved through criterion and milestone aggregation. Overall verification must pass only when every required criterion has genuinely passed and no required review remains. Confirm hard failures cannot be overridden by an optimistic model result.

### Workstream 2 completion gate

- No fallback can create an automatic PASS without the required evidence inspection.
- The AI evaluator is connected to the real orchestration path.
- Every AI result is schema-validated and tied to actual evidence.
- Model attribution is truthful.
- Provider/model failure becomes `NEEDS_REVIEW`.
- Adapter facts are not confused with semantic proof of completion.
- All positive and negative tests pass.

---

# 3. P0 — Evidence upload ownership, storage durability and secure access

**Snapshot status: PARTIAL.** The multipart upload endpoint exists and the frontend uses it, but the complete storage ownership and durability model needs hardening.

### Relevant files

- `backend/app/routers/deliveries.py`
- `backend/app/services/delivery_service.py`
- `backend/app/models/delivery.py`
- `backend/app/schemas/delivery.py`
- `backend/app/utils/supabase_client.py`
- `backend/app/services/verification/orchestrator.py`
- `backend/app/services/verification/adapters/vision.py`
- `backend/app/services/verification/adapters/document.py`
- `backend/app/services/verification/adapters/zip_listing.py`
- `backend/app/services/verification/safety.py`
- `react_app/src/pages/DeliveryVerification.tsx`
- `react_app/src/hooks/useContractStore.ts`
- `react_app/src/lib/api.ts`

## 3.1 Do not trust a submitted storage path

In the snapshot, `upload-file` creates a path under the current user's folder, but `submit_delivery()` accepts the client-provided `storage_path` value when creating `DeliveryFile` records. It checks for `blob:` and file metadata, but does not prove the path belongs to an upload created by the authenticated user.

Implement a server-owned upload record/opaque upload ID:

1. Authenticated freelancer uploads the bytes.
2. Backend validates and creates an upload record with uploader ID, generated object key, size, MIME, hash and state.
3. Delivery submission references the upload ID, not an arbitrary path.
4. Backend verifies uploader ownership, object existence, unused/attachable state, contract/milestone relationship and allowed MIME/size.
5. Backend attaches the upload record to the delivery transactionally.
6. Mark uploads attached/consumed to prevent arbitrary reuse where appropriate.

Do not treat a `user_id/` prefix in a client-supplied string as proof of ownership.

## 3.2 Secure local path resolution

The snapshot's download route joins the stored `storage_path` to a base directory before checking existence. Even a database-stored path should be treated as untrusted.

- Resolve paths canonically.
- Prove the resolved path remains inside the configured evidence root.
- Reject absolute paths, `..`, null bytes, unexpected schemes and paths outside the correct storage namespace.
- Apply the same checks in every adapter that reads local files.
- Do not allow a path from one user's upload area to be attached by another user.

## 3.3 Do not silently use ephemeral production storage

The upload route attempts Supabase Storage but falls back to local disk on any storage exception. On an ephemeral host, local files may disappear after restart/redeploy.

- Local disk fallback may be enabled only for explicit development/test environments.
- In production, if the durable private bucket is unavailable, fail the upload clearly.
- Never tell the user the evidence is securely stored when it exists only on ephemeral disk.
- Do not swallow Supabase upload errors without structured logging and a safe client response.

## 3.4 Validate actual file content

The upload route uses MIME metadata and size checks. Add server-side checks for content signatures and MIME/extension consistency where practical.

Enforce:

- Per-file and total-submission limits.
- Streaming/bounded reads to avoid unbounded memory usage.
- Safe filename normalization.
- Private object keys and bucket policy.
- ZIP entry count, uncompressed size and compression-ratio limits.
- ZIP path traversal checks, including normalized path handling.
- PDF/document parsing limits.
- Safe SVG handling or reject SVG if sanitization is unavailable.
- No execution of uploaded code or scripts.

## 3.5 Make the adapters consume actual bytes

Trace storage through `DeliveryFile.storage_path` into each adapter. Supabase object URIs are not ordinary local paths. Implement one safe evidence-reader abstraction that can obtain actual bytes/text from the configured private storage system, after checking database ownership. Pass bytes or bounded extracted text to adapters, not a filename or a raw storage path as a substitute for file content.

## 3.6 Verify download authorization

Client and freelancer contract parties may access attached evidence only for contracts to which they belong. A user cannot download an arbitrary upload by guessing a file UUID. Signed URLs must be short-lived and created only after authorization.

### Required tests

- Valid upload and attachment.
- Unauthenticated upload.
- Client attempting freelancer upload.
- Another freelancer attaching the first user's upload ID.
- Upload from another contract.
- Forged `storage_path`.
- Absolute path and traversal.
- Local path outside evidence root.
- Supabase outage in production.
- MIME spoof and invalid file signature.
- Oversized and total-size-exceeded submission.
- ZIP bomb and suspicious normalized archive paths.
- Unauthorized file download.
- Authorized download after browser refresh.
- Expired signed URL.
- Verification reads the exact bytes stored.

### Workstream 3 completion gate

Every delivery file is a backend-created upload owned by the submitting freelancer, durably stored in private storage, attached to the correct contract/milestone and read securely by the verification adapters.

---

# 4. P0 — PayPal capture: complete provider reconciliation

**Snapshot status: PARTIAL.** Synthetic capture success was removed, but amount/currency checks are conditional and checkout idempotency is not yet concurrency-safe.

### Relevant files

- `backend/app/services/payment_service.py`
- `backend/app/utils/paypal_client.py`
- `backend/app/services/policy_engine.py`
- `backend/app/models/payment.py`
- `backend/app/models/milestone.py`
- `backend/tests/test_phase4_paypal.py`
- `backend/tests/test_paypal_integrity.py`
- `backend/tests/test_e2e_lifecycle.py`

## 4.1 Require all essential provider fields

The snapshot checks amount/currency only when they are present. Missing fields can bypass comparison.

A capture can fund a milestone only after validating:

- Exact stored PayPal order ID.
- Real provider-issued capture ID.
- Provider status exactly `COMPLETED`.
- Amount is present and exactly matches the stored attempt amount using `Decimal`.
- Currency is present and matches the attempt currency.
- Purchase unit/reference maps to the correct milestone/contract.
- The provider response structure is valid and not ambiguous.

If a required field is absent, reconcile through the PayPal Orders API and/or mark the attempt as requiring reconciliation. Do not treat missing data as a match.

Inspect all supported purchase units and explicitly reject unexpected/multiple purchase-unit structures unless the product deliberately supports them. Do not blindly trust only the first purchase unit.

## 4.2 Make funding idempotent

Review `_mark_milestone_funded()` and all callers.

- A completed capture may be applied once.
- Duplicate capture requests and duplicate webhooks must not increase `staged_amount` twice.
- Duplicate notifications/audit events should be avoided or clearly marked as duplicate observations.
- Persist provider status and provider references consistently.
- Use transaction boundaries and uniqueness constraints where appropriate.

## 4.3 Close checkout order creation race conditions

The snapshot checks for an existing `CHECKOUT_CREATED` attempt, but it calls PayPal before persisting a local attempt and generates a fresh request ID for each invocation.

Investigate:

- Two simultaneous requests for the same milestone.
- Process crash after PayPal order creation but before local commit.
- DB failure after external order creation.
- Expired/invalid approval link.
- Existing attempt still marked checkout-created after provider order is voided/expired.

Implement a stable, persisted idempotency key per intended funding attempt, a database-level guard/lock against multiple active attempts, and safe provider reconciliation. Reusing an existing checkout must verify its current provider state; do not blindly return a stale approval URL or a nonexistent link.

### Tests

Successful matching capture; failed/declined/unapproved/pending capture; missing ID; missing amount; missing currency; amount mismatch; currency mismatch; wrong order/reference; already-captured reconciliation; duplicate capture; concurrent order creation; DB failure after provider order creation; expired order recovery.

### Workstream 4 completion gate

No failed, incomplete, ambiguous, mismatched or duplicate provider interaction can mark a milestone funded or double-count staged funds.

---

# 5. P0 — PayPal webhook event validation and retry safety

**Snapshot status: PARTIAL.** Missing webhook ID fails closed, but the event processor still permits missing amount/currency to bypass comparisons and needs more robust per-event mapping.

### Relevant files

- `backend/app/utils/paypal_client.py`
- `backend/app/services/payment_service.py`
- `backend/app/routers/payments.py`
- `backend/app/models/payment.py`
- `backend/tests/test_phase4_paypal.py`
- `backend/tests/test_paypal_integrity.py`

## Required changes

1. Keep webhook signature verification fail-closed when the webhook ID or required transmission headers are missing.
2. Verify through PayPal's signature-verification endpoint using the configured webhook ID.
3. Validate event ID and event type.
4. Validate the resource ID and related IDs against stored provider references.
5. For capture events, require matching order, capture, amount, currency and status. Missing fields must cause reconciliation/rejection, not silently pass.
6. Do not treat `CHECKOUT.ORDER.COMPLETED` as the same resource shape as `PAYMENT.CAPTURE.COMPLETED`. Retrieve/reconcile the actual capture if needed.
7. Handle denied, reversed, refunded and voided events using explicit event-specific rules. Do not map an unrelated resource ID to an arbitrary attempt.
8. For payout events, match provider batch/item IDs and sender item references to one stored payout. Validate the event's actual transaction status.
9. Unknown event types may be stored for audit but must not change payment state.
10. Keep idempotency, but ensure an event is not permanently marked processed before the state update commits.
11. A processing failure must be visible and retryable. Distinguish received, processing, processed and failed states or implement an equivalent safe design.
12. Duplicate event delivery must not duplicate money aggregates, audit transitions or notifications.

### Tests

Missing configuration; missing headers; invalid signature; valid capture event; mismatched amount/currency; missing amount/currency; checkout order event requiring reconciliation; duplicate event; provider event DB failure; unknown event; capture denial/reversal/refund; payout pending/success/failed/returned/unclaimed.

### Workstream 5 completion gate

Only valid, signed, correctly matched and idempotently processed provider events can advance financial states.

---

# 6. P0 — Payout status accuracy, ambiguity and concurrency

**Snapshot status: PARTIAL.** Synthetic success was removed and missing recipient blocks the request. However, ambiguous network outcomes, status messages and payout reconciliation need work.

### Relevant files

- `backend/app/services/payment_service.py`
- `backend/app/services/policy_engine.py`
- `backend/app/utils/paypal_client.py`
- `backend/app/models/marketplace.py`
- `backend/app/routers/payments.py`
- Client payout management UI.
- Freelancer earnings UI.
- `react_app/src/pages/DeliveryVerification.tsx`
- Payout regression tests.

## 6.1 Handle ambiguous create-payout outcomes

A timeout does not prove PayPal rejected a payout. PayPal may have accepted the batch but the application failed to receive the response.

- Distinguish confirmed failure from ambiguous outcome.
- Store `RECONCILIATION_REQUIRED` or equivalent for uncertain provider outcomes.
- Preserve the idempotency key and do not blindly retry with a new key.
- Retrieve batch/item details before deciding whether another request is safe.
- Do not tell the user a payout failed if the provider outcome is unknown.

## 6.2 Validate provider response structure

- Require a real payout batch ID when provider confirms batch creation.
- Validate item identity, sender item reference, recipient and amount/currency where returned.
- Do not infer item success from batch submission alone.
- Map provider states explicitly.
- Unknown statuses must go to a safe reconciliation state, not success.

## 6.3 Correct user-facing state labels and API fields

The snapshot's notification says “PayPal payout sent” even if the provider response is pending/processing. The response also includes `released_amount` before final success.

Use distinct meanings:

| Internal state | UI wording |
|---|---|
| `RELEASE_AUTHORIZED` | Client approved release |
| Provider accepted request / submitted | Payout submitted |
| Pending/processing | Payout processing |
| Provider-confirmed item success | Payment released |
| Provider-confirmed failure | Payout failed |
| Returned | Payout returned |
| Unclaimed | Payout unclaimed |
| Ambiguous provider state | Payout requires reconciliation |

Do not include a `released_amount` field as though funds were released when the provider has only accepted a pending batch. Return `requested_amount` or `payout_amount` until confirmed.

Notifications must match the real state. A freelancer must not be told that funds were received when the batch is merely processing.

## 6.4 Payout idempotency and accounting

- Test two concurrent client release requests.
- Test DB failure after provider acceptance.
- Ensure `payout:{milestone_id}` maps to one intended request and is not used to blindly resend a known/ambiguous request.
- Ensure `_apply_payout_status()` is idempotent. Duplicate SUCCESS events must not increase `released_amount` twice or subtract staged funds twice.
- Do not let an unknown provider status become a new accepted status without a reconciliation rule.
- Ensure all state transitions and amount aggregates are committed atomically.

### Tests

Pending, processing, success, failed, denied, returned, unclaimed, unknown provider status, timeout after acceptance, repeated release, concurrent release, duplicate webhook, DB failure after provider acceptance, incorrect provider item reference.

### Workstream 6 completion gate

A payout is displayed as released only after PayPal-confirmed item success. Unknown/ambiguous states are visible and do not double-count money.

---

# 7. P0 — Refund and reclaim must not claim a refund that did not happen

**Snapshot status: NOT COMPLETE.** The code documents that the operation is a local sandbox reset, but the API still returns `status: refunded`, accepts `CHECKOUT_CREATED`, and uses escrow/refund language.

### Relevant files

- `backend/app/services/payment_service.py` — `refund_milestone_escrow()`
- `backend/app/routers/payments.py`
- Payment, payout and milestone models.
- Client payment/review UI.
- Freelancer earnings UI.

## Required changes

Separate four different actions:

1. Cancel an unapproved PayPal checkout order.
2. Perform an explicitly labelled internal sandbox reset/simulation.
3. Submit a real PayPal refund request against an actual capture ID.
4. Record a provider-confirmed completed refund.

If no PayPal Refunds API call exists, do not return `status: refunded`; use a distinct status such as `sandbox_reset` and label the UI clearly. Do not claim money was returned to the payer.

A `CHECKOUT_CREATED` attempt was not captured and cannot be refunded. Cancel/void the order through the applicable provider flow or mark it cancelled only after the provider outcome is established.

For an actual refund:

- Require a real capture ID.
- Submit the provider refund request.
- Persist the provider refund ID and status.
- Reconcile the final provider status.
- Update staged/released aggregates only on the correct confirmed transition.
- Make duplicate refund requests idempotent.

## Reclaim and time policy

Investigate the 7-day reclaim/auto-release claims. In the snapshot, the reclaim function itself does not enforce the actual age/expiry condition and no durable scheduled process was proven.

Either implement a restart-safe, persisted policy/scheduler that:

- Records the correct start time.
- Enforces the required waiting period.
- Pauses while a revision is outstanding.
- Re-checks current payment and milestone state at execution.
- Uses idempotent transitions.
- Records an auditable event.

Or remove automatic reclaim/auto-release claims from the product and demo until the feature is truly implemented. Do not use a frontend countdown as enforcement.

### Tests

Unapproved order cancellation; checkout-created nonrefundability; genuine capture refund request; refund pending; refund completed; refund failed; duplicate refund; already released payout; revision-requested milestone; immediate reclaim attempt; time boundary; scheduler restart; duplicate scheduled execution.

### Workstream 7 completion gate

No internal state reset is described as a PayPal refund, and no unapproved checkout is treated as captured/reclaimable money.

---

# 8. P0 — Policy, payment state and contract completion consistency

**Snapshot status: IMPROVED BUT REQUIRES REGRESSION VALIDATION.** Release policy now requires `MilestoneStatus.VERIFIED`, requires staged/release-authorized payment state, blocks revision requests and checks payout email. The orchestrator comments that it leaves payment staged until client authorization. Preserve this separation.

### Relevant files

- `backend/app/services/policy_engine.py`
- `backend/app/services/payment_service.py`
- `backend/app/services/verification/orchestrator.py`
- Contract, milestone, acceptance and payment models.
- Client review and payout UI.

## Required investigation and rules

1. AI verification PASS may set work status to `VERIFIED` or make it eligible for client review. It must not authorize payout.
2. Client approval must be an explicit authenticated backend action.
3. `RELEASE_ELIGIBLE`, `RELEASE_AUTHORIZED`, `PAYOUT_SUBMITTED`, `PAYOUT_PROCESSING`, `RELEASED` and `REFUNDED` must not be conflated.
4. `SUBMITTED` or `REVISION_REQUESTED` milestones must never pass release policy.
5. A verified milestone without a real staged capture must not pass release policy.
6. Freelancer cannot authorize their own payout; unrelated users cannot authorize it.
7. The freelancer recipient must be configured and valid.
8. A contract must not become COMPLETED until its required milestones meet the actual completion policy, including financial settlement where the product defines that as a completion requirement.
9. Contract aggregate amounts must be derived or reconciled without double counting.
10. Manual review override must record the client, timestamp, rationale and prior state. It must not silently bypass all other financial checks.
11. Stale `RELEASE_AUTHORIZED` status must not bypass a revision request or failed payout state.
12. Cancellation, reclaim, failed payout and returned payout must have explicit, reversible or terminal rules.

### Required tests

Every state combination that should permit or deny payout, including verified/unfunded, submitted/funded, revision-requested/release-authorized, client vs freelancer, missing recipient, duplicate release, payout processing, payout success, payout failure and completed-contract guard.

### Workstream 8 completion gate

The backend state machine makes it impossible for AI, a stale UI state or a non-client user to authorize or falsely complete a payment/contract.

---

# 9. P1 — SSRF: protect the actual outbound connection against DNS rebinding

**Snapshot status: IMPROVED; additional investigation required.** The code validates URLs and revalidates each redirect, but a DNS time-of-check/time-of-use gap may remain if the HTTP client resolves the hostname again after validation.

### Relevant files

- `backend/app/services/verification/safety.py`
- `backend/app/services/verification/adapters/http_probe.py`
- `backend/app/services/verification/adapters/repo_meta.py`
- Tests in `backend/tests/test_ssrf_safety.py`

## Required investigation

1. Is the validated DNS answer pinned to the actual outbound socket connection?
2. Can DNS change between validation and connection?
3. Are all resolved A and AAAA addresses checked?
4. Are IPv4-mapped IPv6 and unusual address forms blocked correctly?
5. Are redirect targets resolved and validated again before the next connection?
6. Is the actual connection guaranteed to use the validated safe destination?
7. Are TLS certificate and hostname checks preserved if a custom resolver/transport is used?
8. Are response sizes, redirects and timeouts bounded?

Use a safe HTTP transport/resolver design that prevents the connection from being redirected to private/internal addresses after preflight validation. Do not disable TLS certificate validation.

### Required tests

- Loopback IPv4 and IPv6.
- RFC1918/private ranges.
- Link-local and cloud metadata addresses.
- IPv4-mapped IPv6.
- DNS returning both public and private addresses.
- DNS rebinding between validation and connection.
- Public URL redirecting to private IP.
- Redirect to metadata endpoint.
- Redirect loop and excessive hops.
- Embedded credentials.
- Non-HTTP scheme.
- Nonstandard port.
- Malformed hostname.

### Workstream 9 completion gate

The actual outbound connection cannot reach a blocked IP even if DNS or redirect behaviour changes after initial URL validation.

---

# 10. P1 — Migration and startup behaviour remains unsafe

**Snapshot status: NOT COMPLETE.** The startup path still contains a CLI failure branch that attempts `alembic stamp head` after any nonzero exit, and the separate lifespan migration call catches errors and continues. Startup also runs `create_all`/column healing after migration handling.

### Relevant files

- `backend/app/start.py`
- `backend/app/main.py`
- `backend/app/migrations.py`
- `backend/apply_migrations.py`
- `backend/alembic/env.py`
- `backend/alembic/versions/`
- `render.yaml`

## Required changes

1. Remove automatic `stamp head` after a generic migration failure.
2. Never mark the database at the latest revision unless all relevant migrations have actually been applied or a specifically reviewed baseline reconciliation procedure has proved the schema matches.
3. A “revision table out of sync” special case must not use broad string matching as proof that every schema change is present. Require explicit schema/revision validation and an operator-visible recovery command.
4. Do not catch a migration error, log it and start serving requests against an unknown schema.
5. Choose one migration owner. Avoid running overlapping Alembic migration paths in both `start.py` and FastAPI lifespan unless there is a deliberately designed deployment sequence.
6. Prefer a one-shot release/deploy migration step followed by application startup schema validation.
7. Do not use `SQLModel.metadata.create_all()` as a substitute for applying versioned migrations to an existing production database.
8. Do not swallow individual missing-column errors and then continue as if the schema is healthy.
9. Provide a clear failure message and prevent startup when required migration/schema validation fails.
10. Document backup and rollback/recovery procedures for production.

### Required tests

Fresh database, current database upgrade, migration failure, missing Alembic version table, unknown revision, partial schema, failed ALTER, DB outage, repeated startup and concurrent startup.

### Workstream 10 completion gate

A broken/partial migration cannot be silently stamped or hidden; the app does not serve requests against a schema it has not validated.

---

# 11. P1 — Demo seeding must never overwrite real profiles or financial records

**Snapshot status: PARTIAL.** Production seeding is guarded by an explicit setting, but `seed_database()` updates existing demo-email profiles with seed values, and the seed contains showcase payment/audit state. This must be made intentionally safe.

### Relevant files

- `backend/app/seed.py`
- `backend/app/start.py`
- `backend/app/config.py`
- `render.yaml`
- Database models for users, contracts, payments, payouts and audit.

## Required changes

1. Keep production demo seeding disabled by default.
2. An explicit production override must require deliberate operator action and be documented; avoid allowing an accidental environment default to activate it.
3. Never overwrite existing user profile fields merely because the email matches a demo email.
4. Never reset passwords or Supabase Auth identities through ordinary database seeding.
5. Never overwrite real PayPal transaction identifiers/status or real payout records with showcase values.
6. Label seeded demo financial records and demo audit events unambiguously as synthetic demo data.
7. Separate demo data from genuine provider-confirmed events in dashboards and reports.
8. Make seed operations idempotent without destructive profile/financial updates.
9. Provide an intentional reset script for disposable local/demo databases, not production startup.
10. Check whether the seeded payout recipient emails are actual configured PayPal sandbox recipients and ensure they are never presented as real freelancer payouts.

### Tests

- Production default startup does not seed.
- Production override is explicit and auditable.
- Existing user profile fields remain unchanged.
- Existing real payment/payout data remains unchanged.
- Repeated seed is idempotent.
- Seeded financial events are marked demo/simulated.
- Local disposable database reset works as documented.

### Workstream 11 completion gate

Production startup cannot overwrite users or present seeded historical financial activity as genuine PayPal events.

---

# 12. P1 — CORS and exception handling must not reflect arbitrary origins

**Snapshot status: NOT COMPLETE.** `main.py` uses the configured CORS allowlist/regex, but the global exception handler adds `Access-Control-Allow-Origin` from the request's arbitrary `Origin` header and includes credentials. This can bypass the intended CORS policy for error responses. The default regex also allows a family of Render frontend subdomains rather than only a single explicit production origin.

### Relevant files

- `backend/app/config.py`
- `backend/app/main.py`
- `render.yaml`
- `.env.example`
- `backend/.env.example`

## Required changes

1. Remove manual arbitrary-origin reflection from the exception handler.
2. Let the configured CORS middleware apply the allowlist consistently to successful and error responses.
3. Prefer exact production frontend origins.
4. Do not allow every `*.onrender.com` or every deploy-preview hostname unless the precise controlled preview policy requires it.
5. Validate origins as full scheme/host/port values; do not use substring checks.
6. Never combine wildcard origins with credentialed CORS.
7. Validate production CORS configuration at startup.
8. Keep localhost origins only in development/test configuration.
9. Do not expose exception internals, SQL statements, filesystem paths or credentials in 500 responses. Return a generic public message and log a safe correlation ID.

### Tests

Approved origin, unapproved origin, malformed origin, deceptive hostname, preview origin, credentials, error response and preflight OPTIONS.

### Workstream 12 completion gate

No API response, including a 500, grants credentialed CORS access to an unapproved origin.

---

# 13. P1 — Background verification must have a terminal, visible state

**Snapshot status: PARTIAL.** The verification service catches an unexpected error and reverts the milestone to SUBMITTED for review, which is safer than remaining VERIFYING. However, it does not establish a durable job record with a terminal failed state, attempt history and retry lifecycle. The status endpoint can report queued/pending based mainly on milestone state and whether a report exists.

### Relevant files

- `backend/app/services/verification_service.py`
- `backend/app/routers/deliveries.py`
- `backend/app/services/verification/orchestrator.py`
- Verification models and migrations.
- Frontend verification polling.

## Required investigation and change

Implement or document a persisted job lifecycle, preferably:

`QUEUED → RUNNING → COMPLETED`

Failure branch:

`QUEUED/RUNNING → FAILED`

Human review outcome:

`COMPLETED → NEEDS_REVIEW`

Persist:

- Job ID and delivery ID.
- Current state.
- Attempt count.
- Created/started/completed timestamps.
- Last safe error category/message.
- Provider/model used.
- Report ID when completed.
- Retry eligibility and retry count.

A job that failed must not appear as queued forever. A provider timeout may be retried with a bounded policy; malformed evidence and permanent validation errors should not be retried indefinitely.

If FastAPI `BackgroundTasks` remains the MVP execution mechanism, explicitly document that it is in-process and not a durable queue. Ensure a restart cannot leave the UI permanently waiting without a visible failed/interrupted state. Do not claim durable distributed processing.

### Tests

Successful task, provider timeout, orchestrator exception, missing actor, database failure, process restart/interruption simulation, retry, retry exhaustion and client/freelancer polling permissions.

### Workstream 13 completion gate

Every verification job reaches a visible terminal outcome or a clearly recoverable interrupted state. It cannot silently remain queued forever.

---

# 14. P1 — Backend CI and regression coverage

**Snapshot status: IMPROVED.** The 9 November ZIP's GitHub Actions workflow includes a backend pytest job and a frontend TypeScript/build job. Preserve this. Verify that the job really runs the complete suite and uses deterministic isolated test configuration.

### Relevant files

- `.github/workflows/ci.yml`
- `backend/requirements.txt`
- `backend/tests/`
- `backend/pytest.ini`
- Root and `react_app` package manifests/lockfiles.

## Required changes and investigation

1. Confirm CI runs every backend test file, including `test_auth_security.py`, `test_paypal_integrity.py` and `test_ssrf_safety.py`.
2. Check whether tests make live network calls; mock PayPal, Supabase, Groq, OpenRouter, DeepSeek and GitHub API interactions.
3. Use an isolated SQLite/test database only where compatible; otherwise provision a disposable PostgreSQL test service.
4. Make sure demo seeding is disabled in CI unless a test explicitly invokes a seed fixture.
5. Ensure `ENVIRONMENT=test` plus `ALLOW_DEV_AUTH_TOKENS=true` is limited to the test process and does not leak to deployment config.
6. Keep Node 20 aligned with root package engine requirements.
7. Run `npm ci`, TypeScript checks and production build for the correct workspace.
8. Consider adding linting and dependency/security scanning only if the project can keep these checks stable and actionable.
9. Do not deploy if backend or frontend gates fail.
10. Confirm the Render deployment hook is not accidentally called for pull requests.

### Important test correction

Search all tests for old synthetic success behaviour. The snapshot contains an older `test_paypal_capture_resilience` in `test_e2e_lifecycle.py` that manually sets `SANDBOX-CAP-422-RECOVERED` and treats a fabricated 422 recovery as success. Rewrite/remove this outdated test so it asserts that declined/unapproved/ambiguous captures do not fund a milestone. Do not keep one test that contradicts the newer `test_paypal_integrity.py` behaviour.

Also inspect tests that imply:

- HTTP 403/429 is a passed verification checkpoint.
- Vision fallback passes by default.
- Repository format or API failure counts as successful inspection.
- Local reset counts as a completed refund.
- Payout batch submission equals recipient payment completion.

Tests must encode the safe current product policy, not historical behaviour.

### Workstream 14 completion gate

CI reliably runs backend security/financial tests and frontend build checks; legacy tests no longer reward synthetic payment or verification success.

---

# 15. P1 — Documentation and judge demo must match the implementation

**Snapshot status: NOT FULLY RECONCILED.**

### Files

- `README.md`
- `backend/README.md`
- `react_app/README.md`
- `docs/JUDGE_DEMO.md`
- `docs/TrustBroker_AI_Hackathon_Roadmap.md`
- `docs/TrustBroker_AI_Session_Development_Log.md`
- `md_artifacts/TrustBroker_AI_Status_Report.md`
- `md_artifacts/DEVPOST_SUBMISSION.md`
- `md_artifacts/TrustBroker_AI_Demo_Script.md`

## Required changes

1. Verify every documented endpoint exists and its method/path matches the current router.
2. Correct stale route references in judge instructions and READMEs.
3. Confirm local setup commands and Node/Python versions match package/runtime requirements.
4. Confirm environment variable names exactly match `config.py`, Render and `.env.example` files.
5. Ensure the demo uses actual current route paths, disposable judge accounts and a reproducible test sequence.
6. Remove any unsupported claim of real escrow, guaranteed payment, instant payout, completed refund or fully automatic verification.
7. Distinguish PayPal sandbox activity from live provider activity.
8. Distinguish payout submitted/processing from provider-confirmed success.
9. Explain where human review is required.
10. Replace stale status claims such as “100% complete” unless every relevant completion gate has passed and is backed by evidence.
11. Check all relative Markdown links in the root and `docs/` directories.
12. Keep the development log historical; do not rewrite history. Add a dated status update that accurately explains current fixes and known limitations.

### Workstream 15 completion gate

A judge following the README and demo guide can reproduce the actual workflow without encountering nonexistent routes, unsupported promises or misleading payment/verification claims.

---

# 16. P2 — Additional operational and product-integrity investigation

These items are not all confirmed defects in the latest snapshot. Investigate them and fix only where the current source proves a gap.

## 16.1 Authentication claims and JWT validation

- Verify issuer, audience, algorithm and expiry handling for the actual Supabase token configuration.
- The snapshot uses `verify_aud=False`. Confirm why this is necessary and whether issuer/subject checks fully constrain token acceptance.
- Review optional-auth endpoints to ensure invalid supplied credentials cannot silently downgrade to anonymous access.
- Confirm profile upsert cannot allow a token to change an existing user's authorization role or workspace identity.

## 16.2 AI provider and evidence prompt safety

- Validate provider response JSON before it reaches business logic.
- Keep evidence text separate from system instructions.
- Do not let content in a submitted README/document tell the model to approve a criterion or ignore the contract.
- Bound input lengths, document extraction size, image sizes and model output tokens.
- Avoid logging full evidence content or secrets.
- Record actual provider/model and fallback mode.

## 16.3 Financial aggregate reconciliation

- Recompute or verify `staged_amount` and `released_amount` from authoritative attempts/payouts.
- Detect and repair historical drift without silently rewriting provider records.
- Make all amount changes idempotent.
- Ensure one milestone cannot be funded or released twice.
- Ensure amounts/currency use `Decimal`, never floating-point arithmetic for ledger state.
- Ensure currency conversions are not implied unless an actual FX service is integrated.

## 16.4 Notifications and audit events

- Notifications must be generated from committed state transitions.
- Do not send “funded”, “released”, “refunded” or “completed” notification before provider confirmation.
- Duplicate webhooks must not duplicate notifications.
- Audit events should identify actor and source (client, freelancer, AI assessment, PayPal webhook, scheduled process, administrator).
- Never imply AI was the financial authorizer.

## 16.5 Demo data integrity

- Identify every seeded payment attempt, payout, verification report and audit event.
- Clearly distinguish simulated historical data from actual provider responses.
- Do not use demo seed records to prove a live PayPal flow works.
- Use disposable accounts and data for judge walkthroughs.

---

# 17. Required end-to-end regression journey

After P0 workstreams pass independently, run a full workflow with disposable client/freelancer accounts and PayPal sandbox credentials.

## Scenario A — Authentication and role isolation

1. Client signs in through Supabase.
2. Freelancer signs in through Supabase.
3. Invalid/expired token is rejected.
4. Production rejects both known and arbitrary `dev-user-*` tokens.
5. Client cannot invoke freelancer-only actions.
6. Freelancer cannot invoke client-only actions.
7. Workspace switching changes presentation only, never backend identity.

## Scenario B — Marketplace and agreement

1. Client creates a project.
2. AI drafts a structured SOW.
3. Client edits the criteria and milestones.
4. Project is published.
5. Freelancer views and applies.
6. Client evaluates and awards freelancer.
7. Freelancer accepts the correct agreement version.
8. Both acceptances are persisted and auditable.
9. Attempt to modify active agreement structure is rejected or creates a properly versioned re-acceptance flow.

## Scenario C — PayPal funding

1. Client creates one funding order.
2. Client approves it using PayPal sandbox.
3. Backend captures the order.
4. Backend validates provider-issued capture ID, exact amount, currency and order/milestone reference.
5. Milestone becomes staged only on provider-confirmed completion.
6. Duplicate requests/events do not duplicate funding.
7. Declined/unapproved/ambiguous outcomes remain unfunded.

## Scenario D — Evidence

1. Freelancer uploads actual screenshot, document and/or ZIP evidence.
2. Backend verifies uploader ownership and durable storage.
3. Freelancer submits delivery against the funded milestone.
4. Evidence remains accessible after refresh and new login session.
5. Client can review the submitted artifacts.
6. Another user cannot access or attach those files.

## Scenario E — AI verification

1. Each criterion is assessed using the appropriate available evidence.
2. AI receives only actual evidence facts/content.
3. Every criterion result references its evidence.
4. Provider/model attribution is exact.
5. Missing provider, missing file, unreadable evidence or ambiguous result becomes NEEDS_REVIEW.
6. Failed criteria become FAIL.
7. Only genuinely satisfied criteria become PASS.
8. Overall pass requires all required criteria to pass.
9. AI does not change payment authorization state.

## Scenario F — Client approval and payout

1. A passed milestone becomes available for client review.
2. Client manually inspects and explicitly approves release.
3. Backend re-checks client identity, verified milestone, real staged capture and payout recipient.
4. PayPal Payouts API is called using idempotency.
5. Pending/processing is shown as processing.
6. Only provider-confirmed item success changes payment to released.
7. Freelancer receives accurate notifications.
8. Duplicate requests/events do not double-release or double-count amounts.

## Scenario G — Reclaim/refund

1. Unapproved checkout is cancelled, not refunded.
2. Captured payment cannot be described as refunded before the provider confirms it.
3. Actual refund, if implemented, references real capture/refund IDs.
4. Local sandbox reset has a distinct label and state.
5. Revision blocks release.
6. Any seven-day policy is enforced by backend time/state checks, not a frontend countdown.

## Scenario H — Security regression

Attempt unauthorized contract access, cross-user evidence access, forged storage path, path traversal, malicious upload, DNS rebinding, redirect to a private IP, forged webhook, duplicate webhook, duplicate checkout, duplicate payout and arbitrary CORS origin. The backend must reject or safely flag each case.

---

# 18. Final execution order

Execute the remaining work in this order; do not skip to visual polish:

1. Remove false-positive verification paths in vision, repository, document, ZIP, HTTP and text adapters.
2. Connect and validate actual AI criterion assessment in the orchestrator.
3. Enforce evidence upload ownership, durable private storage and safe file reading.
4. Complete PayPal capture field validation and checkout idempotency/concurrency.
5. Complete webhook resource validation and event retry/idempotency.
6. Complete payout reconciliation, UI states and accounting idempotency.
7. Correct refund/reclaim terminology and provider semantics.
8. Revalidate policy, milestone and contract state transitions.
9. Harden SSRF at connection time against DNS rebinding.
10. Remove unsafe migration stamping/startup error swallowing.
11. Protect production seeding and financial demo records.
12. Correct CORS origin handling and exception responses.
13. Complete verification job terminal states and retry visibility.
14. Run backend/frontend CI and replace outdated tests.
15. Reconcile documentation and judge demo.
16. Run the full end-to-end regression journey.

---

# 19. Final sign-off checklist

| Gate | Required evidence for PASS |
|---|---|
| Verification adapters | Negative provider/evidence cases never return PASS |
| AI evaluator | Actual evaluator is used, output is validated, actual model is recorded |
| Evidence storage | Server-owned upload, durable private object, ownership checks, safe read/download |
| PayPal capture | Exact provider ID/status/amount/currency/reference validated; idempotent |
| Webhooks | Signature, event resource, amount/currency and relationships validated; retry-safe |
| Payouts | No synthetic success; provider item status reconciled; accurate UI and accounting |
| Refund/reclaim | No false refund claim; captured funds and provider refund state correctly handled |
| Policy | Only client-authorized, eligible, verified and genuinely funded milestone can release |
| SSRF | Connection-level protection and redirect tests pass |
| Migrations | No automatic stamp after failed migration; schema validation blocks unsafe startup |
| Seeding | No unintended production profile or financial overwrite |
| CORS | No arbitrary Origin reflection; exact trusted origins only |
| Background jobs | Every job has completed, failed, review-required or recoverable interrupted state |
| CI | Backend tests, frontend type checks and build run successfully |
| Documentation | Routes, setup, financial claims and demo instructions match current code |
| E2E | Full client-to-freelancer path passes with provider-truth states |

## 20. Final report required from the coding agent

Produce a final engineering report with:

1. **Executive summary:** what changed and what remains.
2. **Workstream matrix:** PASS / PARTIAL / FAIL / NOT TESTED for each section.
3. **Source change log:** every changed file and why.
4. **Database changes:** migration IDs and deployment steps.
5. **Tests:** exact commands, actual test count, passed, failed, skipped and reasons.
6. **Provider tests:** indicate which were mocked and which used PayPal sandbox/GitHub/AI services.
7. **Security tests:** authentication, storage ownership, path traversal, SSRF, webhook and CORS results.
8. **Known limitations:** especially sandbox, payouts, refunds and background processing.
9. **Demo honesty audit:** every displayed payment, payout, refund and verification state must be classified as provider-confirmed, pending, manual-review or explicitly simulated.
10. **Deployment requirements:** environment variables, Supabase bucket/RLS configuration, PayPal webhook ID, migrations and judge-account setup.
11. **Remaining blockers:** identify all P0s that prevent a trustworthy submission.

**Definition of done:** A client and freelancer can complete the product's supported workflow; uploaded evidence is truly stored and assessed; payment and payout UI states reflect provider truth; AI cannot authorize money; security boundaries are enforced by the backend; and every claim in the README and judge demo is supported by the current implementation.
