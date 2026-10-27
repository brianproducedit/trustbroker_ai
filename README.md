# TrustBroker AI

> Implementation roadmap: [`docs/TrustBroker_AI_Hackathon_Roadmap.md`](docs/TrustBroker_AI_Hackathon_Roadmap.md)

**The trust layer between clients and freelancers.** Describe the work. Hire with evidence. Pay when the milestone checks out.

TrustBroker AI drafts milestone contracts from plain language, publishes them as open work, ranks freelancer applications, funds milestones through PayPal, and inspects deliverables against acceptance criteria before a PayPal payout. AI never moves money — a policy engine and verified PayPal state do.

Product language is **client** and **freelancer**. This is PayPal-secured milestone coordination, not a licensed bank or escrow company.

## What it does

1. Client drafts a statement of work with AI and publishes an **open contract**.
2. Freelancers apply. AI vets applicants (including newcomers with a portfolio and no completed jobs).
3. The client awards one freelancer; others are notified.
4. The client funds the next milestone with PayPal.
5. The freelancer submits evidence. AI verifies each criterion.
6. When verification and policy pass, TrustBroker sends a PayPal payout.

Details, phases, and prize strategy: [Hackathon Execution Roadmap](docs/TrustBroker_AI_Hackathon_Roadmap.md). Product background: [Project Guide](docs/TrustBroker_AI_Project_Guide.md).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Ledger | AG Grid Community (AG Studio in a later phase) |
| Backend | Python, FastAPI |
| Auth, DB, files | Supabase |
| AI | Groq (primary) → OpenRouter free models. **No Gemini.** |
| Payments | PayPal Orders, capture, webhooks, Payouts (sandbox for this build) |
| Hosting | Render |

## Local run

**Frontend**

```bash
cd react_app
npm install
npm run dev
```

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Copy env templates if present (`.env.example`). Never commit secrets. Judge accounts will live in `docs/JUDGE_DEMO.md` (later phase) — there is no one-click demo login in the product UI.

## License

[MIT](LICENSE)
