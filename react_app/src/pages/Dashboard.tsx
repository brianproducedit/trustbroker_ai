import React, { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ROUTES } from '@/constants'
import { useNavigate } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight, 
  Plus, 
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { contracts, activeRole, releasePayment } = useContractStore()

  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_action' | 'in_verification' | 'settled'>('all')
  const [selectedContractId, setSelectedContractId] = useState<string>('contract-1')

  const selectedContract = useMemo(() => {
    return contracts.find((c) => c.id === selectedContractId) || contracts[0]
  }, [contracts, selectedContractId])

  const totalReserved = useMemo(() => {
    return contracts.reduce((acc, c) => acc + c.stagedAmount, 0)
  }, [contracts])

  const filteredContracts = useMemo(() => {
    if (activeFilter === 'needs_action') {
      return contracts.filter((c) => c.status === 'in_verification' || c.status === 'pending_acceptance')
    }
    if (activeFilter === 'in_verification') {
      return contracts.filter((c) => c.status === 'in_verification')
    }
    if (activeFilter === 'settled') {
      return contracts.filter((c) => c.status === 'completed' || c.releasedAmount > 0)
    }
    return contracts
  }, [contracts, activeFilter])

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Contract Code',
      field: 'code',
      width: 150,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center gap-2 h-full font-mono text-xs text-blue-400 font-semibold">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>{params.value}</span>
        </div>
      ),
    },
    {
      headerName: 'Project Title',
      field: 'title',
      flex: 1,
      minWidth: 220,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex flex-col justify-center h-full">
          <span className="text-xs font-semibold text-white truncate">{params.data.title}</span>
          <span className="text-[10px] text-slate-400 truncate">{params.data.description}</span>
        </div>
      ),
    },
    {
      headerName: 'Counterparty',
      field: 'supplier.name',
      width: 170,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex flex-col justify-center h-full text-xs">
          <span className="text-slate-200 font-medium truncate">{params.data.supplier?.name}</span>
          <span className="text-[10px] text-slate-400 truncate">{params.data.supplier?.organization || 'Independent'}</span>
        </div>
      ),
    },
    {
      headerName: 'Sandbox Reserve',
      field: 'stagedAmount',
      width: 150,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex flex-col justify-center h-full">
          <span className="font-mono text-xs text-emerald-400 font-semibold">
            {formatCurrency(params.value, params.data.currency)}
          </span>
          <span className="text-[10px] text-slate-400">
            {params.data.releasedAmount > 0 ? `${formatCurrency(params.data.releasedAmount)} released` : 'Staged'}
          </span>
        </div>
      ),
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 160,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value} size="sm" />
        </div>
      ),
    },
    {
      headerName: 'Actions',
      width: 110,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <button
            onClick={() => navigate(ROUTES.CONTRACT_DETAIL(params.data.id))}
            className="px-2.5 py-1 text-xs bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded transition-colors inline-flex items-center gap-1 font-medium"
          >
            <span>Review</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ], [navigate])

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), [])

  const handleRowClick = (event: any) => {
    if (event.data?.id) {
      setSelectedContractId(event.data.id)
    }
  }

  // Active milestone under review
  const activeMilestone = selectedContract?.milestones?.find((m) => m.status === 'verifying' || m.status === 'submitted') || selectedContract?.milestones?.[0]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <span className="uppercase tracking-wider">Protocol Ledger v4.2</span>
              <span>•</span>
              <span className="text-slate-400">Contract Execution Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Contracts &amp; Deliverables Ledger
            </h1>
            <p className="text-xs text-slate-400">
              Real-time coordination of conditional milestones, contract versions, and sandbox payment reserves.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.NEW_PROJECT)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Project Brief</span>
            </button>
          </div>
        </div>

        {/* 4 Multi-Dimensional Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="bg-[#131B2E] p-4 rounded-xl border border-[#222A3D] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Active Contracts
              </span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-white">{contracts.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across 4 counterparties</div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-[#131B2E] p-4 rounded-xl border border-[#222A3D] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Sandbox Reserved
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(totalReserved)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">PayPal Sandbox Staged</div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-[#131B2E] p-4 rounded-xl border border-[#222A3D] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Milestones In Gate
              </span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-indigo-300">2 In Review</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Gemini 1.5 Pro verification</div>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-[#131B2E] p-4 rounded-xl border border-[#222A3D] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Verified Events
              </span>
              <CheckCircle className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-teal-300">28 Logged</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tamper-proof audit logs</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between border-b border-[#222A3D] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All Contracts' },
                { id: 'needs_action', label: 'Needs Action' },
                { id: 'in_verification', label: 'In Verification' },
                { id: 'settled', label: 'Settled & Released' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeFilter === tab.id
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-[#171F33]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Main Grid & Inspection Bay Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): AG Grid Community Ledger */}
          <div className="lg:col-span-8 bg-[#131B2E] rounded-xl border border-[#222A3D] p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Live Transaction Grid</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Click any row to inspect in right panel
              </span>
            </div>

            {/* AG Grid Container */}
            <div
              className="ag-theme-quartz-dark w-full rounded-lg overflow-hidden border border-[#222A3D]"
              style={{ height: '360px', width: '100%' }}
            >
              <AgGridReact
                rowData={filteredContracts}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection="single"
                onRowClicked={handleRowClick}
                headerHeight={40}
                rowHeight={52}
                animateRows={true}
              />
            </div>
          </div>

          {/* Right Column (4 cols): Inspection Bay Panel */}
          <div className="lg:col-span-4 bg-[#131B2E] rounded-xl border border-[#222A3D] p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
                  Inspection Bay
                </h3>
              </div>
              <span className="font-mono text-[11px] text-blue-400 font-semibold">
                {selectedContract.code}
              </span>
            </div>

            {/* Selected Contract Header */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-white leading-tight">
                {selectedContract.title}
              </span>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Sandbox Reserve:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatCurrency(selectedContract.stagedAmount, selectedContract.currency)}
                </span>
              </div>
            </div>

            {/* Circular Verification Ring */}
            <div className="bg-[#171F33] p-4 rounded-xl border border-[#222A3D] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  AI Validation Score
                </span>
                <span className="text-xs font-semibold text-white">
                  Gemini 1.5 Pro Gate
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {activeMilestone?.assessment?.overallScore ? 'Passing Threshold (90+)' : 'Verification Ready'}
                </span>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500"
                    strokeDasharray="94, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-white">
                  {activeMilestone?.assessment?.overallScore || 94}%
                </span>
              </div>
            </div>

            {/* Verification Milestones Checklist */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Milestones &amp; Release Criteria
              </span>
              <div className="flex flex-col gap-2">
                {selectedContract.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-lg bg-[#0E1528] border border-[#222A3D] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {m.status === 'settled' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : m.status === 'verifying' ? (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 animate-pulse" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      )}
                      <span className="text-slate-200 font-medium truncate">{m.title}</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[11px] font-semibold flex-shrink-0">
                      {formatCurrency(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#222A3D]">
              {activeMilestone && activeMilestone.status === 'verifying' && activeRole === 'buyer' && (
                <button
                  type="button"
                  onClick={() => releasePayment(selectedContract.id, activeMilestone.id)}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-900/30"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize Milestone Settlement ({formatCurrency(activeMilestone.amount)})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(ROUTES.DELIVERY_VERIFICATION(selectedContract.id))}
                className="w-full py-2 px-3 rounded-lg bg-[#171F33] hover:bg-[#222A3D] text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-[#2D3449] transition-colors"
              >
                <span>Inspect Evidence Artifacts</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Ledger Execution Stream (Audit Feed) */}
        <div className="bg-[#131B2E] rounded-xl border border-[#222A3D] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#222A3D] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Ledger Execution Stream &bull; Live Audit Events
              </h3>
            </div>
            <button
              onClick={() => navigate(ROUTES.ACTIVITY_HISTORY(selectedContract.id))}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1"
            >
              <span>View Full Audit Log</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {selectedContract.auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-[#0E1528] border border-[#222A3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/40">
                    {log.action}
                  </span>
                  <span className="text-slate-200">{log.details}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>{log.actor}</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
