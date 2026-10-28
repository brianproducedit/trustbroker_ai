import { useAuthStore } from '@/hooks/useAuthStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  }

  const url = `${API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // If not a dev token, prompt sign out
    if (token && !token.startsWith('dev-user-')) {
      useAuthStore.getState().signOut()
    }
    throw new ApiError(401, 'Unauthorized or session expired')
  }

  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errJson = await response.json()
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson)
    } catch {
      // Keep statusText
    }
    throw new ApiError(response.status, errorDetail)
  }

  return response.json()
}

export const api = {
  // Health & Ping
  health: () => apiFetch<{
    status: string
    service?: string
    environment?: string
    database?: string
    database_type?: string
    server_host?: string
    timestamp?: string
  }>('/health'),
  ping: () => apiFetch<{ ping: string; server?: string; environment?: string }>('/health/ping'),

  // Contracts
  contracts: {
    list: (params?: { role?: string; status?: string; page?: number; per_page?: number }) => {
      const query = new URLSearchParams()
      if (params?.role) query.set('role', params.role)
      if (params?.status) query.set('status', params.status)
      if (params?.page) query.set('page', String(params.page))
      if (params?.per_page) query.set('per_page', String(params.per_page))
      const qs = query.toString() ? `?${query.toString()}` : ''
      return apiFetch<{ contracts: any[]; total: number }>(`/contracts${qs}`)
    },
    get: (id: string) => apiFetch<any>(`/contracts/${id}`),
    create: (data: {
      title: string
      description?: string
      category?: string
      freelancer_email?: string
      required_skills?: string[]
      currency?: string
      milestones: Array<{
        title: string
        description?: string
        amount: number
        currency?: string
        deadline?: string
        sort_order?: number
        acceptance_criteria?: Array<{
          title: string
          description?: string
          evidence_type?: string
        }>
      }>
    }) =>
      apiFetch<any>('/contracts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    publish: (id: string) =>
      apiFetch<any>(`/contracts/${id}/publish`, {
        method: 'POST',
      }),
    apply: (
      id: string,
      data: { cover_note?: string; proposed_start?: string; portfolio_snapshot?: any[] }
    ) =>
      apiFetch<any>(`/contracts/${id}/applications`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listApplications: (id: string) =>
      apiFetch<{ applications: any[]; total: number }>(`/contracts/${id}/applications`),
    update: (id: string, data: any) =>
      apiFetch<any>(`/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    accept: (id: string) =>
      apiFetch<any>(`/contracts/${id}/accept`, {
        method: 'POST',
      }),
    cancel: (id: string, reason?: string) => {
      const qs = reason ? `?reason=${encodeURIComponent(reason)}` : ''
      return apiFetch<any>(`/contracts/${id}/cancel${qs}`, {
        method: 'POST',
      })
    },
  },

  // AI Orchestration
  ai: {
    status: () => apiFetch<any>('/ai/status'),
    draftSOW: (data: {
      prompt: string
      category?: string
      total_budget: number
      currency?: string
    }) =>
      apiFetch<any>('/ai/draft-sow', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    clarify: (data: {
      prompt: string
      category?: string
      total_budget: number
      answers?: Array<{ question: string; answer: string }>
    }) =>
      apiFetch<{ questions: Array<{ id: string; question: string }>; provider_used?: string }>(
        '/ai/clarify',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    listings: (params?: {
      category?: string
      min_budget?: number
      max_budget?: number
      skill?: string
      page?: number
      per_page?: number
    }) => {
      const query = new URLSearchParams()
      if (params?.category) query.set('category', params.category)
      if (params?.min_budget != null) query.set('min_budget', String(params.min_budget))
      if (params?.max_budget != null) query.set('max_budget', String(params.max_budget))
      if (params?.skill) query.set('skill', params.skill)
      if (params?.page) query.set('page', String(params.page))
      if (params?.per_page) query.set('per_page', String(params.per_page))
      const qs = query.toString() ? `?${query.toString()}` : ''
      return apiFetch<{ listings: any[]; total: number }>(`/listings${qs}`)
    },
    vetApplication: (application_id: string) =>
      apiFetch<any>('/ai/vet-application', {
        method: 'POST',
        body: JSON.stringify({ application_id }),
      }),
    verifyDelivery: (data: {
      contract_id: string
      milestone_id: string
      delivery_id: string
    }) =>
      apiFetch<any>('/ai/verify-delivery', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Deliveries
  deliveries: {
    submit: (data: {
      contract_id: string
      milestone_id: string
      description: string
      repo_url?: string
      live_url?: string
      files?: any[]
      file_attachments?: any[]
      auto_verify?: boolean
    }) =>
      apiFetch<any>('/deliveries', {
        method: 'POST',
        body: JSON.stringify({
          contract_id: data.contract_id,
          milestone_id: data.milestone_id,
          description: data.description,
          repo_url: data.repo_url,
          live_url: data.live_url,
          files: data.files || data.file_attachments || [],
          auto_verify: data.auto_verify ?? true,
        }),
      }),
    get: (id: string) => apiFetch<any>(`/deliveries/${id}`),
    listMilestoneDeliveries: (milestoneId: string) =>
      apiFetch<any[]>(`/deliveries/milestone/${milestoneId}`),
    requestRevision: (contractId: string, milestoneId: string, notes?: string) =>
      apiFetch<any>(`/deliveries/${contractId}/${milestoneId}/request-revision`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes || '' }),
      }),
    overrideReview: (contractId: string, milestoneId: string, reason: string) =>
      apiFetch<any>(`/deliveries/${contractId}/${milestoneId}/override-review`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Payments & Escrow
  payments: {
    createOrder: (data: { contract_id: string; milestone_id: string }) =>
      apiFetch<any>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    captureOrder: (data: {
      contract_id: string
      milestone_id: string
      paypal_order_id: string
    }) =>
      apiFetch<any>('/payments/capture-order', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    releasePayout: (data: { contract_id: string; milestone_id: string }) =>
      apiFetch<any>('/payments/release', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getHistory: (contractId: string) =>
      apiFetch<any[]>(`/payments/history/${contractId}`),
    payouts: (contractId: string) =>
      apiFetch<any[]>(`/payments/payouts/${contractId}`),
    earnings: () => apiFetch<any[]>('/payments/earnings'),
  },

  listings: {
    list: (params?: {
      category?: string
      min_budget?: number
      max_budget?: number
      skill?: string
      page?: number
      per_page?: number
    }) => api.ai.listings(params),
    get: (id: string) => apiFetch<any>(`/listings/${id}`),
  },

  profiles: {
    me: () => apiFetch<any>('/profiles/me'),
    updateMe: (data: any) =>
      apiFetch<any>('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  applications: {
    mine: () => apiFetch<{ applications: any[]; total: number }>('/applications/mine'),
    award: (id: string) =>
      apiFetch<any>(`/applications/${id}/award`, { method: 'POST' }),
    shortlist: (id: string) =>
      apiFetch<any>(`/applications/${id}/shortlist`, { method: 'POST' }),
  },

  // Audit Logs
  audit: {
    getAuditTrail: (contractId: string) =>
      apiFetch<any[]>(`/audit/${contractId}`),
  },
}
