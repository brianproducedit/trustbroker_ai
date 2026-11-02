import type { AgDataSourcesDefinition, AgFieldDefinition, AgReportState } from 'ag-studio'
import type { Contract } from '@/types/contract'

type Workspace = 'client' | 'freelancer'

const contractFields: AgFieldDefinition[] = [
  { id: 'id', name: 'Contract ID', format: 'textFormat' },
  { id: 'code', name: 'Code', format: 'textFormat' },
  { id: 'title', name: 'Title', format: 'textFormat' },
  { id: 'status', name: 'Status', format: 'textFormat' },
  { id: 'category', name: 'Category', format: 'textFormat' },
  { id: 'lifecycle_stage', name: 'Lifecycle Stage', format: 'textFormat' },
  { id: 'action_needed', name: 'Action Needed', format: 'textFormat' },
  { id: 'counterparty', name: 'Counterparty', format: 'textFormat' },
  { id: 'currency', name: 'Currency', format: 'textFormat' },
  { id: 'total_amount', name: 'Total Amount', format: 'currencyFormat' },
  { id: 'staged_amount', name: 'Staged in PayPal', format: 'currencyFormat' },
  { id: 'released_amount', name: 'Released', format: 'currencyFormat' },
  { id: 'unreleased_amount', name: 'Outstanding', format: 'currencyFormat' },
  { id: 'milestone_count', name: 'Milestones', format: 'integerFormat' },
  { id: 'created_at', name: 'Created', format: 'dateFormat' },
]

const milestoneFields: AgFieldDefinition[] = [
  { id: 'id', name: 'Milestone ID', format: 'textFormat' },
  { id: 'contract_id', name: 'Contract ID', format: 'textFormat' },
  { id: 'contract_code', name: 'Contract', format: 'textFormat' },
  { id: 'contract_title', name: 'Contract Title', format: 'textFormat' },
  { id: 'title', name: 'Milestone', format: 'textFormat' },
  { id: 'status', name: 'Milestone Status', format: 'textFormat' },
  { id: 'payment_status', name: 'Payment Status', format: 'textFormat' },
  { id: 'verification_outcome', name: 'Verification Outcome', format: 'textFormat' },
  { id: 'action_owner', name: 'Action Owner', format: 'textFormat' },
  { id: 'amount', name: 'Amount', format: 'currencyFormat' },
  { id: 'currency', name: 'Currency', format: 'textFormat' },
  { id: 'sort_order', name: 'Order', format: 'integerFormat' },
  { id: 'deadline', name: 'Deadline', format: 'textFormat' },
]

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Payment states in which the client's funds are already held by the platform. */
const STAGED_PAYMENT_STATUSES = new Set<string>([
  'staged_in_sandbox',
  'release_authorized',
  'released',
])

function inferCategory(title: string, desc?: string): string {
  const text = `${title} ${desc || ''}`.toLowerCase()
  if (/ai|model|llm|agent|machine learning|vision|deepseek|groq/i.test(text)) return 'AI & Machine Learning'
  if (/dashboard|react|next\.?js|frontend|tailwind|ui|ux|portal|portfolio/i.test(text)) return 'Frontend & Web Apps'
  if (/backend|fastapi|python|api|server|microservice|settlement|database/i.test(text)) return 'Backend & Cloud'
  if (/ecommerce|commerce|store|shop|cart|stripe|checkout/i.test(text)) return 'E-Commerce & Billing'
  return 'Full-Stack Software'
}

function getLifecycleStage(status: string, stagedAmount: number, releasedAmount: number, totalAmount: number): string {
  switch (status) {
    case 'draft': return '1. Draft / Scoping'
    case 'open': return '2. Open Proposal'
    case 'awarded': return '3. Awarded'
    case 'pending_acceptance': return '4. Mutual Acceptance'
    case 'active':
      if (releasedAmount >= totalAmount && totalAmount > 0) return '8. Released & Closed'
      if (stagedAmount > 0) return '5. Staged (Funded)'
      return '4. Mutual Acceptance'
    case 'in_verification': return '6. In Verification'
    case 'completed': return '8. Released & Closed'
    case 'disputed': return 'Exception: Disputed'
    case 'cancelled': return 'Closed: Cancelled'
    default: return status
  }
}

function getOperationalAction(c: Contract, staged: number, released: number, total: number): string {
  if (c.status === 'draft') return 'Client Draft Scoping'
  if (c.status === 'open') return 'Awaiting Proposals'
  if (c.status === 'awarded' || c.status === 'pending_acceptance') return 'Mutual Acceptance Pending'
  if (c.status === 'active') {
    if (staged <= 0) return 'Client Sandbox Funding Needed'
    if (released >= total && total > 0) return 'Complete & Cleared'
    return 'Freelancer Deliverable Pending'
  }
  if (c.status === 'in_verification') return 'AI Verification In Progress'
  if (c.status === 'completed') return 'Completed'
  return 'In Progress'
}

function getVerificationOutcome(status: string): string {
  if (status === 'verified' || status === 'settled') return 'Verified & Passed'
  if (status === 'revision_requested') return 'Revision Requested'
  if (status === 'verifying' || status === 'submitted') return 'Under AI Verification'
  if (status === 'in_progress') return 'In Progress'
  return 'Pending Evidence'
}

function getActionOwner(mStatus: string, pStatus: string): string {
  if (mStatus === 'revision_requested' || mStatus === 'in_progress' || mStatus === 'pending') {
    return 'Freelancer'
  }
  if (mStatus === 'verifying' || mStatus === 'submitted') {
    return 'TrustBroker AI Engine'
  }
  if (mStatus === 'verified' && pStatus !== 'released') {
    return 'Client (Release Payout)'
  }
  return 'Platform Complete'
}

/**
 * Flattens contracts + milestones into the two AG Studio data sources linked by a
 * many-to-one relationship, so cross-table queries work seamlessly.
 */
export function buildStudioData(
  contracts: Contract[],
  workspace: Workspace,
): AgDataSourcesDefinition {
  const contractRows = contracts.map((c) => {
    const milestones = c.milestones ?? []

    const stagedFromMilestones = milestones.reduce(
      (sum, m) => (STAGED_PAYMENT_STATUSES.has(m.paymentStatus) ? sum + toNumber(m.amount) : sum),
      0,
    )
    const releasedFromMilestones = milestones.reduce(
      (sum, m) => (m.paymentStatus === 'released' ? sum + toNumber(m.amount) : sum),
      0,
    )

    const staged = Math.max(toNumber(c.stagedAmount), stagedFromMilestones)
    const released = Math.max(toNumber(c.releasedAmount), releasedFromMilestones)
    const total = toNumber(c.totalAmount)

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      status: c.status,
      category: inferCategory(c.title, c.description),
      lifecycle_stage: getLifecycleStage(c.status, staged, released, total),
      action_needed: getOperationalAction(c, staged, released, total),
      counterparty:
        workspace === 'client'
          ? c.freelancer?.name || c.freelancer?.email || 'Unassigned'
          : c.client?.name || c.client?.email || 'Unknown client',
      currency: c.currency || 'USD',
      total_amount: total,
      staged_amount: staged,
      released_amount: released,
      unreleased_amount: Math.max(total - released, 0),
      milestone_count: milestones.length,
      created_at: c.createdAt,
    }
  })

  const milestoneRows = contracts.flatMap((c) =>
    (c.milestones ?? []).map((m, index) => {
      const pStatus = m.paymentStatus ?? 'not_started'
      return {
        id: m.id,
        contract_id: c.id,
        contract_code: c.code,
        contract_title: c.title,
        title: m.title,
        status: m.status,
        payment_status: pStatus,
        verification_outcome: getVerificationOutcome(m.status),
        action_owner: getActionOwner(m.status, pStatus),
        amount: toNumber(m.amount),
        currency: m.currency || c.currency || 'USD',
        sort_order: index + 1,
        deadline: m.deadline ?? '',
      }
    }),
  )

  return {
    sources: [
      { id: 'contracts', name: 'Contracts', data: contractRows, fields: contractFields },
      { id: 'milestones', name: 'Milestones', data: milestoneRows, fields: milestoneFields },
    ],
    relationships: [
      {
        id: 'milestone-contract',
        source: { tableId: 'milestones', fieldId: 'contract_id' },
        target: { tableId: 'contracts', fieldId: 'id' },
        type: 'many-to-one',
        acceptFanout: true,
      },
    ],
  }
}

/** Operations dashboard layout: overview funnel, verification outcomes, and milestone aging. */
export function buildInitialState(workspace: Workspace): AgReportState {
  const stagedCaption = workspace === 'client' ? 'Staged in PayPal Sandbox' : 'Secured by Clients'
  const releasedCaption = workspace === 'client' ? 'Released Disbursements' : 'Earned & Disbursed'

  return {
    pages: [
      {
        id: 'overview',
        widgets: {
          'kpi-total': {
            type: 'value',
            dataMapping: { value: [{ id: 'contracts.total_amount', aggregation: 'sum' }] },
            format: { caption: { enabled: true, text: 'Total Contract Value' } },
          },
          'kpi-staged': {
            type: 'value',
            dataMapping: { value: [{ id: 'contracts.staged_amount', aggregation: 'sum' }] },
            format: { caption: { enabled: true, text: stagedCaption } },
          },
          'kpi-released': {
            type: 'value',
            dataMapping: { value: [{ id: 'contracts.released_amount', aggregation: 'sum' }] },
            format: { caption: { enabled: true, text: releasedCaption } },
          },
          'kpi-contracts': {
            type: 'value',
            dataMapping: { value: [{ id: 'contracts.id', aggregation: 'countd' }] },
            format: { caption: { enabled: true, text: 'Active Contracts' } },
          },
          'chart-lifecycle-funnel': {
            type: 'bar-chart-grouped',
            dataMapping: {
              categoryKey: [{ id: 'contracts.lifecycle_stage' }],
              valueKey: [{ id: 'contracts.total_amount', aggregation: 'sum' }],
            },
            sort: [{ field: { id: 'contracts.total_amount', aggregation: 'sum' }, direction: 'desc' }],
            format: { title: { enabled: true, text: 'Lifecycle Stage Funnel' } },
          },
          'chart-category': {
            type: 'bar-chart-grouped',
            dataMapping: {
              categoryKey: [{ id: 'contracts.category' }],
              valueKey: [{ id: 'contracts.total_amount', aggregation: 'sum' }],
            },
            sort: [{ field: { id: 'contracts.total_amount', aggregation: 'sum' }, direction: 'desc' }],
            format: { title: { enabled: true, text: 'Contract Value by Category' } },
          },
          'contracts-grid': {
            type: 'grid',
            dataMapping: {
              cols: [
                { id: 'contracts.code' },
                { id: 'contracts.title' },
                { id: 'contracts.category' },
                { id: 'contracts.counterparty' },
                { id: 'contracts.lifecycle_stage' },
                { id: 'contracts.action_needed' },
                { id: 'contracts.total_amount', aggregation: 'sum' },
                { id: 'contracts.staged_amount', aggregation: 'sum' },
                { id: 'contracts.released_amount', aggregation: 'sum' },
                { id: 'contracts.milestone_count' },
              ],
            },
            format: { title: { enabled: true, text: 'Contract Operations Ledger' } },
          },
        },
        widgetLayout: {
          'kpi-total': { xTrack: 0, yTrack: 0, xSpan: 6, ySpan: 6 },
          'kpi-staged': { xTrack: 6, yTrack: 0, xSpan: 6, ySpan: 6 },
          'kpi-released': { xTrack: 12, yTrack: 0, xSpan: 6, ySpan: 6 },
          'kpi-contracts': { xTrack: 18, yTrack: 0, xSpan: 6, ySpan: 6 },
          'chart-lifecycle-funnel': { xTrack: 0, yTrack: 6, xSpan: 12, ySpan: 16 },
          'chart-category': { xTrack: 12, yTrack: 6, xSpan: 12, ySpan: 16 },
          'contracts-grid': { xTrack: 0, yTrack: 22, xSpan: 24, ySpan: 16 },
        },
      },
      {
        id: 'verifications',
        widgets: {
          'chart-outcomes': {
            type: 'bar-chart-grouped',
            dataMapping: {
              categoryKey: [{ id: 'milestones.verification_outcome' }],
              valueKey: [{ id: 'milestones.amount', aggregation: 'sum' }],
            },
            sort: [{ field: { id: 'milestones.amount', aggregation: 'sum' }, direction: 'desc' }],
            format: { title: { enabled: true, text: 'Verification Outcomes Breakdown' } },
          },
          'chart-payment-breakdown': {
            type: 'bar-chart-grouped',
            dataMapping: {
              categoryKey: [{ id: 'milestones.payment_status' }],
              valueKey: [{ id: 'milestones.amount', aggregation: 'sum' }],
            },
            sort: [{ field: { id: 'milestones.amount', aggregation: 'sum' }, direction: 'desc' }],
            format: { title: { enabled: true, text: 'Milestone Payment Staging Status' } },
          },
          'payment-filter': {
            type: 'list-filter',
            dataMapping: { value: [{ id: 'milestones.payment_status' }] },
            format: { title: { enabled: true, text: 'Payment Status' } },
          },
          'milestone-grid': {
            type: 'grid',
            dataMapping: {
              cols: [
                { id: 'milestones.contract_code' },
                { id: 'milestones.title' },
                { id: 'milestones.status' },
                { id: 'milestones.verification_outcome' },
                { id: 'milestones.action_owner' },
                { id: 'milestones.payment_status' },
                { id: 'milestones.amount', aggregation: 'sum' },
                { id: 'milestones.deadline' },
              ],
            },
            format: { title: { enabled: true, text: 'Milestone Deliverables & Aging Detail' } },
          },
        },
        widgetLayout: {
          'chart-outcomes': { xTrack: 0, yTrack: 0, xSpan: 12, ySpan: 14 },
          'chart-payment-breakdown': { xTrack: 12, yTrack: 0, xSpan: 12, ySpan: 14 },
          'payment-filter': { xTrack: 0, yTrack: 14, xSpan: 6, ySpan: 18 },
          'milestone-grid': { xTrack: 6, yTrack: 14, xSpan: 18, ySpan: 18 },
        },
      },
    ],
    selectedPageId: 'overview',
    panels: { filters: { collapsed: true } },
  }
}
