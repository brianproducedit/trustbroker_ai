# TrustBroker AI — Complete Redesign & Implementation Plan

> **Context:** PayPal AI Hackathon 2026 | Deadline: Nov 12, 2026 12:00 PM PT
> **Goal:** Transform the current prototype into a polished, judge-impressing MVP that demonstrates a complete contract, payment, verification, and settlement lifecycle.

---

## Executive Audit Summary

### What the Project Guide Requires vs. What Exists

| Requirement | Current State | Gap |
|---|---|---|
| Register / verify email / sign in / forgot password / reset password | Only sign-in/sign-up shells; no forgot-password, no reset-password, no email verification pages | **Critical** |
| Supabase Auth integration | Not connected; mock `isAuthenticated: true` hardcoded | **Critical** |
| AI chat to structured SOW draft | CreateProject has a textarea + hardcoded milestones; no actual AI integration | **Major** |
| Editable SOW with acceptance criteria | Milestones are static arrays; no CRUD, no inline editing | **Major** |
| Contract version tracking + dual-party acceptance | `acceptContract()` exists but no version history UI, no provider-side review | **Major** |
| PayPal sandbox checkout (server-verified) | PayPal JS SDK renders but no FastAPI backend verification | **Major** |
| Delivery submission (files/links) | DeliveryVerification page exists but file upload is cosmetic | **Moderate** |
| AI verification with criterion-level results | Hardcoded mock assessment; no Gemini API call | **Major** |
| Deterministic policy engine | No backend; all logic is client-side mock | **Major** |
| Activity history (audit trail) | Exists but minimal; only shows hardcoded logs | **Minor** |
| AG Grid with real data, sorting, filtering | Works with mock data from Zustand store | **Minor** |
| Responsive mobile + desktop layouts | Partially responsive; some pages overflow on mobile | **Moderate** |
| shadcn/ui components (Dialog, Toast, etc.) | **Not installed** - zero shadcn components | **Critical** |
| Sequential workflow UX (wizards, steppers, dialogs) | CreateProject has a basic 3-step stepper; everything else is flat pages | **Critical** |
| Forgot password + reset password pages | **Missing entirely** | **Critical** |
| Clean, modern, jargon-free UI copy | Pages are bloated with "Gemini 1.5 Pro Gate", "Sandbox Reserve Captured", etc. | **Critical** |
| Professional fintech design (per section 13 of guide) | Dark dashboard OK but public pages feel generic; poor visual hierarchy | **Major** |

---

## Design Philosophy for Redesign

> [!IMPORTANT]
> **Core principle:** This app tells one story - "Do I pay first, or work first?" TrustBroker solves that with AI-drafted contracts, staged payments, and verified delivery. Every screen must make that story obvious in under 5 seconds.

### Design Rules

1. **No jargon.** Replace "Sandbox Reserve Captured" with "Payment Staged". Replace "AI Validation Gate" with "Delivery Check".
2. **Sequential workflows.** Every multi-step process (create contract, submit delivery, make payment) uses a wizard Dialog or stepper - not a flat dumped page.
3. **Component-first.** Install shadcn/ui. Use Dialog, Sheet, Toast, Alert, Card, Badge, Tabs, Separator, Progress, Tooltip, DropdownMenu, Command, and Avatar throughout.
4. **Breathing room.** Generous whitespace. One action per section. Progressive disclosure - do not show everything at once.
5. **Status colors with labels.** Green = confirmed, Blue = in progress, Amber = needs attention, Red = failed. Always paired with text, never color-only.
6. **Mobile-first responsive.** Test at 375px, 768px, and 1440px.

---

## Phase 0: Foundation - Install shadcn/ui and Design System Reset
**Duration: 2-3 hours**

### 0.1 Install shadcn/ui
- [ ] Run `npx shadcn@latest init` in `react_app/`
- [ ] Select style: `New York`, base color: `Slate`
- [ ] Verify `components.json` is created
- [ ] Verify `src/lib/utils.ts` has `cn()` helper (merge with existing utils)

### 0.2 Add core shadcn components
- [ ] Run: `npx shadcn@latest add button card dialog sheet toast alert badge tabs separator progress tooltip dropdown-menu command avatar input label textarea select switch checkbox radio-group scroll-area collapsible popover`
- [ ] Verify all components exist in `src/components/ui/`

### 0.3 Design token consolidation
- [ ] Audit `globals.css` - remove duplicate/conflicting rules
- [ ] Define a single color palette in CSS variables that shadcn and Tailwind share
- [ ] Public pages: light background `#F6F8FC`, navy text, white surfaces
- [ ] Dashboard: dark background `#0B1326`, dark surfaces `#131B2E`, borders `#222A3D`
- [ ] Set Lexend as `--font-sans` globally; JetBrains Mono as `--font-mono`
- [ ] Remove inline hex colors scattered across pages - use CSS variables or Tailwind tokens

### 0.4 Clean up leftover files
- [ ] Remove `src/App.css` and `src/App.tsx` (unused; app lives in `src/app/`)
- [ ] Remove `src/index.css` if it duplicates `globals.css`
- [ ] Audit and remove any dead imports across all pages

---

## Phase 1: Authentication and Account Pages
**Duration: 4-5 hours**

### 1.1 Forgot Password page (`/forgot-password`)
- [ ] Create `src/pages/ForgotPassword.tsx`
- [ ] Design: centered card, email input, "Send Reset Link" button
- [ ] States: idle, loading, success (generic "if account exists, email sent"), error, rate-limited
- [ ] Add route in `routes.tsx`
- [ ] Link from SignIn page

### 1.2 Reset Password page (`/reset-password`)
- [ ] Create `src/pages/ResetPassword.tsx`
- [ ] Design: centered card, new password + confirm password, strength indicator
- [ ] States: valid token, expired/invalid token, success, error
- [ ] Add route in `routes.tsx`

### 1.3 Email Verification page (`/verify-email`)
- [ ] Create `src/pages/VerifyEmail.tsx`
- [ ] Design: centered card with email icon, instructions, "Resend" button
- [ ] States: waiting, verified, expired, error
- [ ] Add route in `routes.tsx`

### 1.4 Redesign Sign In page (`/sign-in`)
- [ ] Use shadcn Card, Input, Label, Button
- [ ] Add "Forgot password?" link below password field
- [ ] Add password visibility toggle (eye icon)
- [ ] Clean layout: logo at top, form in center, "Don't have an account? Sign up" at bottom
- [ ] Remove role tabs from sign-in (role selection happens after login, in dashboard)
- [ ] States: idle, loading, success redirect, invalid credentials, account locked

### 1.5 Redesign Sign Up page (`/sign-up`)
- [ ] Use shadcn Card, Input, Label, Button, Checkbox
- [ ] Fields: Full name, Email, Password, Confirm password
- [ ] Checkbox: "I accept the Terms of Service and Privacy Policy"
- [ ] Password strength indicator (colored bar)
- [ ] States: idle, loading, success then redirect to verify-email, validation errors
- [ ] Remove role tabs (role is contextual per contract, not permanent)

### 1.6 Auth guard and redirects
- [ ] Create `src/components/auth/ProtectedRoute.tsx` wrapper
- [ ] If not authenticated then redirect to `/sign-in?redirect=<current_path>`
- [ ] Wrap all `/dashboard/*` routes with `ProtectedRoute`
- [ ] After successful sign-in then redirect to `searchParams.redirect` or `/dashboard`

### 1.7 Sign-out logic
- [ ] On "Sign Out" click: clear auth state, redirect to `/`
- [ ] Confirm with a Toast notification ("Signed out successfully")

---

## Phase 2: Public Pages Redesign
**Duration: 3-4 hours**

### 2.1 Landing page (`/`) - complete rewrite
- [ ] **Hero section:** Clean headline: "The trust layer between clients and freelancers." Subline: "AI-drafted contracts. Staged payments. Verified delivery." Two CTAs: "I'm hiring" and "I'm a freelancer"
- [ ] **How it works strip:** 4 horizontal steps with icons: 1) Describe Project 2) AI Drafts Contract 3) Stage Payment 4) Verify and Release. Use shadcn Card for each step.
- [ ] **Live demo preview:** Small contract card showing a sample contract with status badges. "Try the demo" button.
- [ ] **Trust signals footer strip:** "PayPal Sandbox", "Gemini AI", "AG Grid", "Open Source" logos/badges.
- [ ] Remove ALL jargon: no "Escrow Engine", no "Sandbox Reserve", no "SOW Synthesis".
- [ ] Keep the hackathon banner but make it subtle (thin top bar).

### 2.2 How It Works page (`/how-it-works`)
- [ ] Redesign as a vertical timeline / stepper with 4 main stages
- [ ] Each stage: icon, title, 2-sentence description, screenshot/illustration
- [ ] Stages: Brief then Contract then Payment then Delivery and Verification
- [ ] Remove technical jargon; write for a non-technical client

### 2.3 For Buyers page (`/for-buyers`)
- [ ] Hero: "Hire with confidence." Clear value props (3 cards)
- [ ] CTA: "Create your first project" with auth-gated route to `/dashboard/create-project`
- [ ] Remove dense technical copy; keep it benefit-focused

### 2.4 For Suppliers page (`/for-suppliers`)
- [ ] Hero: "Get paid for verified work." Clear value props (3 cards)
- [ ] CTA: "View available contracts" with auth-gated route to `/dashboard`
- [ ] Remove dense technical copy

### 2.5 Developer Portal page (`/developers`)
- [ ] Keep API overview but clean up layout
- [ ] Use shadcn Tabs for "Overview", "Endpoints", "Authentication"
- [ ] Add link to OpenAPI spec and Postman collection (placeholder URLs for now)

### 2.6 Header and Footer cleanup
- [ ] Header: Logo, Home, How It Works, For Buyers, For Suppliers, Developers, Sign In, "Live Demo" CTA
- [ ] Make sure all nav links work (no blank pages)
- [ ] Footer: concise with links, copyright, hackathon credit

---

## Phase 3: Dashboard Layout and Navigation Overhaul
**Duration: 3-4 hours**

### 3.1 Sidebar redesign
- [ ] **Buyer sidebar:** Active Contracts, Create Project, Contracts and Payments, Activity Log
- [ ] **Supplier sidebar:** My Contracts, Submit Delivery, Earnings, Activity Log
- [ ] Remove "Developer and API" from sidebar (it is a public page)
- [ ] Remove "Inspect Deliverables and Gate" (merge into contract detail)
- [ ] Each item: icon + label, active state highlight, hover state
- [ ] Collapsible on mobile with hamburger menu

### 3.2 Top bar redesign
- [ ] Left: Logo (clickable to dashboard)
- [ ] Center: breadcrumb trail (Dashboard > Contract TB-2026-084)
- [ ] Right: notification bell, user avatar dropdown (profile, switch role, sign out)
- [ ] Remove "PAYPAL SANDBOX DEMO MODE" text clutter; put sandbox indicator as a small badge

### 3.3 Role switching
- [ ] Use a clean Switch or SegmentedControl component in sidebar footer
- [ ] "Client Mode" and "Supplier Mode" toggle
- [ ] On switch: sidebar items update, dashboard content updates
- [ ] Toast: "Switched to Supplier Mode"

### 3.4 Dashboard main view cleanup
- [ ] **4 metric cards:** Simplify labels. "Active Contracts: 2", "Staged Payments: $5,050", "Pending Actions: 1", "Released: $2,650"
- [ ] **AG Grid:** Keep as-is (dark theme fix already done). Clean up column headers with shorter, clearer labels.
- [ ] **Inspection panel (right):** Keep but simplify. Remove "Gemini 1.5 Pro Gate" label, use "Delivery Status". Remove the circular gauge and use a simple Progress bar.
- [ ] **Audit stream (bottom):** Keep but clean up event labels. Remove hash values.

---

## Phase 4: Create Project / SOW Wizard - Complete Rebuild
**Duration: 5-6 hours**

### 4.1 Trigger: Dialog-based wizard
- [ ] "Create Project" button on dashboard opens a **full-screen Dialog** (shadcn Dialog)
- [ ] 4-step wizard with horizontal stepper indicator at top

### 4.2 Step 1: Project Brief (AI Chat)
- [ ] Large textarea: "Describe your project in plain language..."
- [ ] Quick template chips below (clickable to pre-fill)
- [ ] "Generate Contract" button
- [ ] Loading state: "AI is analyzing your brief..." with animated dots
- [ ] **Actually call Gemini API** (or simulate with realistic delay + structured response)

### 4.3 Step 2: Review SOW
- [ ] Display AI-generated SOW in an **editable** form:
  - Project title (editable Input)
  - Description (editable Textarea)
  - Milestones list with each as an editable Card:
    - Title (Input)
    - Description (Textarea)
    - Amount (Input, number)
    - Deadline (date picker or Input type=date)
    - Acceptance criteria (list of editable items)
  - "Add Milestone" button
  - "Remove" button on each milestone
- [ ] Total budget auto-calculates from milestone amounts
- [ ] **This is where CRUD operations happen** - add/edit/remove milestones and criteria

### 4.4 Step 3: Assign Supplier
- [ ] Supplier email input
- [ ] Optional: supplier name
- [ ] Preview: contract summary card showing both parties

### 4.5 Step 4: Review and Create
- [ ] Full contract preview (read-only formatted view)
- [ ] Checkbox: "I confirm this SOW is accurate"
- [ ] "Create Draft Contract" button
- [ ] On success: Dialog closes, Toast "Contract created", navigate to contract detail page
- [ ] The contract is saved to Zustand store with `status: 'draft'`

---

## Phase 5: Contract Detail - Complete Rebuild
**Duration: 4-5 hours**

### 5.1 Page layout
- [ ] Breadcrumb: Dashboard > Contracts > TB-2026-084
- [ ] Contract header card: code, title, status badge, version number, created date
- [ ] Use shadcn Tabs: "Contract", "Payment", "Activity"

### 5.2 Contract tab
- [ ] **SOW section:** Display contract terms in clean formatted layout
- [ ] **Parties section:** Buyer card + Supplier card side by side, each showing acceptance status
- [ ] **Milestones section:** Accordion or collapsible cards for each milestone
  - Title, amount, deadline, status badge
  - Acceptance criteria list with pass/fail/pending badges
  - "View Delivery" or "Submit Delivery" button per milestone
- [ ] **Accept/Edit controls:**
  - If status is `draft` and user is buyer: "Edit Contract" button reopens SOW wizard
  - If status is `pending_acceptance`: "Accept Terms" button (opens confirmation Dialog)
  - If both parties accepted: show checkmarks, lock editing

### 5.3 Payment tab
- [ ] **Payment timeline:** Visual stepper showing payment states
  - Order Created then Payment Staged then Delivery Verified then Release Eligible then Released
- [ ] **PayPal Checkout section:** If payment not yet made then show PayPal buttons
- [ ] **Payment history:** List of payment events with amounts, dates, PayPal order IDs
- [ ] Dark themed PayPal checkout card (already done)

### 5.4 Activity tab
- [ ] Chronological audit log with event type icons
- [ ] Filter by event type (all, contract, payment, delivery, verification)
- [ ] Each event: timestamp, actor, action, description
- [ ] Remove hash values from display (keep in data model)

### 5.5 Contract CRUD operations
- [ ] **Edit draft:** Re-open SOW wizard with pre-filled data, creates new version
- [ ] **Delete draft:** Confirmation dialog, removes contract
- [ ] **Cancel contract:** Confirmation dialog, sets status to `cancelled`
- [ ] **Request revision:** Button on milestone opens dialog for revision notes, sets milestone to `revision_requested`

---

## Phase 6: Delivery and Verification - Rebuild
**Duration: 3-4 hours**

### 6.1 Submit Delivery (supplier view)
- [ ] Access from milestone card with "Submit Delivery" button that opens **Sheet** (slide-over panel)
- [ ] Form fields:
  - Description (Textarea)
  - Repository URL (Input, optional)
  - Live URL (Input, optional)
  - File attachments (drag-and-drop zone, cosmetic for MVP)
- [ ] "Submit for Verification" button
- [ ] On submit: milestone status changes to `submitted`, Toast confirmation

### 6.2 AI Verification (buyer view)
- [ ] After submission: milestone shows "Evidence Submitted - Review Available"
- [ ] "Run AI Verification" button with loading state with progress bar
- [ ] Results display in a **Dialog**:
  - Overall score (progress bar, not circular gauge)
  - Criterion-by-criterion results:
    - Each criterion: title, Pass/Fail/Needs Review badge, AI confidence, feedback
  - Summary analysis text
  - "Accept and Authorize Release" or "Request Revision" buttons
- [ ] On accept: milestone becomes `verified`, payment becomes `release_authorized`
- [ ] On revision: milestone becomes `revision_requested`, opens revision notes dialog

### 6.3 Submission history
- [ ] On milestone card, show past submissions with version numbers
- [ ] Each submission: date, description snippet, verification result badge

---

## Phase 7: Copy Cleanup - Remove All Jargon and Bloat
**Duration: 2-3 hours**

### 7.1 Terminology replacements (global find and replace)

| Old (jargon) | New (clear) |
|---|---|
| Sandbox Reserve Staged | Payment Staged |
| Sandbox Reserve Captured | Payment Confirmed |
| AI Validation Gate | Delivery Check |
| Gemini 1.5 Pro Gate | AI Review |
| Escrow Reserve | Staged Payment |
| SOW Drafted | Contract Created |
| Funds Released | Payment Released |
| Release Authorized | Release Approved |
| Passing Threshold (90+) | Verification Passed |
| Client Procurement Console | Your Contracts |
| Supplier Delivery Console | Your Projects |
| Cross-border supplier contracts | Active contracts |
| Committed in PayPal Sandbox | Staged for this project |
| Guaranteed client engagements | Active projects |
| Inspection Bay | Contract Details |
| Ledger Execution Stream | Recent Activity |
| AI-Powered Cross-Border Work Verification and SOW Platform | Smart Contracts for Freelancers |

### 7.2 Page title cleanup
- [ ] Dashboard: "Your Contracts" (buyer) / "Your Projects" (supplier)
- [ ] Create Project: "New Project"
- [ ] Contract Detail: "Contract TB-2026-084"
- [ ] Remove ALL "CLIENT PROCUREMENT CONSOLE - PayPal Sandbox Escrow Engine" type headers

### 7.3 Button label cleanup
- [ ] "+ Create Project SOW" becomes "New Project"
- [ ] "Synthesize SOW and Stage Reserve" becomes "Generate Contract"
- [ ] "Authorize Milestone Settlement" becomes "Approve Payment"
- [ ] "Inspect Delivery Evidence" becomes "View Delivery"
- [ ] "Submit Deliverable Evidence" becomes "Submit Work"

---

## Phase 8: Missing CRUD and Feature Completion
**Duration: 3-4 hours**

### 8.1 Contract CRUD in Zustand store
- [ ] `updateContractDraft(id, updates)` - edit title, description, milestones
- [ ] `deleteContract(id)` - remove from store
- [ ] `cancelContract(id)` - set status to cancelled + audit log
- [ ] `requestRevision(contractId, milestoneId, notes)` - set milestone to revision_requested
- [ ] `resubmitDelivery(contractId, milestoneId)` - reset milestone to in_progress

### 8.2 Milestone CRUD
- [ ] `addMilestone(contractId, milestone)` - add milestone to contract
- [ ] `removeMilestone(contractId, milestoneId)` - remove milestone
- [ ] `updateMilestoneDetails(contractId, milestoneId, updates)` - edit title/amount/deadline/criteria

### 8.3 Acceptance criteria CRUD
- [ ] Add/edit/remove acceptance criteria on each milestone
- [ ] Each criterion: title, description, evidence type (text/file/url)

### 8.4 Notification system
- [ ] Create `src/hooks/useNotifications.ts` Zustand store
- [ ] Notification types: contract_created, contract_accepted, payment_staged, delivery_submitted, verification_complete, revision_requested
- [ ] Bell icon shows unread count badge
- [ ] Dropdown shows recent notifications with timestamps
- [ ] "Mark all read" action

---

## Phase 9: Polish and Edge Cases
**Duration: 2-3 hours**

### 9.1 Empty states
- [ ] Dashboard with no contracts: illustration + "Create your first project" CTA
- [ ] Contract detail with no milestones: "Add your first milestone"
- [ ] Activity log empty: "No events yet"

### 9.2 Loading states
- [ ] Skeleton loaders for dashboard cards
- [ ] Spinner for AI generation
- [ ] Button loading states (disabled + spinner)

### 9.3 Error states
- [ ] Toast notifications for all errors
- [ ] Form validation with inline error messages
- [ ] PayPal checkout error handling

### 9.4 Confirmation dialogs
- [ ] "Accept contract terms?" - AlertDialog with warning
- [ ] "Delete this contract?" - destructive AlertDialog
- [ ] "Approve payment release?" - AlertDialog with amount
- [ ] "Sign out?" - simple confirmation

### 9.5 Responsive cleanup
- [ ] Test all pages at 375px, 768px, 1440px
- [ ] Sidebar collapses to hamburger on mobile
- [ ] AG Grid horizontal scroll on small screens
- [ ] Dialog becomes full-screen Sheet on mobile

---

## Phase 10: Build Validation and Final Audit
**Duration: 1-2 hours**

### 10.1 TypeScript strict check
- [ ] Run `npm run build` with zero errors
- [ ] Remove all `any` types
- [ ] Remove all unused imports

### 10.2 Route audit
- [ ] Every route in `routes.tsx` renders a working page
- [ ] Every nav link navigates correctly
- [ ] All dashboard routes are auth-gated
- [ ] 404 redirects to home

### 10.3 Visual audit
- [ ] Screenshot every page at desktop and mobile width
- [ ] Check for: orphaned light backgrounds, broken layouts, truncated text, missing icons
- [ ] Verify dark theme is consistent across all dashboard pages
- [ ] Verify light theme is consistent across all public pages

### 10.4 Accessibility check
- [ ] All interactive elements have focus styles
- [ ] All images have alt text
- [ ] Color is never the sole status indicator
- [ ] Keyboard navigation works through dialogs and forms

---

## Implementation Priority Order

> [!TIP]
> **Execute in this exact order.** Each phase builds on the previous one. Do not skip ahead.

| Priority | Phase | Estimated Time |
|---|---|---|
| 1 | Phase 0: Foundation (shadcn/ui + design tokens) | 2-3h |
| 2 | Phase 1: Auth pages | 4-5h |
| 3 | Phase 7: Copy cleanup (do this early, it is fast) | 2-3h |
| 4 | Phase 2: Public pages redesign | 3-4h |
| 5 | Phase 3: Dashboard layout overhaul | 3-4h |
| 6 | Phase 4: Create Project wizard rebuild | 5-6h |
| 7 | Phase 5: Contract detail rebuild | 4-5h |
| 8 | Phase 6: Delivery and verification rebuild | 3-4h |
| 9 | Phase 8: CRUD and feature completion | 3-4h |
| 10 | Phase 9: Polish and edge cases | 2-3h |
| 11 | Phase 10: Final audit | 1-2h |
| | **Total** | **~35-45h** |

---

## Files That Will Be Created or Rewritten

### New Files
| File | Purpose |
|---|---|
| `src/pages/ForgotPassword.tsx` | Forgot password request page |
| `src/pages/ResetPassword.tsx` | Password reset with token page |
| `src/pages/VerifyEmail.tsx` | Email verification page |
| `src/components/auth/ProtectedRoute.tsx` | Auth guard wrapper component |
| `src/components/ui/*.tsx` | All shadcn/ui components (20+ files) |
| `src/hooks/useNotifications.ts` | Notification state management |
| `components.json` | shadcn/ui configuration |

### Major Rewrites
| File | Change |
|---|---|
| `src/pages/Landing.tsx` | Complete rewrite - clean, jargon-free |
| `src/pages/SignIn.tsx` | Redesign with shadcn components |
| `src/pages/SignUp.tsx` | Redesign with shadcn components |
| `src/pages/dashboard/CreateProject.tsx` | Rebuild as 4-step wizard dialog |
| `src/pages/ContractDetail.tsx` | Rebuild with tabbed layout |
| `src/pages/DeliveryVerification.tsx` | Rebuild as sheet/dialog flow |
| `src/pages/Dashboard.tsx` | Simplify, remove jargon, clean metrics |
| `src/pages/HowItWorks.tsx` | Redesign as visual timeline |
| `src/pages/ForBuyers.tsx` | Simplify, benefit-focused copy |
| `src/pages/ForSuppliers.tsx` | Simplify, benefit-focused copy |
| `src/components/layout/Sidebar.tsx` | Role-aware redesign |
| `src/components/layout/DashboardLayout.tsx` | Clean up, breadcrumbs |
| `src/components/layout/Header.tsx` | Navigation cleanup |
| `src/hooks/useContractStore.ts` | Add full CRUD operations |
| `src/styles/globals.css` | Consolidate design tokens |
| `src/constants/index.ts` | Clean up all labels and terminology |
| `src/app/routes.tsx` | Add new routes + auth guards |

---

> [!CAUTION]
> **Do NOT start backend (FastAPI) work until the frontend MVP is visually complete and the UI workflow is polished.** The judges will see the UI first. Backend verification can be mocked convincingly for the demo video, but a bad UI cannot be faked.
