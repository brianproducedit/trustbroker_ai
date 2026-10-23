export const APP_NAME = 'TrustBroker AI'
export const APP_TAGLINE = 'AI-Powered Cross-Border Work Verification & SOW Platform'
export const PAYPAL_SANDBOX_DISCLAIMER = 'Prototype Sandbox: Conditional payment demonstration using PayPal Sandbox endpoints. Not a licensed banking or fiduciary escrow institution.'

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  NEW_PROJECT: '/create-project',
  CONTRACT_DETAIL: (id: string = ':id') => `/contract/${id}`,
  DELIVERY_VERIFICATION: (id: string = ':id') => `/deliver/${id}`,
  ACTIVITY_HISTORY: (id: string = ':id') => `/contract/${id}/activity`,
  DEVELOPER_PORTAL: '/developers',
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
  draft: 'Draft SOW',
  pending_acceptance: 'Pending Review',
  active: 'Active Contract',
  in_verification: 'Verification Active',
  completed: 'Settled & Closed',
  disputed: 'Flagged for Review',
  cancelled: 'Cancelled',
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Evidence Submitted',
  verifying: 'AI Verifying',
  verified: 'Verified Pass',
  settled: 'Funds Released',
  revision_requested: 'Needs Revision',
  not_started: 'Not Funded',
  checkout_created: 'PayPal Order Created',
  staged_in_sandbox: 'Staged in Sandbox',
  release_authorized: 'Release Authorized',
  released: 'Released via PayPal',
}
