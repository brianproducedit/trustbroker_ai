import type { Contract, Milestone, ContractParty, ContractAuditLog } from '@/types/contract'
import type { AcceptanceCriterion } from '@/types/verification'

export function transformAcceptanceCriterion(c: any): AcceptanceCriterion {
  return {
    id: String(c.id),
    title: c.title || '',
    description: c.description || '',
    evidenceType: c.evidence_type || 'text',
    status: c.status || 'pending',
    aiConfidence: c.ai_confidence !== undefined && c.ai_confidence !== null ? Number(c.ai_confidence) : undefined,
    evidenceMatchSnippet: c.evidence_match_snippet || undefined,
    feedback: c.feedback || undefined,
  }
}

export function transformMilestone(m: any): Milestone {
  return {
    id: String(m.id),
    title: m.title || '',
    description: m.description || '',
    amount: Number(m.amount) || 0,
    currency: m.currency || 'USD',
    deadline: m.deadline || '',
    status: m.status || 'pending',
    paymentStatus: m.payment_status || 'not_started',
    acceptanceCriteria: Array.isArray(m.acceptance_criteria)
      ? m.acceptance_criteria.map(transformAcceptanceCriterion)
      : [],
  }
}

export function transformContract(c: any, auditLogs: any[] = []): Contract {
  const currentVersion = c.current_version || 1
  const acceptances = Array.isArray(c.acceptances) ? c.acceptances : []

  const clientAcceptance = acceptances.find(
    (a: any) => a.role === 'client' && a.version_number === currentVersion
  )
  const freelancerAcceptance = acceptances.find(
    (a: any) => a.role === 'freelancer' && a.version_number === currentVersion
  )

  const client: ContractParty = {
    id: String(c.client_id || 'client-default'),
    name: c.client_name || 'Client',
    email: c.client_email || '',
    organization: c.client_organization || undefined,
    role: 'client',
    accepted: Boolean(clientAcceptance),
    acceptedAt: clientAcceptance?.accepted_at,
  }

  const freelancer: ContractParty = {
    id: String(c.freelancer_id || 'freelancer-default'),
    name: c.freelancer_name || (c.freelancer_email ? c.freelancer_email.split('@')[0] : 'Freelancer'),
    email: c.freelancer_email || '',
    organization: c.freelancer_organization || undefined,
    role: 'freelancer',
    accepted: Boolean(freelancerAcceptance),
    acceptedAt: freelancerAcceptance?.accepted_at,
  }

  const transformedMilestones: Milestone[] = Array.isArray(c.milestones)
    ? c.milestones.map(transformMilestone)
    : []

  const transformedAuditLogs: ContractAuditLog[] = Array.isArray(auditLogs) && auditLogs.length > 0
    ? auditLogs.map((a: any) => ({
        id: String(a.id),
        timestamp: a.created_at || new Date().toISOString(),
        actor: a.actor_name || 'System',
        action: a.action || 'UPDATE',
        details: a.details || '',
      }))
    : [
        {
          id: `log-${c.id}`,
          timestamp: c.created_at || new Date().toISOString(),
          actor: client.name,
          action: 'CONTRACT_CREATED',
          details: `Contract ${c.code || ''} initialized.`,
        },
      ]

  return {
    id: String(c.id),
    code: c.code || `TB-2026-${String(c.id).slice(0, 4)}`,
    title: c.title || 'Untitled Project',
    description: c.description || '',
    version: currentVersion,
    status: c.status || 'draft',
    totalAmount: Number(c.total_amount) || 0,
    currency: c.currency || 'USD',
    stagedAmount: Number(c.staged_amount) || 0,
    releasedAmount: Number(c.released_amount) || 0,
    client,
    freelancer,
    milestones: transformedMilestones,
    auditLogs: transformedAuditLogs,
    createdAt: c.created_at || new Date().toISOString(),
    updatedAt: c.updated_at || new Date().toISOString(),
  }
}
