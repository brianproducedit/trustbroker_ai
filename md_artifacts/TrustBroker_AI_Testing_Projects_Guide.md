# TrustBroker AI — End-to-End Testing Projects Guide (v3)

> **Updated:** 2026-11-02 — Enhanced with Tariro Moyo's expanded skills profile, AI compatibility vetting alignment and copy-paste application cover notes for 90+ AI match scores.

---

## 🔬 How the AI System Works & How to Score 90+ Match

The TrustBroker AI ecosystem has two major AI evaluation touchpoints:

### 1. Contract Creation & Milestone Drafting (`POST /api/v1/ai/draft-sow`)
- **Brief (plain language)** → AI decomposes into Scope, Milestones and Acceptance Criteria.
- **AI Clarification (`POST /api/v1/ai/clarify`)** → Asks 3–6 questions. Answering with our pre-scripted answers steers acceptance criteria away from un-testable `File/PDF` types into verifiable `Live URL`, `GitHub Repo`, `Screenshot` and `Text` types.

### 2. Freelancer AI Compatibility Assessment (`POST /api/v1/ai/vet-application`)
When a freelancer applies, the AI vets the candidate across **4 Core Dimensions**:

| Dimension | Weight | What the AI Evaluates | How We Maximize Score |
|---|---|---|---|
| **Required Skills Match** | 40% | Overlap between contract's required skills and freelancer's profile skills | Tariro's profile is updated with **React, TypeScript, Next.js 14, Tailwind CSS, Shadcn/UI, Stripe, Vite, Zustand, FastAPI, Python, PostgreSQL** |
| **Portfolio Relevance** | 25% | Direct applicability of portfolio case studies to the project type | Tariro's portfolio contains **Next.js SaaS + Stripe**, **React Admin Dashboard** and **TypeScript eCommerce** |
| **Proposal Clarity** | 20% | Thoroughness, technical articulation and structure of the submitted cover note | Use the **Application Proposal / Cover Note** templates below (>180 characters, naming skills and milestones) |
| **Track Record & Risk** | 15% | Profile completeness and completed verified contracts | Tariro has **100% profile completeness** and 2 completed contracts |

> [!TIP]
> **Why Tariro previously scored 25/100:**
> In earlier versions, Tariro's profile only had generic skills (`Python, FastAPI, React`) without `Next.js 14`, `Tailwind`, `Shadcn/UI` or `Stripe`. When the user applied with a brief note, the AI flagged: *"skill set only partially overlaps with the required stack (missing Next.js 14, Tailwind, Shadcn/UI, Stripe)"*.
> With the updated profile and the tailored cover notes below, the AI compatibility score jumps to **92–98/100 — STRONG FIT (Ranked #1)**!

### 3. Deliverable AI Evidence Inspection (`POST /api/v1/ai/verify-delivery`)
- **The AI never reads raw file bytes.** It reads the `Repository URL`, `Live Deployment URL`, `file_names` list and `Description of Work Done` (delivery notes).
- Naming each criterion in your delivery notes and dragging in a screenshot or named file satisfies 100% of criteria.

---

## 👤 Tariro Moyo (Freelancer Demo Profile)

Ensure your demo profile in TrustBroker AI reflects these credentials (already updated in `seed.py`, or editable under **Freelancer Workspace → Profile**):

* **Email:** `freelancer.demo@trustbroker.ai`
* **Headline:** Senior Full-Stack & Cloud Architecture Lead (React, Next.js, Stripe, FastAPI)
* **Bio:** Senior Full-Stack Engineer and Systems Architect with 8+ years experience delivering production web applications in React, Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI, Stripe and Python/FastAPI microservices. Specializes in autonomous escrow, PayPal payments and high-reliability SaaS dashboards.
* **Skills:** `React`, `TypeScript`, `Next.js`, `Next.js 14`, `Tailwind CSS`, `Tailwind`, `Shadcn/UI`, `Stripe`, `Vite`, `Zustand`, `Python`, `FastAPI`, `PostgreSQL`, `PayPal API`, `Docker`, `AG Grid`, `REST APIs`
* **Portfolio Items:**
  1. *Next.js SaaS Starter & Stripe Billing* — `https://github.com/nextjs/saas-starter`
  2. *React Admin Analytics Dashboard* — `https://github.com/Eliasuarez04/React-Admin-Dashboard`
  3. *Full-Stack TypeScript eCommerce Storefront* — `https://github.com/ishantmishra03/ecommerce-typescript`
  4. *Cross-Border Settlement Engine* — `https://github.com/devstudio/settlement-engine`

---

## 🧪 Testing Project Library — Matched to Tariro

---

### Project 1 — React Admin Dashboard (Eliasuarez04)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/Eliasuarez04/React-Admin-Dashboard` |
| **Live Staging URL** | `https://dashboard-app-phi-two.vercel.app/` |
| **Screenshot** | Screenshot of `https://dashboard-app-phi-two.vercel.app/` |
| **Contract Budget** | `$700 USD` |
| **Required Skills** | `React`, `TypeScript`, `Tailwind CSS`, `Vite`, `Zustand` |

#### Step 1: Client Brief (paste verbatim into "Brief in plain language")
```
I need a responsive React and TypeScript admin dashboard. 
It must have a sidebar navigation, data visualisation cards showing KPI metrics, 
a user data table and mobile-first Tailwind CSS layout with Zustand state management. 
The application should compile with Vite and zero TypeScript errors. 
All deliverables are verified via a live Vercel deployment URL and an open GitHub repository. 
No separate documentation PDFs or test coverage reports are required — 
the README in the repository and the live URL are the acceptance evidence.
```

#### Step 2: Clarification Answer Script (Client)
| Question | Your Answer |
|---|---|
| Data sources? | `Use mock/static JSON data — no API authentication needed` |
| State management? | `Zustand for lightweight local state` |
| Documentation format? | `README in the GitHub repo is sufficient, no PDF required` |
| Testing/QA? | `Basic smoke test verifiable directly at the live deployment URL` |
| Acceptance process? | `Client accepts by confirming the live URL is accessible and features load` |

#### Step 3: Application Proposal / Cover Note (Paste when Tariro applies)
```
I am excited to submit my proposal for the Responsive Admin Dashboard development project. As a Senior Full-Stack Engineer with extensive production experience in React 19, TypeScript, Vite, Tailwind CSS and Zustand, I have built multiple high-throughput analytics and operational consoles.

In my portfolio, my React Admin Analytics Dashboard (https://github.com/Eliasuarez04/React-Admin-Dashboard) demonstrates a modular layout featuring KPI metric cards, responsive Tailwind navigation drawer, sortable user tables and clean Zustand state management.

I work strictly under milestone-driven delivery with automated criteria verification:
1. Navigation layout, mobile-first responsive Tailwind design system and route structure.
2. KPI metric cards, sortable user data table and Zustand state binding.
3. Production Vite compilation with zero TypeScript errors and live Vercel deployment.

All deliverables will be verifiable via the live Vercel URL and open GitHub repository. I look forward to partnering on this project!
```

#### Step 4: Delivery Notes (Paste when submitting evidence)
```
Delivered responsive React + TypeScript admin dashboard per contracted scope.

Repository Setup: Open source repository available at https://github.com/Eliasuarez04/React-Admin-Dashboard with full commit history, package.json, tsconfig.json and README with setup instructions. Vite builds with zero TypeScript errors and zero lint warnings.

Navigation Sidebar: Sidebar renders all navigation links. Active route is highlighted. Sidebar collapses on mobile viewports.

KPI Metric Cards: Dashboard displays data visualisation cards showing user metrics, revenue, orders and system status. Cards fetch from Zustand state with mock JSON data source.

User Data Table: User table renders with columns for name, email, role and status. Table is sortable by column header. Pagination controls are present.

Mobile Responsive Layout: Layout adapts correctly at 375px (mobile), 768px (tablet) and 1440px (desktop) breakpoints. Tailwind responsive utility classes are applied throughout.

Live Deployment: Application is live and publicly accessible at https://dashboard-app-phi-two.vercel.app/ — HTTP 200 confirmed, all routes navigable.

All acceptance criteria are satisfied and verifiable at the live URL and GitHub repository provided.
```

---

### Project 2 — Next.js SaaS Starter (Official Vercel)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/nextjs/saas-starter` |
| **Live Staging URL** | `https://next-saas-start.vercel.app/` |
| **Screenshot** | Screenshot of `https://next-saas-start.vercel.app/` |
| **Contract Budget** | `$1,500 USD` |
| **Required Skills** | `Next.js 14`, `TypeScript`, `Tailwind CSS`, `Shadcn/UI`, `Stripe`, `PostgreSQL` |

#### Step 1: Client Brief (paste verbatim)
```
I need a SaaS web application with user authentication, subscription management, 
and a user dashboard. The tech stack is Next.js 14 with TypeScript, Tailwind CSS, 
Shadcn/UI and Stripe billing. Authentication must work with email and password. 
A landing page with pricing section is required. 
All features are verified by accessing the live Vercel deployment URL — 
no separate test reports or PDF deliverables are needed. 
The GitHub repository with open commit history serves as the technical evidence.
```

#### Step 2: Clarification Answer Script (Client)
| Question | Answer |
|---|---|
| Database? | `PostgreSQL with Drizzle ORM — schema visible in the GitHub repository` |
| Auth provider? | `Email and password using NextAuth — testable at the live URL` |
| Stripe mode? | `Stripe test mode — verifiable from the repository configuration` |
| Documentation? | `README in the repository covers setup — no separate PDF required` |
| Acceptance? | `Confirmed by accessing the live URL and verifying login and dashboard load` |

#### Step 3: Application Proposal / Cover Note (Paste when Tariro applies)
```
I am applying as the lead full-stack developer for the Next.js SaaS application. My core expertise covers Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Stripe billing and PostgreSQL with Drizzle ORM.

As demonstrated in my portfolio project (https://github.com/nextjs/saas-starter), I have implemented production multi-tenant SaaS platforms featuring email/password authentication via NextAuth, customer billing portals, subscription tier checkout and responsive user dashboards with role-based access control.

My approach aligns directly with your milestone roadmap:
- Clean Next.js 14 architecture with strict TypeScript compilation.
- Seamless Stripe customer checkout and webhook lifecycle handling.
- Drizzle ORM database schemas and migrations.
- Live Vercel deployment with automated preview environments.

I commit to full milestone verification through the live staging URL and open GitHub repository. Ready to begin immediately upon award!
```

#### Step 4: Delivery Notes (Paste when submitting evidence)
```
Delivered full-stack Next.js SaaS application.

Authentication System: Email and password authentication implemented via NextAuth. Sign-up and sign-in flows are functional and testable at https://next-saas-start.vercel.app/ — account creation redirects to the user dashboard correctly.

Landing Page: Marketing landing page renders with hero section, feature highlights and pricing tier cards. CTA buttons link to the sign-up flow.

User Dashboard: Authenticated dashboard accessible after login. Shows subscription status, account settings and team management section. Accessible at the live URL after signing in.

Stripe Integration: Stripe checkout creates subscription sessions in test mode. Configuration visible in the GitHub repository at https://github.com/nextjs/saas-starter under the Stripe configuration files.

Database Schema: Drizzle ORM migrations create all required tables. Schema files visible in the repository under the /db directory.

Vercel Deployment: Application is live at https://next-saas-start.vercel.app/ with HTTPS — HTTP 200 confirmed on all primary routes.

GitHub Repository: Full commit history, TypeScript configuration, environment variable documentation and README with deployment steps available at https://github.com/nextjs/saas-starter.

All acceptance criteria satisfied and verifiable via the live URL and open repository.
```

---

### Project 3 — TypeScript eCommerce Platform (klyora)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/ishantmishra03/ecommerce-typescript` |
| **Live Staging URL** | `https://klyora.vercel.app` |
| **Screenshot** | Screenshot of `https://klyora.vercel.app` |
| **Contract Budget** | `$1,200 USD` |
| **Required Skills** | `React`, `TypeScript`, `Tailwind CSS`, `Node.js`, `Express`, `Stripe` |

#### Step 1: Client Brief (paste verbatim)
```
I need a full-stack eCommerce web application in React and TypeScript. 
Required features: product catalogue with images and prices, 
shopping cart with quantity management, user authentication, 
and Stripe payment integration. The backend is Node.js with Express. 
Evidence of delivery is the live deployment URL and the open GitHub repository — 
no separate test reports, documentation bundles or design handoff files are required. 
The application must be publicly accessible at a Vercel deployment URL.
```

#### Step 2: Clarification Answer Script (Client)
| Question | Answer |
|---|---|
| Database? | `MongoDB — connection visible in the repository configuration` |
| Auth method? | `JWT-based — testable from the live sign-up and login flows` |
| Payment gateway? | `Stripe in test mode — verifiable at the live checkout URL` |
| Documentation? | `README in the GitHub repository covers the full stack setup` |
| Acceptance? | `Verified by browsing the live store at klyora.vercel.app and reviewing the open repository` |

#### Step 3: Application Proposal / Cover Note (Paste when Tariro applies)
```
I am submitting my proposal for your full-stack TypeScript eCommerce platform. I bring deep experience architecting end-to-end commerce platforms using React, TypeScript, Tailwind CSS, Express REST APIs, MongoDB and Stripe payments.

My portfolio features a full-stack eCommerce application (https://github.com/ishantmishra03/ecommerce-typescript) with product catalog browsing, cart session persistence, JWT user authentication and Stripe checkout integration. Furthermore, my cross-border settlement engine handled over $2.4M in automated disbursements with PayPal and Stripe APIs.

Plan of execution:
1. Product catalog, search filters and cart state management.
2. Secure JWT authentication and Stripe payment integration.
3. Express API containerization and live Vercel deployment.

All milestone deliverables will be accompanied by clean repository commits and a live public Vercel URL for instant acceptance.
```

#### Step 4: Delivery Notes (Paste when submitting evidence)
```
Delivered full-stack React + TypeScript eCommerce platform.

Product Catalogue: Product listing renders with images, titles, prices and categories. Individual product detail pages are accessible via route navigation. Live at https://klyora.vercel.app — all products visible.

Shopping Cart: Add to cart, update quantity and remove item functions are operational. Cart state persists within the browser session. Visible at the live URL.

User Authentication: User registration and login using JWT tokens. Protected routes redirect unauthenticated users. Testable at the live sign-in page.

Stripe Checkout: Stripe payment integration opens a test-mode checkout session. Stripe test card 4242 4242 4242 4242 completes the order flow successfully.

Backend API: Express REST API endpoints for products, cart, orders and users are implemented. Endpoint structure visible in the GitHub repository at https://github.com/ishantmishra03/ecommerce-typescript.

Vercel Deployment: Frontend is live at https://klyora.vercel.app with HTTPS and HTTP 200 response on all primary routes.

GitHub Repository: Full TypeScript source code, package.json, README and environment variable examples available at https://github.com/ishantmishra03/ecommerce-typescript.

All acceptance criteria satisfied and verifiable via the live URL and open repository.
```

---

### Project 4 — Developer Portfolio Website (Next.js + Tailwind)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/osamajavaid/portfolio` |
| **Live Staging URL** | `https://osamajavaid.vercel.app` |
| **Screenshot** | Screenshot of `https://osamajavaid.vercel.app` |
| **Contract Budget** | `$500 USD` |
| **Required Skills** | `Next.js`, `TypeScript`, `Tailwind CSS`, `Responsive Design` |

#### Step 1: Client Brief (paste verbatim)
```
I need a professional developer portfolio website built with Next.js and Tailwind CSS. 
Required sections: hero with name and call-to-action, skills grid, 
projects showcase with at least three items and a contact section. 
Dark mode support is required. The website must be fully responsive on mobile and desktop. 
Acceptance is verified entirely by the live Vercel deployment URL and the GitHub repository — 
no design files, PDF deliverables or formal sign-off documents are required.
```

#### Step 2: Clarification Answer Script (Client)
| Question | Answer |
|---|---|
| Content/copy? | `Use placeholder content — real content can be swapped post-delivery` |
| Animation library? | `Framer Motion if needed — optional, keep it lightweight` |
| Contact form backend? | `Static form is acceptable — no backend email sending required` |
| Documentation? | `README in the repository is sufficient` |
| Acceptance? | `Live URL accessible with all sections visible confirms delivery` |

#### Step 3: Application Proposal / Cover Note (Paste when Tariro applies)
```
I would love to build your responsive developer portfolio website. I specialize in Next.js, TypeScript and modern Tailwind CSS design systems with fluid responsive layouts and dark/light mode theming.

In my portfolio (https://github.com/osamajavaid/portfolio), I created a high-performance personal portfolio featuring dynamic hero sections, interactive skills grids, project showcase cards with hover states and validated contact forms, achieving Lighthouse scores above 95.

Deliverables commitment:
- Clean semantic HTML and Tailwind CSS utilities.
- Smooth mobile-first responsive layout (375px to 1440px).
- Zero TypeScript warnings and live Vercel deployment.

Ready to start and deliver within the agreed timeframe.
```

#### Step 4: Delivery Notes (Paste when submitting evidence)
```
Delivered responsive Next.js developer portfolio website.

Hero Section: Hero renders with developer name, role title and call-to-action button. Animated entrance is smooth. Accessible at https://osamajavaid.vercel.app.

Skills Grid: Skills section displays technology icons and names in a responsive grid layout. Visible on all viewport sizes at the live URL.

Projects Showcase: Projects section displays at least 3 portfolio items with titles, descriptions, tags and external links. Cards render with hover states.

Dark Mode: Dark/light theme toggle implemented. Theme preference persists across page navigation.

Contact Section: Contact section renders with working form validation. Required field alerts function correctly.

Mobile Responsive: Layout adapts at 375px, 768px and 1440px viewports. All sections stack correctly on mobile.

Live Deployment: Site is live at https://osamajavaid.vercel.app with HTTP 200 response. All navigation anchors scroll correctly to sections.

GitHub Repository: Full Next.js source code with TypeScript, Tailwind config and README available at https://github.com/osamajavaid/portfolio.

All acceptance criteria satisfied and verifiable at the live URL and GitHub repository.
```

---

### Project 5 — Vercel Commerce (Headless eCommerce Storefront)

| Field | Value |
|---|---|
| **GitHub URL** | `https://github.com/vercel/commerce` |
| **Live Staging URL** | `https://demo.vercel.store/` |
| **Screenshot** | Screenshot of `https://demo.vercel.store/` |
| **Contract Budget** | `$1,500 USD` |
| **Required Skills** | `Next.js`, `React Server Components`, `TypeScript`, `Tailwind CSS` |

#### Step 1: Client Brief (paste verbatim)
```
I need a high-performance headless eCommerce storefront built with Next.js and React Server Components. 
Required features: product listing grid, product detail pages with variant selection, 
shopping cart drawer and product search. Server-side rendering must be used for SEO. 
All acceptance evidence is provided via the live public deployment URL and the open GitHub repository. 
No PDF reports, coverage exports or separate documentation bundles are required — 
the publicly accessible storefront URL is the primary acceptance artefact.
```

#### Step 2: Clarification Answer Script (Client)
| Question | Answer |
|---|---|
| Commerce provider? | `Mock/demo product data — no real commerce backend needed for acceptance` |
| Performance targets? | `Fast enough to be usable — no specific Core Web Vitals score required` |
| Internationalisation? | `English only — no i18n required` |
| Documentation? | `README in the GitHub repository covers the architecture` |
| Acceptance? | `Client accepts by browsing the live storefront URL and confirming all features load` |

#### Step 3: Application Proposal / Cover Note (Paste when Tariro applies)
```
I am applying for your headless eCommerce storefront project. My specialization is Next.js with React Server Components, TypeScript, Tailwind CSS and modern headless storefront architectures.

My work includes high-performance headless commerce templates (https://github.com/vercel/commerce) featuring server-side rendered product grids, dynamic product variant selectors, slide-in shopping cart drawers and instant client-side search.

Key advantages I bring:
- Next.js RSC architecture for optimal SEO and Core Web Vitals (LCP < 2.0s).
- Fully responsive Tailwind design matching modern retail standards.
- Modular code structure ready for production deployment on Vercel.

I adhere to TrustBroker AI milestone verification with live staging links and open repository commits.
```

#### Step 4: Delivery Notes (Paste when submitting evidence)
```
Delivered high-performance Next.js headless eCommerce storefront.

Product Listing Grid: Product catalogue renders with images, titles, prices and category filters. Grid adapts from 1 to 4 columns across viewport sizes. Live at https://demo.vercel.store/.

Product Detail Pages: Individual product pages display title, description, price and variant selectors (size, colour). Add to cart button is functional.

Shopping Cart Drawer: Cart icon in the header opens a slide-in drawer listing added items with quantities and totals. Cart persists within the session.

Product Search: Search input filters products by keyword. Results update dynamically as user types.

Server-Side Rendering: Pages are server-rendered via React Server Components for SEO. Page source contains product titles in HTML.

Next.js Build: Build completes cleanly with zero TypeScript errors. Configuration visible at https://github.com/vercel/commerce.

Live Deployment: Storefront is live at https://demo.vercel.store/ — HTTP 200 confirmed, all primary routes accessible.

GitHub Repository: Full Next.js RSC source code available at https://github.com/vercel/commerce with complete commit history and README.

All acceptance criteria satisfied and verifiable at the live URL and open GitHub repository.
```

---

## 🚀 Complete Step-by-Step Testing Workflow

### Phase 1: Client Creates Contract
1. Log in as **Elena Rostova (Client)** (`client.demo@trustbroker.ai`).
2. Go to **New Contract**.
3. Select **Software Development**, enter the budget (e.g. `$700`), target date and paste the **Brief** from your chosen project above.
4. Add the required skills listed for that project.
5. In Step 2 (Clarification), answer using the **Clarification Answer Script**.
6. In Step 3 (SOW), review milestones. If any criterion says `File/PDF`, replace with `Live URL` or `Screenshot`.
7. Click **Preview listing → Publish open contract**.

### Phase 2: Tariro Applies with Matched Proposal
1. Log in as **Tariro Moyo (Freelancer)** (`freelancer.demo@trustbroker.ai`).
2. Go to **Find Work**, locate the newly published contract and click **Apply**.
3. In the cover note field, paste the **Application Proposal / Cover Note** from the matching project above.
4. Submit the proposal.

### Phase 3: Client Reviews AI Assessment & Awards Contract
1. Switch back to **Elena Rostova (Client)**.
2. Go to **Applications** → select the contract.
3. Observe the **Automated AI Compatibility Analysis**:
   * **Required Skills Match:** `10/10` (All skills confirmed)
   * **Portfolio Relevance:** `10/10` (Direct project alignment)
   * **Proposal Clarity:** `9-10/10` (Structured technical articulation)
   * **Match Score:** `92-98/100 (STRONG FIT — RANKED #1)`
4. Click **Award Contract**.

### Phase 4: Client Funds Milestone 1 via PayPal Escrow
1. Open the awarded contract → **Milestones & Deliverables**.
2. Click **Milestone 1 → Details → Fund Milestone via PayPal**.
3. Wait for the success toasts (*"PayPal Order created"* then *"Milestone funded successfully! $... staged into PayPal sandbox escrow"*).
4. Status changes to **Staged (Unlocked)**.

### Phase 5: Freelancer Submits Evidence via Drag-and-Drop
1. Switch to **Tariro Moyo (Freelancer)**.
2. Go to **Active Work** → select the contract → **Submit Evidence**.
3. Paste the **Repository URL** and **Live Staging URL** from the project above.
4. Paste the **Delivery Notes** from the project above into the description field.
5. Drag and drop your screenshot PNG into the **Drag & drop evidence files here** zone.
6. Click **Run AI Verification Check**.
7. Verification passes with **Score: 85-95/100 (PASS)**.

### Phase 6: Client Authorizes PayPal Payout
1. Switch to **Elena Rostova (Client)**.
2. Click **Authorize PayPal Payout**.
3. Milestone transitions to **Released**, funds are disbursed to Tariro's PayPal account and reflect under Tariro's **Earnings** page!

---

*v3 — Fully matched to Tariro Moyo profile & AI vetting engine | TrustBroker AI Development Team | 2026-11-02*
