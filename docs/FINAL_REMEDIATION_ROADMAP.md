# TrustBroker AI — Final Remediation Roadmap

This is the public release checklist for the PayPal AI Hackathon submission.

## Completed

- PayPal Orders v2 and Payouts API responses are used for provider state; failed calls
  do not create synthetic provider identifiers.
- AI verification receives structured adapter observations and treats submitted content
  as untrusted evidence rather than instructions.
- Missing, unreadable, unsupported, or ambiguous evidence remains `NEEDS_REVIEW`.
- Manual review state changes occur only after a confirmed backend response.
- PayPal webhook retries distinguish processed events from retained events requiring
  reconciliation, without inserting duplicate provider events.
- Frontend mock contract fixtures are removed; authenticated contract state comes from
  the backend database.
- Product terminology describes milestone funding, staged funds, verification, review,
  and payout coordination. TrustBroker does not claim to be a bank, escrow provider,
  or autonomous money-moving agent.

## Deliberately deferred

- Streaming uploads for evidence files above the current 25 MB request limit.
- Live Supabase Storage integration tests in CI; provider behavior is covered through
  mocked SDK and failure-path tests where available.
- Database row locking for simultaneous checkout creation; active checkout attempts are
  reused and provider requests use idempotency-aware handling.
- Provider-confirmed refunds; no unsupported refund completion is claimed.

## Final release gates

1. Run `backend\.venv\Scripts\python.exe -m pytest -q`.
2. Run `npm --prefix react_app run lint`.
3. Run `npm --prefix react_app run build`.
4. Rehearse sandbox funding, evidence review, client authorization, payout submission,
   and ledger reconciliation on the deployed services.
5. Record a demo under three minutes and submit only claims supported by the deployed
   build and provider records.
