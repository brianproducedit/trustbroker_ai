export const APP_NAME = 'TrustBroker AI'
export const APP_TAGLINE = 'Smart Contracts & Milestone Payments for Freelancers'
export const PAYPAL_SANDBOX_DISCLAIMER = 'Prototype Sandbox: Conditional payment demonstration using PayPal Sandbox endpoints. Not a licensed banking or fiduciary escrow institution.'

export const ROUTES = {
  // Public Pages
  HOME: '/',
  HOW_IT_WORKS: '/how-it-works',
  FOR_BUYERS: '/for-buyers',
  FOR_SUPPLIERS: '/for-suppliers',
  DEVELOPER_PORTAL: '/developers',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Authenticated Portal Pages (All contained inside DashboardLayout)
  DASHBOARD: '/dashboard',
  NEW_PROJECT: '/dashboard/create-project',
  CONTRACTS: '/dashboard/contracts',
  CONTRACT_DETAIL: (id: string = ':id') => `/dashboard/contracts/${id}`,
  DELIVERIES: '/dashboard/deliveries',
  DELIVERY_VERIFICATION: (id: string = ':id') => `/dashboard/deliveries/${id}`,
  ACTIVITY_HISTORY: (id: string = ':id') => `/dashboard/activity/${id}`,
  SUPPLIER_PAYOUTS: '/dashboard/payouts',
}

export const STATUS_COLORS = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  settled: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  in_verification: 'bg-blue-50 text-blue-700 border-blue-200',
  verifying: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  active: 'bg-blue-50 text-brand-blue border-blue-200',
  staged_in_sandbox: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  revision_requested: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  draft: 'bg-slate-50 text-slate-500 border-slate-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft Contract',
  pending_acceptance: 'Pending Review',
  active: 'Active',
  in_verification: 'In Review',
  completed: 'Completed',
  disputed: 'In Dispute',
  cancelled: 'Cancelled',
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Work Submitted',
  verifying: 'Reviewing Work',
  verified: 'Verification Passed',
  settled: 'Payment Released',
  revision_requested: 'Revision Requested',
  not_started: 'Not Funded',
  checkout_created: 'Order Created',
  staged_in_sandbox: 'Payment Staged',
  release_authorized: 'Release Approved',
  released: 'Payment Released',
}
