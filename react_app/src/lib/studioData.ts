import type { AgDataSourcesDefinition, AgFieldDefinition, AgReportState } from 'ag-studio'
import type { Contract } from '@/types/contract'

type Workspace = 'client' | 'freelancer'

const contractFields: AgFieldDefinition[] = [
  { id: 'id', name: 'Contract ID', format: 'textFormat' },
  { id: 'code', name: 'Code', format: 'textFormat' },
  { id: 'title', name: 'Title', format: 'textFormat' },
  { id: 'status', name: 'Status', format: 'textFormat' },
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

/**
 * Flattens contracts + milestones into the two AG Studio data sources linked by a
 * many-to-one relationship, so cross-table queries (e.g. "staged by contract status")
 * work without duplicating data on the backend.
 */
export function buildStudioData(
  contracts: Contract[],
  workspace: Workspace,
): AgDataSourcesDefinition {
  const contractRows = contracts.map((c) => {
    const milestones = c.milestones ?? []

    // Contract-level staged/released totals can lag behind milestone payment state,
    // so derive them from milestones and take the larger of the two sources.
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
    (c.milestones ?? []).map((m, index) => ({
      id: m.id,
      contract_id: c.id,
      contract_code: c.code,
      contract_title: c.title,
      title: m.title,
      status: m.status,
      payment_status: m.paymentStatus ?? 'not_started',
      amount: toNumber(m.amount),
      currency: m.currency || c.currency || 'USD',
      sort_order: index + 1,
      deadline: m.deadline ?? '',
    })),
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

/** Starter dashboard layout: one overview page plus a milestone drill-down page. */
export function buildInitialState(workspace: Workspace): AgReportState {
  const stagedCaption = workspace === 'client' ? 'Staged in PayPal' : 'Secured by Clients'
  const releasedCaption = workspace === 'client' ? 'Released Payouts' : 'Earned & Released'

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
            format: { caption: { enabled: true, text: 'Contracts' } },
          },
          'chart-contract-status': {
            type: 'bar-chart-grouped',
            dataMapping: {
              categoryKey: [{ id: 'contracts.status' }],
              valueKey: [{ id: 'contracts.total_amount', aggregation: 'sum' }],
            },
            sort: [{ field: { id: 'contracts.total_amount', aggregation: 'sum' }, direction: 'desc' }],
            format: { title: { enabled: true, text: 'Contract Value by Status' } },
          },
          'chart-milestone-status': {
            type: 'bar-chart-grouped',
            dataMapping: {
              categoryKey: [{ id: 'milestones.status' }],
              valueKey: [{ id: 'milestones.amount', aggregation: 'sum' }],
            },
            sort: [{ field: { id: 'milestones.amount', aggregation: 'sum' }, direction: 'desc' }],
            format: { title: { enabled: true, text: 'Milestone Value by Verification Status' } },
          },
          'contracts-grid': {
            type: 'grid',
            dataMapping: {
              cols: [
                { id: 'contracts.code' },
                { id: 'contracts.title' },
                { id: 'contracts.counterparty' },
                { id: 'contracts.status' },
                { id: 'contracts.total_amount', aggregation: 'sum' },
                { id: 'contracts.staged_amount', aggregation: 'sum' },
                { id: 'contracts.released_amount', aggregation: 'sum' },
                { id: 'contracts.milestone_count' },
              ],
            },
            format: { title: { enabled: true, text: 'Contract Ledger' } },
          },
        },
        widgetLayout: {
          'kpi-total': { xTrack: 0, yTrack: 0, xSpan: 6, ySpan: 6 },
          'kpi-staged': { xTrack: 6, yTrack: 0, xSpan: 6, ySpan: 6 },
          'kpi-released': { xTrack: 12, yTrack: 0, xSpan: 6, ySpan: 6 },
          'kpi-contracts': { xTrack: 18, yTrack: 0, xSpan: 6, ySpan: 6 },
          'chart-contract-status': { xTrack: 0, yTrack: 6, xSpan: 12, ySpan: 16 },
          'chart-milestone-status': { xTrack: 12, yTrack: 6, xSpan: 12, ySpan: 16 },
          'contracts-grid': { xTrack: 0, yTrack: 22, xSpan: 24, ySpan: 16 },
        },
      },
      {
        id: 'milestones',
        widgets: {
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
                { id: 'milestones.payment_status' },
                { id: 'milestones.amount', aggregation: 'sum' },
                { id: 'milestones.deadline' },
              ],
            },
            format: { title: { enabled: true, text: 'Milestone Detail' } },
          },
        },
        widgetLayout: {
          'payment-filter': { xTrack: 0, yTrack: 0, xSpan: 6, ySpan: 24 },
          'milestone-grid': { xTrack: 6, yTrack: 0, xSpan: 18, ySpan: 24 },
        },
      },
    ],
    selectedPageId: 'overview',
    panels: { filters: { collapsed: true } },
  }
}
