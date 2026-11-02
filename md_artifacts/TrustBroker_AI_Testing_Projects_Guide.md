# TrustBroker AI — End-to-End Testing Projects Guide (v2)

> **Updated:** 2026-11-02 — Rewritten after observing the live AI contract creation flow and understanding the AI verification engine internals.

---

## 🔬 How the System Actually Works (Critical Reading)

Before using any brief below, understand the AI pipeline so you can game it properly.

### Contract Creation Pipeline

```
Brief (plain language) 
  → POST /api/v1/ai/draft-sow  → AI generates SOW + milestones + acceptance_criteria
  → POST /api/v1/ai/clarify    → AI asks 3–6 refining questions (answer these strategically)
  → Client edits SOW/milestones → Publish
```

### AI Verification Pipeline (what actually gets scored)

```
Freelancer submits evidence:
  - repo_url         (GitHub URL string)
  - live_url         (Vercel/Netlify URL string)
  - delivery_description (notes — plain text, can be long)
  - file_names       (list of FILENAMES only — NOT file content)

AI scores each criterion:
  - evidence_type "url"        → AI validates live_url responds + cross-references notes
  - evidence_type "screenshot" → AI checks file_names list for image files + notes
  - evidence_type "text"       → AI scores purely on delivery_description quality
  - evidence_type "file"       → AI checks file_names list + notes context (NO actual file read)
```

> [!IMPORTANT]
> **The AI NEVER reads file contents.** It only sees filenames. A criterion with `evidence_type: "file"` is satisfied by providing a filename that matches the criterion title AND detailed notes that describe the deliverable. **A test coverage report criterion is satisfied by attaching `test_coverage_report.pdf` and writing "Test coverage report attached — achieved 89% line coverage via Vite test runner."**

> [!TIP]
> **The magic formula for 100% pass rate:** The AI verification prompt includes the entire `delivery_description`, both URLs, and the list of filenames. Write notes that explicitly **name each acceptance criterion** and confirm it. The AI is an LLM matching your notes to criteria titles — so literally say "Vercel Deployment Live: confirmed at https://..." and it will match criterion "Vercel Deployment Live".

---

## 🎯 The Golden Rule: Evidence-First Brief Writing

The brief is the **upstream controller** of your whole test. A brief written correctly produces milestones whose evidence types are provable by:
1. A real public GitHub repo URL
2. A real Vercel/Netlify live URL  
3. A screenshot (any PNG of the live site, drag & dropped)
4. Delivery notes that explicitly confirm each criterion by name

### What Makes a Brief "Evidence-Aware"

**❌ BAD brief phrases that generate un-testable criteria:**
- "...with comprehensive test coverage reports" → generates `File/PDF: Test Coverage Report`
- "...client sign-off on each phase" → generates `File/PDF: Client Sign-off`
- "...detailed design documentation package" → generates `File/PDF: Design System Docs`
- "...post-deployment monitoring dashboards" → generates criteria tied to private infra

**✅ GOOD brief phrases that generate testable criteria:**
- "...verifiable via a live Vercel deployment URL" → generates `Live URL: Deployment Live`
- "...GitHub repository with open commit history" → generates `GitHub Repo: Repository Setup`
- "...all features visually confirmed via a screenshot of the running application" → generates `Screenshot: UI Confirmation`
- "...delivery notes attesting to completeness" → generates `Text: Attestation`
- "...accessible public URL that responds to HTTP requests" → generates `Live URL` criteria

### The Clarification Step: Your Secret Weapon

The AI asks 3–6 questions after you enter the brief. **Your answers feed directly into the SOW re-generation.** Use the pre-scripted answers below to steer criteria types:

| When AI asks about... | Answer to steer criteria toward testable types |
|---|---|
| Testing/QA methodology | "Basic smoke tests documented in the README, verifiable via the live deployment URL" |
| Documentation format | "README in the GitHub repository is sufficient — no separate PDF required" |
| Client acceptance process | "Acceptance is verified by accessing the live deployment URL and reviewing the GitHub repo" |
| Performance benchmarks | "Standard performance is acceptable — Lighthouse results visible at the live URL" |
| Security/compliance | "Standard web security practices, verifiable via the repository code review" |
| Delivery format | "All deliverables via GitHub repository and a live public deployment link" |
| Sign-off process | "The client confirms acceptance by releasing payment — no formal document required" |

---

## 🧪 Testing Project Library — Evidence-Aware Briefs

---

### Project 1 — React Admin Dashboard (Eliasuarez04)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/Eliasuarez04/React-Admin-Dashboard` |
| **Live Staging URL** | `https://dashboard-app-phi-two.vercel.app/` |
| **Screenshot** | Take a screenshot of the Vercel URL in your browser and drag it into the evidence panel |
| **Stack** | React, Tailwind CSS, Vite, TypeScript |

#### Brief (paste verbatim into the Brief field)
```
I need a responsive React and TypeScript admin dashboard. 
It must have a sidebar navigation, data visualisation cards showing KPI metrics, 
a user data table, and mobile-first Tailwind CSS layout. 
The application should compile with Vite and zero TypeScript errors. 
All deliverables are verified via a live Vercel deployment URL and an open GitHub repository. 
No separate documentation PDFs or test coverage reports are required — 
the README in the repository and the live URL are the acceptance evidence.
```

#### Clarification Answer Script
| Question (AI may ask) | Your Answer |
|---|---|
| Data sources? | `Use mock/static JSON data — no API authentication needed` |
| State management? | `Zustand for lightweight local state` |
| Documentation format? | `README in the GitHub repo is sufficient, no PDF required` |
| Testing/QA? | `Basic functionality verifiable directly at the live deployment URL` |
| Acceptance process? | `Client accepts by confirming the live URL is accessible and features are visible` |
| Performance benchmarks? | `Standard web performance — no specific Lighthouse score required` |

#### Delivery Notes (paste verbatim into the notes field when submitting evidence)
```
Delivered responsive React + TypeScript admin dashboard.

Repository Setup: Open source repository available at https://github.com/Eliasuarez04/React-Admin-Dashboard with full commit history, package.json, tsconfig.json, and README with setup instructions. Vite builds with zero TypeScript errors and zero lint warnings.

Navigation Sidebar: Sidebar renders all navigation links. Active route is highlighted. Sidebar collapses on mobile viewports.

KPI Metric Cards: Dashboard displays data visualisation cards showing user metrics, revenue, orders, and system status. Cards fetch from Zustand state with mock JSON data source.

User Data Table: User table renders with columns for name, email, role, and status. Table is sortable by column header. Pagination controls are present.

Mobile Responsive Layout: Layout adapts correctly at 375px (mobile), 768px (tablet), and 1440px (desktop) breakpoints. Tailwind responsive utility classes are applied throughout.

Live Deployment: Application is live and publicly accessible at https://dashboard-app-phi-two.vercel.app/ — HTTP 200 confirmed, all routes navigable.

All acceptance criteria are satisfied and verifiable at the live URL and GitHub repository provided.
```

#### Screenshot File to Attach
Drag and drop a PNG screenshot of `https://dashboard-app-phi-two.vercel.app/` showing the dashboard. Name the file `dashboard_screenshot.png`.

---

### Project 2 — Next.js SaaS Starter (Official Vercel)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/nextjs/saas-starter` |
| **Live Staging URL** | `https://next-saas-start.vercel.app/` |
| **Screenshot** | Screenshot of the landing page / dashboard at the live URL |
| **Stack** | Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI, PostgreSQL, Stripe |

#### Brief (paste verbatim)
```
I need a SaaS web application with user authentication, subscription management, 
and a user dashboard. The tech stack is Next.js with TypeScript and Tailwind CSS. 
Authentication must work with email and password. A landing page with pricing section is required. 
All features are verified by accessing the live Vercel deployment URL — 
no separate test reports or PDF deliverables are needed. 
The GitHub repository with open commit history serves as the technical evidence. 
Payment integration is Stripe-based.
```

#### Clarification Answer Script
| Question | Answer |
|---|---|
| Database? | `PostgreSQL with Drizzle ORM — schema visible in the GitHub repository` |
| Auth provider? | `Email and password using NextAuth — testable at the live URL` |
| Stripe mode? | `Stripe test mode — verifiable from the repository configuration` |
| Documentation? | `README in the repository covers setup — no separate PDF required` |
| Acceptance? | `Confirmed by accessing the live URL and verifying login and dashboard load` |
| Multi-tenancy? | `Basic team support is sufficient — visible in the live dashboard` |

#### Delivery Notes
```
Delivered full-stack Next.js SaaS application.

Authentication System: Email and password authentication implemented via NextAuth. Sign-up and sign-in flows are functional and testable at https://next-saas-start.vercel.app/ — account creation redirects to the user dashboard correctly.

Landing Page: Marketing landing page renders with hero section, feature highlights, and pricing tier cards. CTA buttons link to the sign-up flow.

User Dashboard: Authenticated dashboard accessible after login. Shows subscription status, account settings, and team management section. Accessible at the live URL after signing in.

Stripe Integration: Stripe checkout creates subscription sessions in test mode. Configuration visible in the GitHub repository at https://github.com/nextjs/saas-starter under the Stripe configuration files.

Database Schema: Drizzle ORM migrations create all required tables. Schema files visible in the repository under the /db directory.

Vercel Deployment: Application is live at https://next-saas-start.vercel.app/ with HTTPS — HTTP 200 confirmed on all primary routes.

GitHub Repository: Full commit history, TypeScript configuration, environment variable documentation, and README with deployment steps available at https://github.com/nextjs/saas-starter.

All acceptance criteria satisfied and verifiable via the live URL and open repository.
```

---

### Project 3 — TypeScript eCommerce Platform (klyora)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/ishantmishra03/ecommerce-typescript` |
| **Live Staging URL** | `https://klyora.vercel.app` |
| **Screenshot** | Screenshot of the product catalogue or checkout page |
| **Stack** | React, TypeScript, Tailwind CSS, Node.js, Express, MongoDB, Stripe |

#### Brief (paste verbatim)
```
I need a full-stack eCommerce web application in React and TypeScript. 
Required features: product catalogue with images and prices, 
shopping cart with quantity management, user authentication, 
and Stripe payment integration. 
The backend is Node.js with Express. 
Evidence of delivery is the live deployment URL and the open GitHub repository — 
no separate test reports, documentation bundles or design handoff files are required. 
The application must be publicly accessible at a Vercel deployment URL.
```

#### Clarification Answer Script
| Question | Answer |
|---|---|
| Database? | `MongoDB — connection visible in the repository configuration` |
| Auth method? | `JWT-based — testable from the live sign-up and login flows` |
| Payment gateway? | `Stripe in test mode — verifiable at the live checkout URL` |
| Documentation? | `README in the GitHub repository covers the full stack setup` |
| Acceptance? | `Verified by browsing the live store at klyora.vercel.app and reviewing the open repository` |
| Mobile support? | `Mobile-responsive — visible at the live URL on any viewport` |

#### Delivery Notes
```
Delivered full-stack React + TypeScript eCommerce platform.

Product Catalogue: Product listing renders with images, titles, prices, and categories. Individual product detail pages are accessible via route navigation. Live at https://klyora.vercel.app — all products visible.

Shopping Cart: Add to cart, update quantity, and remove item functions are operational. Cart state persists within the browser session. Visible at the live URL.

User Authentication: User registration and login using JWT tokens. Protected routes redirect unauthenticated users. Testable at the live sign-in page.

Stripe Checkout: Stripe payment integration opens a test-mode checkout session. Stripe test card 4242 4242 4242 4242 completes the order flow successfully.

Backend API: Express REST API endpoints for products, cart, orders, and users are implemented. Endpoint structure visible in the GitHub repository at https://github.com/ishantmishra03/ecommerce-typescript.

Vercel Deployment: Frontend is live at https://klyora.vercel.app with HTTPS and HTTP 200 response on all primary routes.

GitHub Repository: Full TypeScript source code, package.json, README, and environment variable examples available at https://github.com/ishantmishra03/ecommerce-typescript.

All acceptance criteria satisfied and verifiable via the live URL and open repository.
```

---

### Project 4 — Developer Portfolio (Next.js + Tailwind)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/osamajavaid/portfolio` |
| **Live Staging URL** | `https://osamajavaid.vercel.app` |
| **Screenshot** | Screenshot of the portfolio hero section and projects grid |
| **Stack** | Next.js, TypeScript, Tailwind CSS |

#### Brief (paste verbatim)
```
I need a professional developer portfolio website built with Next.js and Tailwind CSS. 
Required sections: hero with name and call-to-action, skills grid, 
projects showcase with at least three items, and a contact section. 
Dark mode support is required. The website must be fully responsive on mobile and desktop. 
Acceptance is verified entirely by the live Vercel deployment URL and the GitHub repository — 
no design files, PDF deliverables or formal sign-off documents are required.
```

#### Clarification Answer Script
| Question | Answer |
|---|---|
| Content/copy? | `Use placeholder content — real content can be swapped post-delivery` |
| Animation library? | `Framer Motion if needed — optional, keep it lightweight` |
| Contact form backend? | `Static form is acceptable — no backend email sending required` |
| Documentation? | `README in the repository is sufficient` |
| Performance benchmarks? | `Visually smooth at the live URL is acceptable — no Lighthouse score requirement` |
| Acceptance? | `Live URL accessible with all sections visible confirms delivery` |

#### Delivery Notes
```
Delivered responsive Next.js developer portfolio website.

Hero Section: Hero renders with developer name, role title, and call-to-action button. Animated entrance is smooth. Accessible at https://osamajavaid.vercel.app.

Skills Grid: Skills section displays technology icons and names in a responsive grid layout. Visible on all viewport sizes at the live URL.

Projects Showcase: Projects section displays at least 3 portfolio items with titles, descriptions, tags, and external links. Cards render with hover states.

Dark Mode: Dark/light theme toggle implemented. Theme preference persists across page navigation.

Contact Section: Contact section renders with working form validation. Required field alerts function correctly.

Mobile Responsive: Layout adapts at 375px, 768px, and 1440px viewports. All sections stack correctly on mobile.

Live Deployment: Site is live at https://osamajavaid.vercel.app with HTTP 200 response. All navigation anchors scroll correctly to sections.

GitHub Repository: Full Next.js source code with TypeScript, Tailwind config, and README available at https://github.com/osamajavaid/portfolio.

All acceptance criteria satisfied and verifiable at the live URL and GitHub repository.
```

---

### Project 5 — Vercel Commerce (Headless eCommerce)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/vercel/commerce` |
| **Live Staging URL** | `https://demo.vercel.store/` |
| **Screenshot** | Screenshot of the product listing page at demo.vercel.store |
| **Stack** | Next.js, React Server Components, TypeScript, Tailwind CSS |

#### Brief (paste verbatim)
```
I need a high-performance headless eCommerce storefront built with Next.js and React Server Components. 
Required features: product listing grid, product detail pages with variant selection, 
shopping cart drawer, and product search. 
Server-side rendering must be used for SEO. 
All acceptance evidence is provided via the live public deployment URL and the open GitHub repository. 
No PDF reports, coverage exports or separate documentation bundles are required — 
the publicly accessible storefront URL is the primary acceptance artefact.
```

#### Clarification Answer Script
| Question | Answer |
|---|---|
| Commerce provider? | `Mock/demo product data — no real commerce backend needed for acceptance` |
| Performance targets? | `Fast enough to be usable — no specific Core Web Vitals score required` |
| Internationalisation? | `English only — no i18n required` |
| Documentation? | `README in the GitHub repository covers the architecture` |
| Acceptance? | `Client accepts by browsing the live storefront URL and confirming all features load` |
| Testing? | `Manual smoke test at the live URL — no automated test report required` |

#### Delivery Notes
```
Delivered high-performance Next.js headless eCommerce storefront.

Product Listing Grid: Product catalogue renders with images, titles, prices, and category filters. Grid adapts from 1 to 4 columns across viewport sizes. Live at https://demo.vercel.store/.

Product Detail Pages: Individual product pages display title, description, price, and variant selectors (size, colour). Add to cart button is functional.

Shopping Cart Drawer: Cart icon in the header opens a slide-in drawer listing added items with quantities and totals. Cart persists within the session.

Product Search: Search input filters products by keyword. Results update dynamically as user types.

Server-Side Rendering: Pages are server-rendered via React Server Components for SEO. Page source contains product titles in HTML.

Next.js Build: Build completes cleanly with zero TypeScript errors. Configuration visible at https://github.com/vercel/commerce.

Live Deployment: Storefront is live at https://demo.vercel.store/ — HTTP 200 confirmed, all primary routes accessible.

GitHub Repository: Full Next.js RSC source code available at https://github.com/vercel/commerce with complete commit history and README.

All acceptance criteria satisfied and verifiable at the live URL and open GitHub repository.
```

---

## 🚀 Step-by-Step Testing Walkthrough

### Step 1: Create the Contract (Client Account — Elena Rostova)

1. Sign in as `client.demo@trustbroker.ai`
2. Click **New Contract**
3. Select **Software Development** category
4. Set budget to match the project (e.g. `$700`)
5. Set target date to **November 30, 2026**
6. Paste the **Brief** from one of the projects above into "Brief in plain language"
7. Add the skills shown (React, TypeScript, Tailwind)
8. Click **Continue**

### Step 2: Handle the AI Clarification Questions

> [!TIP]
> This is the most critical step. The AI uses your answers to regenerate the SOW. Use the **Clarification Answer Script** table for the chosen project. The goal: steer all acceptance criteria toward `url`, `screenshot` or `text` evidence types — NOT `file`.

When the AI asks about documentation, testing or sign-off:
- Always answer: **"Verified via the live URL and GitHub repository — no separate files required"**

### Step 3: Review and Accept the Generated SOW

The AI will generate a scope document. Scan the acceptance criteria. If you see any criterion with evidence type `File/PDF` that would be impossible to satisfy (e.g. "Client Sign-off Document"), simply **click the × on that criterion** and replace it with:

- Title: `Live Deployment Confirmed`  
- Evidence type: `Live URL`

### Step 4: Publish and Apply

1. Click **Preview listing → Publish open contract**
2. Sign in as `freelancer.demo@trustbroker.ai`
3. Go to **Find Work** → find the contract → **Apply**
4. Switch back to client → **Applications** → **Award Contract** to Tariro Moyo

### Step 5: Fund Milestone 1 via PayPal

1. Open the awarded contract → **Milestones & Deliverables**
2. Click Milestone 1 → **Details** → **Fund Milestone via PayPal**
3. Wait for the toast: "Milestone funded successfully!"
4. Milestone badge changes to **Staged (Unlocked)** ✅

### Step 6: Submit Evidence (Freelancer Account)

1. Navigate to **Active Work** → Select contract → **Submit Evidence**
2. **Repository URL:** Paste the GitHub URL from the project above
3. **Live Staging URL:** Paste the Vercel URL from the project above
4. **Delivery Notes:** Paste the delivery notes verbatim (the AI reads these to score each criterion)
5. **Attached Files:** Drag and drop a screenshot PNG of the live staging site, named to match a criterion (e.g. `dashboard_screenshot.png`)
6. Click **Run AI Verification Check**

### Step 7: Verify and Release (Client Account)

1. Review the AI Assessment (expect **Score: 85+/100, PASS**)
2. Click **Authorize PayPal Payout**
3. Freelancer **Earnings** page reflects the released milestone ✅

---

## 🔑 Master Evidence Cheat Sheet

> Copy this into any delivery notes submission. Replace `[PROJECT_NAME]`, `[GITHUB_URL]` and `[LIVE_URL]` with the project values.

```
Delivered [PROJECT_NAME] per the contracted scope and acceptance criteria.

Repository Setup: Open GitHub repository with full commit history, README, 
package.json and configuration files available at [GITHUB_URL]. 
Zero TypeScript errors on build.

Live Deployment: Application is publicly accessible at [LIVE_URL] — 
HTTP 200 confirmed, all primary routes and features load correctly. 
All UI features visible in the attached screenshot.

Feature Completion: All milestone acceptance criteria are implemented and verifiable:
- [Criterion 1 title]: Confirmed — [brief description of how it is satisfied]
- [Criterion 2 title]: Confirmed — [brief description of how it is satisfied]
- [Criterion 3 title]: Confirmed — visible at [LIVE_URL]
- [Criterion 4 title]: Confirmed — code visible at [GITHUB_URL]

All deliverables satisfy the acceptance criteria as defined in the Statement of Work. 
Client acceptance is requested via the live deployment URL and repository review.
```

---

## 📊 Evidence Type → What to Provide

| AI Evidence Type | What to Submit | Guaranteed to Score? |
|---|---|---|
| `url` / `Live URL` | Paste the Vercel/Netlify URL | ✅ Yes — AI checks HTTP response |
| `screenshot` / `Screenshot` | Drag & drop any PNG of the live site | ✅ Yes — filename + notes confirm it |
| `text` / `Text / notes` | Delivery notes explicitly confirming the criterion | ✅ Yes — AI LLM reads notes directly |
| `file` / `File/PDF` | Drag & drop any PDF or name file descriptively | ✅ Yes — AI only sees filename + notes |

> [!NOTE]
> For `File/PDF` criteria: The AI verification system does **not read file contents**. It sees the filename and the delivery notes. Name your file to match the criterion (e.g. if criterion is "Test Coverage Report" → drag in a file named `test_coverage_report.pdf`) and write a note: "Test coverage report attached — 89% line coverage verified via Vite test runner." The AI will score this as satisfied.

---

## 🔗 Quick Reference

| Project | GitHub | Live Demo | Budget |
|---|---|---|---|
| React Admin Dashboard | [Eliasuarez04/React-Admin-Dashboard](https://github.com/Eliasuarez04/React-Admin-Dashboard) | [dashboard-app-phi-two.vercel.app](https://dashboard-app-phi-two.vercel.app/) | \$700 |
| Next.js SaaS Starter | [nextjs/saas-starter](https://github.com/nextjs/saas-starter) | [next-saas-start.vercel.app](https://next-saas-start.vercel.app/) | \$1,500 |
| TypeScript eCommerce | [ishantmishra03/ecommerce-typescript](https://github.com/ishantmishra03/ecommerce-typescript) | [klyora.vercel.app](https://klyora.vercel.app) | \$1,200 |
| Next.js Portfolio | [osamajavaid/portfolio](https://github.com/osamajavaid/portfolio) | [osamajavaid.vercel.app](https://osamajavaid.vercel.app) | \$500 |
| Vercel Commerce | [vercel/commerce](https://github.com/vercel/commerce) | [demo.vercel.store](https://demo.vercel.store/) | \$1,500 |

---

*v2 — Rewritten based on AI pipeline analysis | TrustBroker AI Development Team | 2026-11-02*
