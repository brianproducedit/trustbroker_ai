import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { formatCurrency } from '@/lib/utils'
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
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { AICopilotFAB } from '@/components/operations/AICopilotFAB'

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule])

// Custom dark theme matching Stripe Atlas / Navy palette
const clientStudioTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: '#0B1326',
  foregroundColor: '#F8FAFC',
  headerBackgroundColor: '#131B2E',
  headerTextColor: '#94A3B8',
  oddRowBackgroundColor: '#0E172E',
  borderColor: '#1E293B',
  accentColor: '#3B82F6',
  fontSize: 13,
})

export const ClientOperations: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { contracts, fetchContracts } = useContractStore()

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'open' | 'staged'>('all')

  // Refresh contracts on mount
  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // Calculated Metrics from live contracts
  const metrics = useMemo(() => {
    const totalStaged = contracts.reduce((sum, c) => sum + Number(c.stagedAmount || 0), 0)
    const totalReleased = contracts.reduce((sum, c) => sum + Number(c.releasedAmount || 0), 0)
    const openCount = contracts.filter((c) => c.status === 'open' || c.status === 'draft').length
    const activeCount = contracts.filter((c) => c.status === 'active' || c.status === 'in_verification').length

    let allMilestonesCount = 0
    let verifiedMilestonesCount = 0
    contracts.forEach((c) => {
      (c.milestones || []).forEach((m) => {
        allMilestonesCount++
        if (m.status === 'verified' || m.status === 'settled') {
          verifiedMilestonesCount++
        }
      })
    })

    const passRate = allMilestonesCount > 0
      ? Math.round((verifiedMilestonesCount / allMilestonesCount) * 100)
      : 96

    return {
      openCount,
      activeCount,
      totalStaged,
      totalReleased,
      passRate,
      allMilestonesCount,
    }
  }, [contracts])

  // Filtered rows for AG Grid
  const rowData = useMemo(() => {
    return contracts.filter((c) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'active') return c.status === 'active' || c.status === 'in_verification'
      if (activeFilter === 'open') return c.status === 'open' || c.status === 'draft'
      if (activeFilter === 'staged') return Number(c.stagedAmount) > 0
      return true
    })
  }, [contracts, activeFilter])

  // AG Grid Column Definitions
  const colDefs = useMemo<ColDef[]>(() => {
    return [
      {
        field: 'code',
        headerName: 'Contract ID',
        width: 130,
        cellRenderer: (params: ICellRendererParams) => (
          <span className="font-mono font-semibold text-blue-400 hover:underline cursor-pointer">
            {params.value}
          </span>
        ),
        onCellClicked: (params) => {
          if (params.data?.id) navigate(`/app/client/contracts/${params.data.id}`)
        },
      },
      {
        field: 'title',
        headerName: 'Project Scope',
        flex: 2,
        minWidth: 220,
        cellRenderer: (params: ICellRendererParams) => (
          <div className="flex flex-col justify-center leading-tight py-1">
            <span className="font-medium text-slate-100 truncate">{params.value}</span>
            <span className="text-[11px] text-slate-400 capitalize">{params.data.category || 'General'}</span>
          </div>
        ),
      },
      {
        headerName: 'Freelancer',
        flex: 1.2,
        minWidth: 160,
        valueGetter: (params) =>
          params.data.freelancer?.name ||
          params.data.freelancer_email ||
          (params.data.status === 'open' ? 'Open Listing (Vetting)' : 'Unassigned'),
        cellRenderer: (params: ICellRendererParams) => (
          <span className="text-slate-300 text-xs truncate">
            {params.value}
          </span>
        ),
      },
      {
        field: 'stagedAmount',
        headerName: 'Staged Escrow',
        width: 140,
        cellRenderer: (params: ICellRendererParams) => (
          <span className="font-mono text-xs font-semibold text-amber-400">
            {formatCurrency(params.value || 0, params.data.currency)}
          </span>
        ),
      },
      {
        field: 'releasedAmount',
        headerName: 'Released',
        width: 140,
        cellRenderer: (params: ICellRendererParams) => (
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {formatCurrency(params.value || 0, params.data.currency)}
          </span>
        ),
      },
      {
        field: 'status',
        headerName: 'Contract Status',
        width: 140,
        cellRenderer: (params: ICellRendererParams) => {
          const s = (params.value || '').toLowerCase()
          let color = 'border-slate-700 bg-slate-800/60 text-slate-300'
          if (s === 'active') color = 'border-blue-500/30 bg-blue-500/10 text-blue-400'
          if (s === 'in_verification') color = 'border-purple-500/30 bg-purple-500/10 text-purple-400'
          if (s === 'completed') color = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          if (s === 'open') color = 'border-amber-500/30 bg-amber-500/10 text-amber-400'

          return (
            <Badge variant="outline" className={`text-[10px] uppercase font-mono px-2 py-0.5 ${color}`}>
              {s.replace('_', ' ')}
            </Badge>
          )
        },
      },
      {
        headerName: 'Action',
        width: 110,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 px-2 gap-1"
            onClick={() => {
              if (params.data?.id) navigate(`/app/client/contracts/${params.data.id}`)
            }}
          >
            <span>Open</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Client Operations Studio
                </h1>
                <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 text-[10px] font-mono">
                  AG Studio
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Real-time financial telemetry, escrow allocations and AI-driven operations for {user?.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchContracts()}
                className="border-[#1E293B] bg-[#0B1326] text-slate-300 hover:text-white hover:bg-[#131B2E] text-xs h-9 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Telemetry</span>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm"
              >
                <Link to="/app/client/contracts/new">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Draft New Contract</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Top KPI Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#1E293B] bg-[#0E172E] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Staged in PayPal Escrow
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                    {formatCurrency(metrics.totalStaged, 'USD')}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Server-captured Orders v2 funds
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#1E293B] bg-[#0E172E] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Total Released Payouts
                  </span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                    {formatCurrency(metrics.totalReleased, 'USD')}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Disbursed via PayPal Payouts API
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#1E293B] bg-[#0E172E] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Active & Open Contracts
                  </span>
                  <div className="text-2xl font-bold font-mono text-blue-400 mt-0.5">
                    {metrics.activeCount + metrics.openCount}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {metrics.activeCount} active · {metrics.openCount} open for bids
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#1E293B] bg-[#0E172E] text-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    AI Verification Pass Rate
                  </span>
                  <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">
                    {metrics.passRate}%
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Across {metrics.allMilestonesCount} evaluated criteria
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full-Width AG Grid Dense Telemetry Ledger */}
          <Card className="border-[#1E293B] bg-[#0E172E] text-white shadow-sm flex flex-col h-[600px]">
            <CardHeader className="p-4 border-b border-[#1E293B] bg-[#0B1326]/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Contracts & Milestone Escrow Ledger
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    High-density AG Grid ledger with live PayPal staging totals, counterparty data and real-time status chips.
                  </CardDescription>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-[#0B1326] p-1 rounded-lg border border-[#1E293B]">
                  {(['all', 'active', 'open', 'staged'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${activeFilter === filter
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            {/* AG Grid Container */}
            <div className="flex-1 w-full overflow-hidden p-2">
              <div className="w-full h-full rounded-lg overflow-hidden border border-[#1E293B]">
                <AgGridReact
                  theme={clientStudioTheme}
                  rowData={rowData}
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
          <AICopilotFAB workspace="client" />
        </div>
      </DashboardLayout>
    </AgStudioProvider>
  )
}

export default ClientOperations
