export type CriterionStatus = 'pass' | 'fail' | 'needs_review' | 'pending'

export interface AcceptanceCriterion {
  id: string
  title: string
  description: string
  status: CriterionStatus
  aiConfidence?: number
  evidenceMatchSnippet?: string
  feedback?: string
}

export interface EvidenceSubmission {
  id: string
  contractId: string
  milestoneId: string
  submittedBy: string
  submittedAt: string
  description: string
  repoUrl?: string
  liveUrl?: string
  fileAttachments?: {
    name: string
    url: string
    sizeBytes: number
    mimeType: string
  }[]
  version: number
}

export interface VerificationAssessment {
  id: string
  submissionId: string
  overallScore: number // 0 to 100
  passed: boolean
  criteriaResults: AcceptanceCriterion[]
  summaryAnalysis: string
  assessedAt: string
  modelUsed: string
  requiresHumanReview: boolean
}
