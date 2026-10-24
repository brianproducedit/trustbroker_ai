import { create } from 'zustand'
import type { Contract, Milestone, ContractStatus, MilestoneStatus } from '@/types/contract'
import type { PaymentStatus } from '@/types/payment'
import { INITIAL_CONTRACTS } from '@/lib/mockData'
import type { EvidenceSubmission, VerificationAssessment } from '@/types/verification'

interface ContractStore {
  contracts: Contract[]
  activeContractId: string
  activeRole: 'client' | 'freelancer'
  isAuthenticated: boolean
  isLoading: boolean
  
  // Auth Actions
  login: (role: 'client' | 'freelancer') => void
  signOut: () => void

  // Actions
  setActiveRole: (role: 'client' | 'freelancer') => void
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
  updateContractDraft: (contractId: string, updates: Partial<Contract>) => void
  deleteContract: (contractId: string) => void
  cancelContract: (contractId: string, reason?: string) => void
  acceptContract: (contractId: string, role: 'client' | 'freelancer') => void
  
  // Milestone Actions
  addMilestone: (contractId: string, milestone: Milestone) => void
  removeMilestone: (contractId: string, milestoneId: string) => void
  updateMilestone: (contractId: string, milestoneId: string, updates: Partial<Milestone>) => void
  
  // Payment Staging
  stagePayment: (contractId: string, amount: number, paypalOrderId: string) => void
  
  // Evidence & Verification
  submitEvidence: (contractId: string, milestoneId: string, submission: Omit<EvidenceSubmission, 'id' | 'submittedAt' | 'version'>) => Promise<VerificationAssessment>
  requestRevision: (contractId: string, milestoneId: string, notes: string) => void
  resubmitDelivery: (contractId: string, milestoneId: string) => void
  releasePayment: (contractId: string, milestoneId: string) => void
  
  // Add Audit Event
  addAuditLog: (contractId: string, action: string, details: string, actor: string) => void
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: INITIAL_CONTRACTS,
  activeContractId: 'contract-1',
  activeRole: 'client',
  isAuthenticated: true,
  isLoading: false,

  login: (role) => set({ isAuthenticated: true, activeRole: role }),
  signOut: () => set({ isAuthenticated: false }),

  setActiveRole: (role) => set({ activeRole: role }),

  toggleActiveRole: () =>
    set((state) => ({ activeRole: state.activeRole === 'client' ? 'freelancer' : 'client' })),

  setActiveContract: (id) => set({ activeContractId: id }),

  getActiveContract: () => {
    const { contracts, activeContractId } = get()
    return contracts.find((c) => c.id === activeContractId || c.code === activeContractId) || contracts[0]
  },

  getRoleContracts: () => {
    const { contracts, activeRole } = get()
    if (activeRole === 'client') {
      return contracts.filter((c) => c.client.email === 'elena@acmeglobal.com')
    }
    return contracts.filter((c) => c.freelancer.email === 'tariro@devstudio.co.zw')
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
        if (activeRole === 'client' && (m.status === 'verifying' || m.status === 'submitted')) {
          pendingCount += 1
        } else if (activeRole === 'freelancer' && (m.status === 'in_progress' || m.status === 'pending')) {
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
      client: {
        id: 'client-01',
        name: 'Elena Rostova',
        email: 'elena@acmeglobal.com',
        role: 'client',
        accepted: true,
        acceptedAt: new Date().toISOString(),
      },
      freelancer: {
        id: 'freelancer-01',
        name: 'Tariro Moyo',
        email: 'tariro@devstudio.co.zw',
        role: 'freelancer',
        accepted: false,
      },
      milestones,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Elena Rostova (Client)',
          action: 'CONTRACT_CREATED',
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

  updateContractDraft: (contractId, updates) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const updatedMilestones = updates.milestones || c.milestones
          const totalAmount = updatedMilestones.reduce((sum, m) => sum + m.amount, 0)
          return {
            ...c,
            ...updates,
            totalAmount,
            version: c.version + 1,
            updatedAt: new Date().toISOString(),
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Elena Rostova (Client)',
                action: 'CONTRACT_UPDATED',
                details: `Contract scope updated to version ${c.version + 1}.`,
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  deleteContract: (contractId) => {
    set((state) => {
      const remaining = state.contracts.filter((c) => c.id !== contractId && c.code !== contractId)
      return {
        contracts: remaining,
        activeContractId: remaining[0]?.id || '',
      }
    })
  },

  cancelContract: (contractId, reason = 'Cancelled by mutual request.') => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            status: 'cancelled' as ContractStatus,
            updatedAt: new Date().toISOString(),
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'System',
                action: 'CONTRACT_CANCELLED',
                details: reason,
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  acceptContract: (contractId, role) => {
    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const clientAccepted = role === 'client' ? true : c.client.accepted
          const freelancerAccepted = role === 'freelancer' ? true : c.freelancer.accepted
          const bothAccepted = clientAccepted && freelancerAccepted
          const status: ContractStatus = bothAccepted ? 'active' : 'pending_acceptance'

          return {
            ...c,
            status,
            client: {
              ...c.client,
              accepted: clientAccepted,
              acceptedAt: role === 'client' ? new Date().toISOString() : c.client.acceptedAt,
            },
            freelancer: {
              ...c.freelancer,
              accepted: freelancerAccepted,
              acceptedAt: role === 'freelancer' ? new Date().toISOString() : c.freelancer.acceptedAt,
            },
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: role === 'client' ? c.client.name : c.freelancer.name,
                action: `${role.toUpperCase()}_ACCEPTED`,
                details: `${role === 'client' ? 'Client' : 'Freelancer'} digitally accepted contract terms.`,
              },
            ],
          }
        }
        return c
      })
      return { contracts: updated }
    })
  },

  addMilestone: (contractId, milestone) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const updatedMilestones = [...c.milestones, milestone]
          const totalAmount = updatedMilestones.reduce((sum, m) => sum + m.amount, 0)
          return {
            ...c,
            milestones: updatedMilestones,
            totalAmount,
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      }),
    }))
  },

  removeMilestone: (contractId, milestoneId) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const updatedMilestones = c.milestones.filter((m) => m.id !== milestoneId)
          const totalAmount = updatedMilestones.reduce((sum, m) => sum + m.amount, 0)
          return {
            ...c,
            milestones: updatedMilestones,
            totalAmount,
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      }),
    }))
  },

  updateMilestone: (contractId, milestoneId, updates) => {
    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const updatedMilestones = c.milestones.map((m) =>
            m.id === milestoneId ? { ...m, ...updates } : m
          )
          const totalAmount = updatedMilestones.reduce((sum, m) => sum + m.amount, 0)
          return {
            ...c,
            milestones: updatedMilestones,
            totalAmount,
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      })
      return { contracts: updated }
    })
  },

  stagePayment: (contractId, amount, paypalOrderId) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            stagedAmount: c.stagedAmount + amount,
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'PayPal Sandbox',
                action: 'PAYMENT_STAGED',
                details: `Staged $${amount} USD for milestone funding (PayPal Order: ${paypalOrderId}).`,
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  submitEvidence: async (contractId, milestoneId, submission) => {
    set({ isLoading: true })

    // Simulate AI Verification evaluation (Groq LPU llama-3.3-70b)
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
      summaryAnalysis: 'AI Verification complete. All acceptance criteria evaluated. Deliverables meet requirements for milestone payment release.',
      assessedAt: new Date().toISOString(),
      modelUsed: 'Groq LPU (llama-3.3-70b)',
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
                actor: 'Groq AI Verifier',
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

  requestRevision: (contractId, milestoneId, notes) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            milestones: c.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  status: 'revision_requested' as MilestoneStatus,
                }
              }
              return m
            }),
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Elena Rostova (Client)',
                action: 'REVISION_REQUESTED',
                details: `Revision requested: "${notes}".`,
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  resubmitDelivery: (contractId, milestoneId) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            milestones: c.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  status: 'in_progress' as MilestoneStatus,
                }
              }
              return m
            }),
          }
        }
        return c
      }),
    }))
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
                details: `Disbursement executed for milestone: $${releasedDelta} USD released to freelancer.`,
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
