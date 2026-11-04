import type { AcceptanceCriterion, VerificationAssessment } from './verification'
import type { PaymentStatus } from './payment'

export type ContractStatus =
  | 'draft'
  | 'open'
  | 'awarded'
  | 'pending_acceptance'
  | 'active'
  | 'in_verification'
  | 'completed'
  | 'disputed'
  | 'cancelled'

export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'verifying'
  | 'verified'
  | 'settled'
  | 'revision_requested'

export interface Milestone {
  id: string
  title: string
  description: string
  amount: number
  currency: string
  deadline: string
  status: MilestoneStatus
  acceptanceCriteria: AcceptanceCriterion[]
  assessment?: VerificationAssessment
  submittedEvidence?: {
    repoUrl?: string
    liveUrl?: string
    description?: string
    fileAttachments?: Array<{ name: string; url: string; sizeBytes: number; mimeType: string }>
    submittedAt: string
  }
  paymentStatus: PaymentStatus
}

export interface ContractParty {
  id: string
  name: string
  email: string
  organization?: string
  role: 'client' | 'freelancer'
  accepted: boolean
  acceptedAt?: string
  contentHash?: string
  ipAddress?: string
  userAgent?: string
}

export interface ContractAuditLog {
  id: string
  timestamp: string
  actor: string
  action: string
  details: string
  recordHash?: string
}

export interface Contract {
  id: string
  code: string // e.g. "TB-2026-084"
  title: string
  description: string
  version: number
  status: ContractStatus
  totalAmount: number
  currency: string
  stagedAmount: number
  releasedAmount: number
  contentHash?: string
  client: ContractParty
  freelancer: ContractParty
  milestones: Milestone[]
  auditLogs: ContractAuditLog[]
  createdAt: string
  updatedAt: string
}
