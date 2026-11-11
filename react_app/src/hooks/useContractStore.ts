import { create } from 'zustand'
import type { Contract, Milestone, ContractStatus, MilestoneStatus } from '@/types/contract'
import type { PaymentStatus } from '@/types/payment'
import type { EvidenceSubmission, VerificationAssessment } from '@/types/verification'
import { api } from '@/lib/api'
import { transformContract } from '@/lib/transformers'
import { useAuthStore } from './useAuthStore'

function workspaceActor(role: 'client' | 'freelancer'): string {
  const user = useAuthStore.getState().user
  const workspace = role === 'client' ? 'Client' : 'Freelancer'
  return user?.name ? `${user.name} (${workspace})` : workspace
}

interface ContractStore {
  contracts: Contract[]
  activeContractId: string
  activeRole: 'client' | 'freelancer'
  isAuthenticated: boolean
  isLoading: boolean
  isSyncing: boolean
  error: string | null

  // Backend Sync Actions
  fetchContracts: () => Promise<void>
  fetchContractById: (id: string) => Promise<Contract | null>

  // Auth Compatibility Proxies
  login: (role: 'client' | 'freelancer') => void
  signOut: () => void

  // Role and Selection Actions
  setActiveRole: (role: 'client' | 'freelancer') => void
  toggleActiveRole: () => void
  setActiveContract: (id: string) => void
  getActiveContract: () => Contract | undefined

  // Role-aware queries
  getRoleContracts: () => Contract[]
  getRoleMetrics: () => {
    activeCount: number
    stagedAmount: number
    pendingCount: number
    settledAmount: number
  }

  // SOW Actions
  createContractDraft: (
    title: string,
    description: string,
    milestones: Milestone[],
    options?: { category?: string; requiredSkills?: string[]; freelancerEmail?: string }
  ) => Promise<string>
  publishContract: (contractId: string) => Promise<Contract>
  updateContractDraft: (contractId: string, updates: Partial<Contract>) => Promise<void>
  deleteContract: (contractId: string) => Promise<void>
  cancelContract: (contractId: string, reason?: string) => Promise<void>
  acceptContract: (contractId: string, role?: 'client' | 'freelancer') => Promise<void>
  declineAward: (contractId: string, reason?: string) => Promise<void>

  // Milestone Actions
  addMilestone: (contractId: string, milestone: Milestone) => void
  removeMilestone: (contractId: string, milestoneId: string) => void
  updateMilestone: (contractId: string, milestoneId: string, updates: Partial<Milestone>) => void

  // Payment Staging
  stagePayment: (
    contractId: string,
    amount: number,
    paypalOrderId: string,
    milestoneId?: string
  ) => Promise<void>

  // Evidence & Verification
  submitEvidence: (
    contractId: string,
    milestoneId: string,
    submission: Omit<EvidenceSubmission, 'id' | 'submittedAt' | 'version'> & {
      onVerificationProgress?: (progress: { deliveryId?: string; status: string; elapsedSeconds: number }) => void
      isVerificationCancelled?: () => boolean
    }
  ) => Promise<VerificationAssessment>
  requestRevision: (contractId: string, milestoneId: string, notes: string) => Promise<void>
  overrideReview: (contractId: string, milestoneId: string, reason: string) => Promise<void>
  resubmitDelivery: (contractId: string, milestoneId: string) => void
  releasePayment: (contractId: string, milestoneId: string) => Promise<{ status?: string }>
  reclaimMilestoneFunds: (contractId: string, milestoneId: string, reason?: string) => Promise<void>
  manualVerify: (contractId: string, milestoneId: string, rationale: string) => Promise<void>

  // Add Audit Event
  addAuditLog: (contractId: string, action: string, details: string, actor: string) => void
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: [],
  activeContractId: '',
  activeRole: (localStorage.getItem('tb_active_role') as 'client' | 'freelancer') || 'client',
  isAuthenticated: true,
  isLoading: false,
  isSyncing: false,
  error: null,

  fetchContracts: async () => {
    set({ isSyncing: true })
    try {
      const activeRole = useAuthStore.getState().activeRole || (localStorage.getItem('tb_active_role') as 'client' | 'freelancer') || get().activeRole || 'client'
      const res = await api.contracts.list({ role: activeRole })
      if (res && Array.isArray(res.contracts)) {
        if (res.contracts.length > 0) {
          const transformed = res.contracts.map((c) => transformContract(c))
          set({
            contracts: transformed,
            activeContractId: transformed[0]?.id || get().activeContractId,
            isSyncing: false,
            error: null,
          })
          return
        } else {
          set({
            contracts: [],
            activeContractId: '',
            isSyncing: false,
            error: null,
          })
          return
        }
      }
    } catch (err) {
      console.error('Backend list_contracts failed:', err)
      set({ isSyncing: false, error: 'Unable to load contracts from the backend.' })
      throw err
    }
    set({ isSyncing: false })
  },

  fetchContractById: async (id: string) => {
    // Only attempt UUID lookups on backend
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) {
      return get().getActiveContract() || null
    }

    try {
      const contractData = await api.contracts.get(id)
      let auditLogs: any[] = []
      try {
        auditLogs = await api.audit.getAuditTrail(id)
      } catch {
        // Audit trail optional
      }

      const transformed = transformContract(contractData, auditLogs)
      set((state) => ({
        contracts: state.contracts.some((c) => c.id === id)
          ? state.contracts.map((c) => (c.id === id ? transformed : c))
          : [transformed, ...state.contracts],
        activeContractId: id,
      }))
      return transformed
    } catch (err) {
      console.warn(`Failed to fetch contract ${id} from API:`, err)
      return get().contracts.find((c) => c.id === id) || null
    }
  },

  // Auth proxies
  login: (role) => {
    useAuthStore.getState().signInWithDevRole(role)
    set({ activeRole: role, isAuthenticated: true })
  },
  signOut: () => {
    useAuthStore.getState().signOut()
    set({ isAuthenticated: false })
  },

  setActiveRole: (role) => {
    useAuthStore.getState().setActiveRole(role)
    set({ activeRole: role })
  },

  toggleActiveRole: () => {
    const nextRole = get().activeRole === 'client' ? 'freelancer' : 'client'
    get().setActiveRole(nextRole)
  },

  setActiveContract: (id) => set({ activeContractId: id }),

  getActiveContract: () => {
    const { contracts, activeContractId } = get()
    return (
      contracts.find((c) => c.id === activeContractId || c.code === activeContractId) ||
      contracts[0]
    )
  },

  getRoleContracts: () => {
    const { contracts, activeRole } = get()
    const currentUser = useAuthStore.getState().user

    if (currentUser?.email) {
      const filtered = contracts.filter((c) => {
        if (activeRole === 'client') {
          return (
            c.client.email === currentUser.email ||
            c.client.email === 'elena@acmeglobal.com' ||
            c.client.id === currentUser.id
          )
        }
        return (
          c.freelancer.email === currentUser.email ||
          c.freelancer.email === 'tariro@devstudio.co.zw' ||
          c.freelancer.id === currentUser.id
        )
      })
      if (filtered.length > 0) return filtered
    }

    if (activeRole === 'client') {
      return contracts.filter((c) => c.client.email === 'elena@acmeglobal.com' || c.client.role === 'client')
    }
    return contracts.filter((c) => c.freelancer.email === 'tariro@devstudio.co.zw' || c.freelancer.role === 'freelancer')
  },

  getRoleMetrics: () => {
    const { getRoleContracts, activeRole } = get()
    const roleContracts = getRoleContracts()
    const activeCount = roleContracts.filter(
      (c) => c.status !== 'completed' && c.status !== 'cancelled'
    ).length
    const stagedAmount = roleContracts.reduce((sum, c) => sum + c.stagedAmount, 0)
    const settledAmount = roleContracts.reduce((sum, c) => sum + c.releasedAmount, 0)

    let pendingCount = 0
    roleContracts.forEach((c) => {
      c.milestones.forEach((m) => {
        if (activeRole === 'client' && (m.status === 'verifying' || m.status === 'submitted')) {
          pendingCount += 1
        } else if (
          activeRole === 'freelancer' &&
          (m.status === 'in_progress' || m.status === 'pending')
        ) {
          pendingCount += 1
        }
      })
    })

    return {
      activeCount: activeCount || roleContracts.length,
      stagedAmount,
      pendingCount,
      settledAmount,
    }
  },

  createContractDraft: async (title, description, milestones, options) => {
    const freelancerEmail = options?.freelancerEmail

    // Try backend API first
    try {
      const payload = {
        title,
        description,
        category: options?.category || 'software',
        required_skills: options?.requiredSkills || [],
        currency: 'USD',
        ...(freelancerEmail ? { freelancer_email: freelancerEmail } : {}),
        milestones: milestones.map((m, idx) => ({
          title: m.title,
          description: m.description,
          amount: m.amount,
          currency: m.currency || 'USD',
          deadline: m.deadline || undefined,
          sort_order: idx + 1,
          acceptance_criteria: m.acceptanceCriteria.map((ac) => ({
            title: ac.title,
            description: ac.description || '',
            evidence_type: ac.evidenceType || 'text',
          })),
        })),
      }

      const created = await api.contracts.create(payload)
      if (created && created.id) {
        const transformed = transformContract(created)
        set((state) => ({
          contracts: [transformed, ...state.contracts],
          activeContractId: transformed.id,
        }))
        return transformed.id
      }
    } catch (err) {
      console.error('Backend contract creation failed:', err)
      throw err
    }
    throw new Error('Backend did not return a created contract.')
  },

  publishContract: async (contractId) => {
    const published = await api.contracts.publish(contractId)
    const transformed = transformContract(published)
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === transformed.id ? { ...c, ...transformed } : c)),
      activeContractId: transformed.id,
    }))
    return transformed
  },

  updateContractDraft: async (contractId, updates) => {
    // Attempt backend update
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)
    if (isUuid) {
      try {
        await api.contracts.update(contractId, updates)
      } catch (err) {
        console.error('Backend updateContract failed:', err)
        throw err
      }
    }

    // Update local state
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
                actor: workspaceActor(state.activeRole),
                action: 'CONTRACT_UPDATED',
                details: `Contract updated to version ${c.version + 1}.`,
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  deleteContract: async (contractId) => {
    await get().cancelContract(contractId, 'Deleted by user')
  },

  cancelContract: async (contractId, reason) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)
    if (isUuid) {
      try {
        await api.contracts.cancel(contractId, reason)
      } catch (err) {
        console.error('Backend cancelContract failed:', err)
        throw err
      }
    }

    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            status: 'cancelled' as ContractStatus,
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: workspaceActor(state.activeRole),
                action: 'CONTRACT_CANCELLED',
                details: reason || 'Contract cancelled.',
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  acceptContract: async (contractId, roleParam) => {
    const role = roleParam || get().activeRole
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)

    if (isUuid) {
      try {
        const updated = await api.contracts.accept(contractId)
        if (updated) {
          const transformed = transformContract(updated)
          set((state) => ({
            contracts: state.contracts.map((c) => (c.id === contractId ? transformed : c)),
          }))
          return
        }
      } catch (err) {
        console.error('Backend acceptContract failed:', err)
        throw err
      }
    }

    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const isClient = role === 'client'
          const client = isClient ? { ...c.client, accepted: true, acceptedAt: new Date().toISOString() } : c.client
          const freelancer = !isClient ? { ...c.freelancer, accepted: true, acceptedAt: new Date().toISOString() } : c.freelancer
          const bothAccepted = client.accepted && freelancer.accepted

          return {
            ...c,
            client,
            freelancer,
            status: bothAccepted ? ('active' as ContractStatus) : ('pending_acceptance' as ContractStatus),
            milestones: bothAccepted
              ? c.milestones.map((m) => ({ ...m, status: 'in_progress' as MilestoneStatus }))
              : c.milestones,
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: isClient ? `${c.client.name} (Client)` : `${c.freelancer.name} (Freelancer)`,
                action: bothAccepted ? 'CONTRACT_ACTIVATED' : 'TERMS_ACCEPTED',
                details: bothAccepted
                  ? 'All parties signed. Contract is now ACTIVE and milestone staging is unlocked.'
                  : `${isClient ? 'Client' : 'Freelancer'} accepted contract terms.`,
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  declineAward: async (contractId, reason) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)

    if (isUuid) {
      try {
        const updated = await api.contracts.decline(contractId, reason)
        if (updated) {
          const transformed = transformContract(updated)
          set((state) => ({
            contracts: state.contracts.map((c) => (c.id === contractId ? transformed : c)),
          }))
          return
        }
      } catch (err) {
        console.error('Backend declineAward failed:', err)
        throw err
      }
    }

    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            status: 'open' as ContractStatus,
            freelancer: { ...c.freelancer, name: '', email: '', accepted: false },
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Freelancer',
                action: 'AWARD_DECLINED',
                details: reason
                  ? `Freelancer declined the award. Reason: ${reason}`
                  : 'Freelancer declined the award. The listing is open again.',
              },
            ],
          }
        }
        return c
      }),
    }))
  },

  addMilestone: (contractId, milestone) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const milestones = [...c.milestones, milestone]
          return {
            ...c,
            milestones,
            totalAmount: milestones.reduce((sum, m) => sum + m.amount, 0),
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
          const milestones = c.milestones.filter((m) => m.id !== milestoneId)
          return {
            ...c,
            milestones,
            totalAmount: milestones.reduce((sum, m) => sum + m.amount, 0),
          }
        }
        return c
      }),
    }))
  },

  updateMilestone: (contractId, milestoneId, updates) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const milestones = c.milestones.map((m) =>
            m.id === milestoneId ? { ...m, ...updates } : m
          )
          return {
            ...c,
            milestones,
            totalAmount: milestones.reduce((sum, m) => sum + m.amount, 0),
          }
        }
        return c
      }),
    }))
  },

  stagePayment: async (contractId, amount, paypalOrderId, milestoneId) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)

    if (isUuid && milestoneId) {
      try {
        await api.payments.captureOrder({
          contract_id: contractId,
          milestone_id: milestoneId,
          paypal_order_id: paypalOrderId,
        })
      } catch (err) {
        console.error('Backend payment capture failed:', err)
        throw err
      }
    }

    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          const updatedMilestones = c.milestones.map((m) => {
            if (!milestoneId || m.id === milestoneId) {
              return {
                ...m,
                paymentStatus: 'staged_in_sandbox' as PaymentStatus,
                status: m.status === 'pending' ? ('in_progress' as MilestoneStatus) : m.status,
              }
            }
            return m
          })

          return {
            ...c,
            stagedAmount: c.stagedAmount + amount,
            milestones: updatedMilestones,
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'PayPal Sandbox Gateway',
                action: 'PAYMENT_STAGED',
                details: `Funds captured: $${amount} USD staged into PayPal sandbox (Order #${paypalOrderId.slice(0, 10)}...).`,
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)

    if (isUuid) {
      try {
        const deliveryRes = await api.deliveries.submit({
          contract_id: contractId,
          milestone_id: milestoneId,
          description: submission.description,
          repo_url: submission.repoUrl,
          live_url: submission.liveUrl,
          files: (submission.fileAttachments || []).map((f) => ({
            file_name: f.name,
            storage_path: f.url,
            size_bytes: f.sizeBytes,
            mime_type: f.mimeType,
          })),
        })

        const deliveryId = deliveryRes?.delivery?.id || deliveryRes?.id
        let verifyRes = deliveryRes?.verification
        const progress = submission.onVerificationProgress
        const startedAt = Date.now()
        progress?.({
          deliveryId,
          status: verifyRes?.status || 'submitted',
          elapsedSeconds: 0,
        })

        // If verification was queued in the background, poll until the report lands.
        if (verifyRes?.status === 'queued' && deliveryId) {
          // Vision verification may deliberately wait for a provider rate-limit
          // reset before retrying. Keep polling long enough for that job instead
          // of starting a second verification request while it is still running.
          for (let attempt = 0; attempt < 220 && !verifyRes?.report; attempt++) {
            if (submission.isVerificationCancelled?.()) {
              throw new Error('Verification cancelled')
            }
            await new Promise((r) => setTimeout(r, 1500))
            const statusRes = await api.deliveries.verificationStatus(deliveryId)
            progress?.({
              deliveryId,
              status: statusRes?.status || 'verifying',
              elapsedSeconds: Math.round((Date.now() - startedAt) / 1000),
            })
            if (statusRes?.report) {
              verifyRes = statusRes.report
            } else if (
              statusRes?.status === 'interrupted' ||
              statusRes?.status === 'failed' ||
              statusRes?.status === 'cancelled'
            ) {
              verifyRes = statusRes
              break
            }
          }
        }

        if (verifyRes?.status === 'cancelled' || submission.isVerificationCancelled?.()) {
          throw new Error('Verification cancelled')
        }

        if ((!verifyRes || verifyRes.status === 'queued') && deliveryId) {
          // Fallback to the synchronous AI verification endpoint if polling yielded nothing.
          verifyRes = await api.ai.verifyDelivery({
            contract_id: contractId,
            milestone_id: milestoneId,
            delivery_id: deliveryId,
          })
        }

        if (verifyRes) {

          const assessment: VerificationAssessment = {
            id: verifyRes.report_id || `assess-${Date.now()}`,
            submissionId: deliveryRes.id,
            overallScore: verifyRes.overall_score ?? 0,
            passed: Boolean(verifyRes.passed),
            criteriaResults: (verifyRes.criterion_evaluations || []).map((ce: any) => ({
              id: ce.criterion_id || `crit-${Date.now()}`,
              title: ce.title || 'Verified criterion',
              description: ce.explanation || '',
              status: ce.status || (ce.passed ? 'pass' : 'fail'),
              aiConfidence: typeof ce.confidence === 'number' ? ce.confidence : 0,
              evidenceMatchSnippet: ce.evidence_match_snippet || '',
            })),
            summaryAnalysis: verifyRes.summary_analysis || 'AI evaluation complete.',
            assessedAt: new Date().toISOString(),
            modelUsed: verifyRes.model_used ?? 'unknown',
            requiresHumanReview: Boolean(verifyRes.requires_human_review),
          }

          // Update local store
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id === contractId || c.code === contractId) {
                return {
                  ...c,
                  milestones: c.milestones.map((m) => {
                    if (m.id === milestoneId) {
                      return {
                        ...m,
                        status: assessment.passed
                          ? ('verified' as MilestoneStatus)
                          : (assessment.requiresHumanReview
                              ? ('submitted' as MilestoneStatus)
                              : ('revision_requested' as MilestoneStatus)),
                        paymentStatus: m.paymentStatus,
                        assessment,
                        submittedEvidence: {
                          repoUrl: submission.repoUrl,
                          liveUrl: submission.liveUrl,
                          description: submission.description,
                          fileAttachments: submission.fileAttachments,
                          submittedAt: new Date().toISOString(),
                        },
                      }
                    }
                    return m
                  }),
                }
              }
              return c
            }),
            isLoading: false,
          }))

          return assessment
        }
      } catch (err) {
        console.error('Backend verify delivery failed:', err)
        set({ isLoading: false })
        throw err
      }
    }

    if (!isUuid) {
      throw new Error('Verification requires a persisted backend contract.')
    }

    throw new Error('Backend did not return a verification assessment.')
  },

  requestRevision: async (contractId, milestoneId, notes) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)
    if (isUuid) {
      try {
        await api.deliveries.requestRevision(contractId, milestoneId, notes)
      } catch (err) {
        console.error('Backend requestRevision failed:', err)
        throw err
      }
    }

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
                  revisionNotes: notes,
                  revisionRequestedAt: new Date().toISOString(),
                }
              }
              return m
            }),
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: workspaceActor(state.activeRole),
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

  overrideReview: async (contractId, milestoneId, reason) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)
    if (isUuid) {
      await api.deliveries.overrideReview(contractId, milestoneId, reason)
    }

    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            milestones: c.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  status: 'verified' as MilestoneStatus,
                  paymentStatus: m.paymentStatus as PaymentStatus,
                }
              }
              return m
            }),
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: workspaceActor(state.activeRole),
                action: 'HUMAN_REVIEW_OVERRIDE',
                details: `Client manual approval override: "${reason}".`,
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
                return { ...m, status: 'in_progress' as MilestoneStatus }
              }
              return m
            }),
          }
        }
        return c
      }),
    }))
  },

  releasePayment: async (contractId, milestoneId) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)
    if (isUuid) {
      try {
        const result = await api.payments.releasePayout({ contract_id: contractId, milestone_id: milestoneId })
        await get().fetchContractById(contractId)
        return result
      } catch (err) {
        console.error('Backend release payout failed:', err)
        throw err
      }
    }

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
    return { status: 'success' }
  },

  reclaimMilestoneFunds: async (contractId, milestoneId, reason) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)
    if (isUuid) {
      await api.payments.refundStagedMilestone(contractId, milestoneId, reason)
    }

    set((state) => {
      const updated = state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          let reclaimedAmount = 0
          const updatedMilestones = c.milestones.map((m) => {
            if (m.id === milestoneId) {
              reclaimedAmount = m.amount
              return {
                ...m,
                status: 'pending' as const,
                paymentStatus: 'not_started' as const,
              }
            }
            return m
          })

          return {
            ...c,
            stagedAmount: Math.max(0, c.stagedAmount - reclaimedAmount),
            milestones: updatedMilestones,
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Client (Buyer Protection)',
                action: 'STAGED_FUNDS_RECLAIMED',
                details: `Milestone staged funds ($${reclaimedAmount} USD) reclaimed by client due to freelancer inactivity: ${reason || 'Unaddressed revision timeout.'}`,
              },
            ],
          }
        }
        return c
      })
      return { contracts: updated }
    })
  },

  manualVerify: async (contractId, milestoneId, rationale) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)
    if (isUuid) {
      await api.deliveries.overrideReview(contractId, milestoneId, rationale)
    }

    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === contractId || c.code === contractId) {
          return {
            ...c,
            milestones: c.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  status: 'verified' as MilestoneStatus,
                  paymentStatus: m.paymentStatus as PaymentStatus,
                }
              }
              return m
            }),
            auditLogs: [
              ...c.auditLogs,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: workspaceActor(state.activeRole),
                action: 'MANUAL_VERIFICATION',
                details: `Client manually verified milestone. Rationale: "${rationale}".`,
              },
            ],
          }
        }
        return c
      }),
    }))
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
