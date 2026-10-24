import { create } from 'zustand'
import type { Contract, Milestone, ContractStatus, MilestoneStatus } from '@/types/contract'
import type { PaymentStatus } from '@/types/payment'
import { INITIAL_CONTRACTS } from '@/lib/mockData'
import type { EvidenceSubmission, VerificationAssessment } from '@/types/verification'

interface ContractStore {
  contracts: Contract[]
  activeContractId: string
  activeRole: 'buyer' | 'supplier'
  isAuthenticated: boolean
  isLoading: boolean
  
  // Auth Actions
  login: (role: 'buyer' | 'supplier') => void
  signOut: () => void

  // Actions
  setActiveRole: (role: 'buyer' | 'supplier') => void
  toggleActiveRole: () => void
  setActiveContract: (id: string) => void
  getActiveContract: () => Contract | undefined
  
  // Role-aware queries
  getRoleContracts: () => Contract[]
  getRoleMetrics: () => {
    activeCount: number
    escrowAmount: number
    pendingCount: number
    settledAmount: number
  }
  
  // SOW Actions
  createContractDraft: (title: string, description: string, milestones: Milestone[]) => string
  acceptContract: (contractId: string, role: 'buyer' | 'supplier') => void
  updateMilestone: (contractId: string, milestoneId: string, updates: Partial<Milestone>) => void
  
  // Evidence & Verification
  submitEvidence: (contractId: string, milestoneId: string, submission: Omit<EvidenceSubmission, 'id' | 'submittedAt' | 'version'>) => Promise<VerificationAssessment>
  releasePayment: (contractId: string, milestoneId: string) => void
  
  // Add Audit Event
  addAuditLog: (contractId: string, action: string, details: string, actor: string) => void
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: INITIAL_CONTRACTS,
  activeContractId: 'contract-1',
  activeRole: 'buyer',
  isAuthenticated: true,
  isLoading: false,

  login: (role) => set({ isAuthenticated: true, activeRole: role }),
  signOut: () => set({ isAuthenticated: false }),

  setActiveRole: (role) => set({ activeRole: role }),

  toggleActiveRole: () =>
    set((state) => ({ activeRole: state.activeRole === 'buyer' ? 'supplier' : 'buyer' })),

  setActiveContract: (id) => set({ activeContractId: id }),

  getActiveContract: () => {
    const { contracts, activeContractId } = get()
    return contracts.find((c) => c.id === activeContractId || c.code === activeContractId) || contracts[0]
  },

  getRoleContracts: () => {
    const { contracts, activeRole } = get()
    if (activeRole === 'buyer') {
      return contracts.filter((c) => c.buyer.email === 'elena@acmeglobal.com')
    }
    return contracts.filter((c) => c.supplier.email === 'tariro@devstudio.co.zw')
  },

  getRoleMetrics: () => {
    const { getRoleContracts, activeRole } = get()
    const roleContracts = getRoleContracts()
    const activeCount = roleContracts.filter((c) => c.status !== 'completed' && c.status !== 'cancelled').length
    const escrowAmount = roleContracts.reduce((sum, c) => sum + c.stagedAmount, 0)
    const settledAmount = roleContracts.reduce((sum, c) => sum + c.releasedAmount, 0)
    
    // Count pending milestones
    let pendingCount = 0
    roleContracts.forEach((c) => {
      c.milestones.forEach((m) => {
        if (activeRole === 'buyer' && (m.status === 'verifying' || m.status === 'submitted')) {
          pendingCount += 1
        } else if (activeRole === 'supplier' && (m.status === 'in_progress' || m.status === 'pending')) {
          pendingCount += 1
        }
      })
    })

    return {
      activeCount: activeCount || roleContracts.length,
      escrowAmount,
      pendingCount,
      settledAmount,
    }
  },

  createContractDraft: (title, description, milestones) => {
    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
    const newCode = `TB-2026-${Math.floor(100 + Math.random() * 900)}`
    const newId = `contract-${Date.now()}`

    const newContract: Contract = {
      id: newId,
      code: newCode,
      title,
      description,
      version: 1,
      status: 'pending_acceptance',
      totalAmount,
      currency: 'USD',
      stagedAmount: 0,
      releasedAmount: 0,
      buyer: {
        id: 'buyer-01',
        name: 'Elena Rostova',
        email: 'elena@acmeglobal.com',
        role: 'buyer',
        accepted: true,
        acceptedAt: new Date().toISOString(),
      },
      supplier: {
        id: 'supplier-01',
        name: 'Tariro Moyo',
        email: 'tariro@devstudio.co.zw',
        role: 'supplier',
        accepted: false,
      },
      milestones,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Elena Rostova (Buyer)',
          action: 'SOW_DRAFTED',
          details: `Draft created: "${title}" with ${milestones.length} milestones.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      contracts: [newContract, ...state.contracts],
      activeContractId: newId,
    }))

    return newId
  },

  acceptContract: (contractId, role) => {
    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const buyerAccepted = role === 'buyer' ? true : c.buyer.accepted
          const supplierAccepted = role === 'supplier' ? true : c.supplier.accepted
          const bothAccepted = buyerAccepted && supplierAccepted
          const status: ContractStatus = bothAccepted ? 'active' : 'pending_acceptance'

          return {
            ...c,
            status,
            buyer: {
              ...c.buyer,
              accepted: buyerAccepted,
              acceptedAt: role === 'buyer' ? new Date().toISOString() : c.buyer.acceptedAt,
            },
            supplier: {
              ...c.supplier,
              accepted: supplierAccepted,
              acceptedAt: role === 'supplier' ? new Date().toISOString() : c.supplier.acceptedAt,
            },
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: role === 'buyer' ? c.buyer.name : c.supplier.name,
                action: `${role.toUpperCase()}_ACCEPTED`,
                details: `${role === 'buyer' ? 'Buyer' : 'Supplier'} digitally accepted contract terms.`,
              },
            ],
          }
        }
        return c
      })
      return { contracts: updated }
    })
  },

  updateMilestone: (contractId, milestoneId, updates) => {
    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            milestones: c.milestones.map((m) =>
              m.id === milestoneId ? { ...m, ...updates } : m
            ),
          }
        }
        return c
      })
      return { contracts: updated }
    })
  },

  submitEvidence: async (contractId, milestoneId, submission) => {
    set({ isLoading: true })

    // Simulate AI Verification evaluation (Gemini 1.5 Pro)
    await new Promise((r) => setTimeout(r, 1200))

    const assessment: VerificationAssessment = {
      id: `asm-${Date.now()}`,
      submissionId: `sub-${Date.now()}`,
      overallScore: 94,
      passed: true,
      criteriaResults: [
        {
          id: 'c-new-1',
          title: 'Repository Structure & Build Verification',
          description: 'Production build executes cleanly without errors.',
          status: 'pass',
          aiConfidence: 0.98,
          evidenceMatchSnippet: 'GitHub repository structure confirmed with standard package.json and tsconfig.json.',
          feedback: 'Build and TypeScript validation criteria satisfied.',
        },
        {
          id: 'c-new-2',
          title: 'Functional Acceptance Check',
          description: 'Stated deliverables in SOW verified against committed files.',
          status: 'pass',
          aiConfidence: 0.92,
          evidenceMatchSnippet: `Verified submission description: "${submission.description.slice(0, 80)}..."`,
          feedback: 'Code deliverables match milestone scope.',
        },
      ],
      summaryAnalysis: 'AI Verification complete. All acceptance criteria evaluated. Deliverables meet requirements for milestone payment authorization.',
      assessedAt: new Date().toISOString(),
      modelUsed: 'Gemini 1.5 Pro',
      requiresHumanReview: false,
    }

    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            milestones: c.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  status: 'verified' as MilestoneStatus,
                  paymentStatus: 'release_authorized' as PaymentStatus,
                  assessment,
                }
              }
              return m
            }),
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Gemini AI Verifier',
                action: 'AI_VERIFICATION_PASSED',
                details: `Evidence for milestone "${milestoneId}" verified. Score: ${assessment.overallScore}%.`,
              },
            ],
          }
        }
        return c
      })
      return { contracts: updated, isLoading: false }
    })

    return assessment
  },

  releasePayment: (contractId, milestoneId) => {
    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          let releasedDelta = 0
          const updatedMilestones = c.milestones.map((m) => {
            if (m.id === milestoneId) {
              releasedDelta = m.amount
              return {
                ...m,
                status: 'settled' as const,
                paymentStatus: 'released' as const,
              }
            }
            return m
          })

          return {
            ...c,
            releasedAmount: c.releasedAmount + releasedDelta,
            milestones: updatedMilestones,
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'PayPal Sandbox Gateway',
                action: 'PAYMENT_RELEASED',
                details: `Disbursement executed for milestone: $${releasedDelta} USD released to supplier.`,
              },
            ],
          }
        }
        return c
      })
      return { contracts: updated }
    })
  },

  addAuditLog: (contractId, action, details, actor) => {
    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor,
                action,
                details,
              },
            ],
          }
        }
        return c
      })
      return { contracts: updated }
    })
  },
}))
