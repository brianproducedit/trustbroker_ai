import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { formatCurrency } from '@/lib/utils'
import { api } from '@/lib/api'
import { AgStudioProvider } from 'ag-studio-react'
import { AgGridReact } from 'ag-grid-react'
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from 'ag-grid-community'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  ShieldCheck,
  DollarSign,
  Briefcase,
  Clock,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Award,
} from 'lucide-react'
import { AICopilotFAB } from '@/components/operations/AICopilotFAB'

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule])

// Custom dark theme matching Ink/Emerald Freelancer palette
const freelancerStudioTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: '#0C1916',
  foregroundColor: '#F8FAFC',
  headerBackgroundColor: '#122622',
  headerTextColor: '#94A3B8',
  oddRowBackgroundColor: '#0E1F1B',
  borderColor: '#1C3831',
  accentColor: '#10B981',
  fontSize: 13,
})

export const FreelancerOperations: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { contracts, fetchContracts } = useContractStore()

  const [applications, setApplications] = useState<any[]>([])
  const [earnings, setEarnings] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'settled' | 'verifying'>('all')

  // Fetch telemetry on mount
  useEffect(() => {
    fetchContracts()
    const loadExtraData = async () => {
      try {
        const [appsRes, earningsRes] = await Promise.all([
          api.applications.mine().catch(() => ({ applications: [] })),
          api.payments.earnings().catch(() => []),
        ])
        setApplications(appsRes?.applications || [])
        setEarnings(Array.isArray(earningsRes) ? earningsRes : [])
      } catch (err) {
        console.warn('Telemetry load notice:', err)
      }
    }
    loadExtraData()
  }, [fetchContracts])

  // Calculated Metrics
  const metrics = useMemo(() => {
    // Total earned across contracts
    let totalEarned = contracts.reduce((sum, c) => sum + Number(c.releasedAmount || 0), 0)
    if (earnings.length > 0) {
      const pTotal = earnings.reduce((sum, e) => sum + Number(e.amount || 0), 0)
      if (pTotal > totalEarned) totalEarned = pTotal
    }

    const awardedCount = applications.filter((a) => a.status === 'awarded').length
    const winRate = applications.length > 0
      ? Math.round((awardedCount / applications.length) * 100)
      : (contracts.length > 0 ? 100 : 0)

    let upcomingCount = 0
    let verifiedCount = 0
    contracts.forEach((c) => {
      (c.milestones || []).forEach((m) => {
        if (m.status === 'in_progress' || m.status === 'pending') upcomingCount++
        if (m.status === 'verified' || m.status === 'settled') verifiedCount++
      })
    })

    return {
      totalEarned,
      applicationsCount: applications.length,
      winRate,
      upcomingCount,
      verifiedCount,
    }
  }, [contracts, applications, earnings])

  // Flatten milestones for high-density delivery & payout ledger
  const milestoneRows = useMemo(() => {
    const rows: any[] = []
    contracts.forEach((c) => {
      (c.milestones || []).forEach((m, idx) => {
        rows.push({
          id: m.id,
          contractId: c.id,
          contractCode: c.code,
          contractTitle: c.title,
          milestoneNumber: idx + 1,
          milestoneTitle: m.title,
          amount: m.amount,
          currency: m.currency || c.currency,
          deadline: m.deadline || 'TBD',
          status: m.status,
          paymentStatus: m.paymentStatus,
        })
      })
    })

    return rows.filter((r) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'in_progress') return r.status === 'in_progress' || r.status === 'pending'
      if (activeFilter === 'settled') return r.status === 'settled' || r.paymentStatus === 'released'
      if (activeFilter === 'verifying') return r.status === 'verifying' || r.status === 'submitted' || r.status === 'verified'
      return true
    })
  }, [contracts, activeFilter])

  // AG Grid Column Definitions
  const colDefs = useMemo<ColDef[]>(() => {
    return [
      {
        field: 'contractCode',
        headerName: 'Contract',
        width: 120,
        cellRenderer: (params: ICellRendererParams) => (
          <span className="font-mono font-semibold text-emerald-400 hover:underline cursor-pointer">
            {params.value}
          </span>
        ),
        onCellClicked: (params) => {
          if (params.data?.contractId) {
            navigate(`/app/freelancer/work/${params.data.contractId}/deliver`)
          }
        },
      },
      {
        field: 'milestoneTitle',
        headerName: 'Milestone Deliverable',
        flex: 2,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams) => (
          <div className="flex flex-col justify-center leading-tight py-1">
            <span className="font-medium text-slate-100 truncate">
              M{params.data.milestoneNumber}: {params.value}
            </span>
            <span className="text-[11px] text-slate-400 truncate">{params.data.contractTitle}</span>
          </div>
        ),
      },
      {
        field: 'amount',
        headerName: 'Payout Amount',
        width: 130,
        cellRenderer: (params: ICellRendererParams) => (
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {formatCurrency(params.value || 0, params.data.currency)}
          </span>
        ),
      },
      {
        field: 'deadline',
        headerName: 'Target Deadline',
        width: 130,
        cellRenderer: (params: ICellRendererParams) => (
          <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {params.value}
          </span>
        ),
      },
      {
        field: 'status',
        headerName: 'Inspection Status',
        width: 140,
        cellRenderer: (params: ICellRendererParams) => {
          const s = (params.value || '').toLowerCase()
          let color = 'border-slate-700 bg-slate-800/60 text-slate-300'
          if (s === 'settled') color = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          if (s === 'verified') color = 'border-blue-500/30 bg-blue-500/10 text-blue-400'
          if (s === 'in_progress') color = 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          if (s === 'verifying' || s === 'submitted') color = 'border-purple-500/30 bg-purple-500/10 text-purple-400'

          return (
            <Badge variant="outline" className={`text-[10px] uppercase font-mono px-2 py-0.5 ${color}`}>
              {s.replace('_', ' ')}
            </Badge>
          )
        },
      },
      {
        headerName: 'Action',
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 px-2 gap-1"
            onClick={() => {
              if (params.data?.contractId) {
                navigate(`/app/freelancer/work/${params.data.contractId}/deliver`)
              }
            }}
          >
            <span>Deliver</span>
            <ArrowUpRight className="w-3 h-3" />
          </Button>
        ),
      },
    ]
  }, [navigate])

  return (
    <AgStudioProvider>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C3831] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Freelancer Operations Studio
                </h1>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
                  AG Studio
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Real-time delivery milestones, PayPal Payouts tracking and AI-vetted opportunities for {user?.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchContracts()}
                className="border-[#1C3831] bg-[#0C1916] text-slate-300 hover:text-white hover:bg-[#122622] text-xs h-9 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Telemetry</span>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm"
              >
                <Link to="/app/freelancer/contracts">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Browse Open Marketplace</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Top KPI Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#1C3831] bg-[#0E1F1B] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Verified Payouts Earned
                  </span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                    {formatCurrency(metrics.totalEarned, 'USD')}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Disbursed directly via PayPal Payouts
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#1C3831] bg-[#0E1F1B] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Award Win Rate
                  </span>
                  <div className="text-2xl font-bold font-mono text-blue-400 mt-0.5">
                    {metrics.winRate}%
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {metrics.applicationsCount} proposal(s) vetted by AI
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#1C3831] bg-[#0E1F1B] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Upcoming Deliverables
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                    {metrics.upcomingCount}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Milestones currently in development
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#1C3831] bg-[#0E1F1B] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Completed Milestones
                  </span>
                  <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">
                    {metrics.verifiedCount}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Verified through automated AI checks
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full-Width AG Grid Dense Telemetry Ledger */}
          <Card className="border-[#1C3831] bg-[#0E1F1B] text-white shadow-sm flex flex-col h-[600px]">
            <CardHeader className="p-4 border-b border-[#1C3831] bg-[#0C1916]/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Milestone Deliverables & Payouts Ledger
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    High-density AG Grid ledger showing delivery verification stages, client counterparties and target deadlines.
                  </CardDescription>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-[#0C1916] p-1 rounded-lg border border-[#1C3831]">
                  {(['all', 'in_progress', 'verifying', 'settled'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${activeFilter === filter
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {filter.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            {/* AG Grid Container */}
            <div className="flex-1 w-full overflow-hidden p-2">
              <div className="w-full h-full rounded-lg overflow-hidden border border-[#1C3831]">
                <AgGridReact
                  theme={freelancerStudioTheme}
                  rowData={milestoneRows}
                  columnDefs={colDefs}
                  pagination={true}
                  paginationPageSize={12}
                  paginationPageSizeSelector={[12, 25, 50]}
                  rowHeight={48}
                  headerHeight={38}
                  suppressCellFocus={true}
                  animateRows={true}
                />
              </div>
            </div>
          </Card>

          {/* Floating AI Operations Copilot */}
          <AICopilotFAB
            workspace="freelancer"
            promptStarters={[
              'Which applicants are new talent with strong portfolios?',
              'Show my upcoming milestone deadlines',
              'How much have I earned this month via PayPal?',
            ]}
          />
        </div>
      </DashboardLayout>
    </AgStudioProvider>
  )
}

export default FreelancerOperations
