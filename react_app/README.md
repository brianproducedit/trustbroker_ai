# 🛡️ TrustBroker AI — React TypeScript Web Application

> **PayPal AI Hackathon 2026** · Submission for **Best Use of PayPal + AI** & **Best Use of Agentic Commerce**

TrustBroker AI decouples cross-border digital payments from subjective disputes through automated AI statement of work verification, PayPal Sandbox escrow coordination, and tamper-proof event logging.

---

## 🚀 Key Features

1. **AI Natural Language to Statement of Work (SOW)**
   - Input loose, unstructured project briefs and synthesize machine-testable milestone criteria via Groq LPU (`llama-3.3-70b-versatile`).
   - Dual-sided acceptance workflow for buyers and international suppliers.

2. **PayPal Sandbox Conditional Holding Reserves**
   - Direct integration using `@paypal/react-paypal-js` and PayPal Orders v2 API.
   - Funds are pre-authorized and held safely in sandbox reserves before work begins.

3. **Inspection Bay & Automated Verification**
   - Suppliers submit deliverable evidence (GitHub repository URLs, preview deployments, test logs).
   - Groq LPU evaluates submitted evidence against agreed criteria and outputs a structured confidence assessment (0-100%).
   - Automatic authorization of conditional PayPal disbursement once threshold is satisfied.

4. **Institutional Contract Ledger (AG Grid Community)**
   - High-performance, filterable, and sortable transaction dashboard with live audit feed.

5. **Tamper-Proof Audit Logging**
   - Chronological event timeline recording every contract update, signature, payment reserve, and AI verification with SHA-256 state hashes.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom Fintech Tokens
- **Typography**: Lexend (body & headlines) + JetBrains Mono (code & hashes)
- **Data Grid**: AG Grid Community v36
- **State Management**: Zustand
- **Payment Processing**: PayPal JS SDK Sandbox (`@paypal/react-paypal-js`)
- **AI Assessment**: Groq LPU (`llama-3.3-70b-versatile`) + OpenRouter fallback (`gemma-4-27b`)

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Navigate to the react_app directory
cd react_app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 🗺️ Application Routes

| Path | Description |
|---|---|
| `/` | Landing page, AI brief intake generator, inspection pipeline preview |
| `/sign-in` | Authentication with 1-click test login for Buyer and Supplier |
| `/sign-up` | Registration with role selection (Buyer / Supplier) |
| `/dashboard` | Dark-themed contract ledger, metrics cards, AG Grid table & inspection bay |
| `/contract/:id` | SOW review, milestones breakdown, digital acceptance, and PayPal Sandbox checkout |
| `/deliver/:id` | Evidence submission form, Groq LPU AI verification evaluation, and release authorization |
| `/contract/:id/activity` | Tamper-proof audit activity timeline with record hashes |
| `/developers` | API reference, cURL / Python client snippets, and REST endpoints |
