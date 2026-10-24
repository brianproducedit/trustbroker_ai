import React, { useState, useMemo, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ROUTES } from '@/constants'
import { useNavigate } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz, colorSchemeDark } from 'ag-grid-community'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  ArrowUpRight, 
  Plus, 
  Filter, 
  Clock, 
  ExternalLink, 
  UploadCloud, 
  Briefcase,
  Inbox
} from 'lucide-react'
import { toast } from 'sonner'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Custom dark theme for TrustBroker AI ledger matching #0B1326 / #0E1528
const darkLedgerTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: '#0E1528',
  foregroundColor: '#F8FAFC',
  headerBackgroundColor: '#090E1A',
  headerTextColor: '#94A3B8',
  borderColor: '#222A3D',
  oddRowBackgroundColor: '#0E1528',
  rowHoverColor: '#172036',
  selectedRowBackgroundColor: '#1A2645',
  wrapperBackgroundColor: '#0E1528',
  dataBackgroundColor: '#0E1528',
  fontFamily: "'Lexend', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: 12,
})

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { contracts, activeRole, toggleActiveRole, getRoleContracts, getRoleMetrics, releasePayment, fetchContracts } = useContractStore()

  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_action' | 'in_verification' | 'settled'>('all')
  const [selectedContractId, setSelectedContractId] = useState<string>('contract-1')
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [pendingReleaseMilestone, setPendingReleaseMilestone] = useState<{ id: string; amount: number; title: string } | null>(null)

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts, activeRole])

  const roleContracts = useMemo(() => {
    return getRoleContracts()
  }, [getRoleContracts])

  const roleMetrics = useMemo(() => {
    return getRoleMetrics()
  }, [getRoleMetrics])

  const selectedContract = useMemo(() => {
    return contracts.find((c) => c.id === selectedContractId) || roleContracts[0] || contracts[0]
  }, [contracts, roleContracts, selectedContractId])

  const filteredContracts = useMemo(() => {
    if (activeFilter === 'needs_action') {
      return roleContracts.filter((c) => c.status === 'in_verification' || c.status === 'pending_acceptance')
    }
    if (activeFilter === 'in_verification') {
      return roleContracts.filter((c) => c.status === 'in_verification')
    }
    if (activeFilter === 'settled') {
      return roleContracts.filter((c) => c.status === 'completed' || c.releasedAmount > 0)
    }
    return roleContracts
  }, [roleContracts, activeFilter])

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Contract',
      field: 'code',
      width: 140,
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
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex flex-col justify-center h-full">
          <span className="text-xs font-semibold text-white truncate">{params.data.title}</span>
          <span className="text-[10px] text-slate-400 truncate">{params.data.description}</span>
        </div>
      ),
    },
    {
      headerName: activeRole === 'client' ? 'Freelancer' : 'Client',
      field: activeRole === 'client' ? 'freelancer.name' : 'client.name',
      width: 170,
      cellRenderer: (params: ICellRendererParams) => {
        const party = activeRole === 'client' 
          ? (params.data.freelancer || params.data.supplier) 
          : (params.data.client || params.data.buyer)
        return (
          <div className="flex flex-col justify-center h-full text-xs">
            <span className="text-slate-200 font-medium truncate">{party?.name}</span>
            <span className="text-[10px] text-slate-400 truncate">{party?.organization || 'Independent'}</span>
          </div>
        )
      },
    },
    {
      headerName: 'Payment Staged',
      field: 'stagedAmount',
      width: 150,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex flex-col justify-center h-full">
          <span className="font-mono text-xs text-emerald-400 font-semibold">
            {formatCurrency(params.value, params.data.currency)}
          </span>
          <span className="text-[10px] text-slate-400">
            {params.data.releasedAmount > 0 
              ? `${formatCurrency(params.data.releasedAmount)} released` 
              : activeRole === 'client' ? 'Staged in Sandbox' : 'Funds Staged'}
          </span>
        </div>
      ),
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 150,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value} size="sm" />
        </div>
      ),
    },
    {
      headerName: 'Action',
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <button
            onClick={() => navigate(ROUTES.CONTRACT_DETAIL(params.data.id))}
            className="px-2.5 py-1 text-xs bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Open</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ], [navigate, activeRole])

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

  const activeMilestone = selectedContract?.milestones?.find((m) => m.status === 'verifying' || m.status === 'submitted') || selectedContract?.milestones?.[0]

  const handleRelease = (milestoneId: string, amount: number) => {
    releasePayment(selectedContract.id, milestoneId)
    toast.success(`Payment released: ${formatCurrency(amount)} USD to freelancer!`)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeRole === 'client' ? 'Your Contracts & Procurements' : 'Your Projects & Deliverables'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeRole === 'client'
                ? 'Stage funds in PayPal Sandbox, monitor active milestones, and authorize payouts upon verified delivery.'
                : 'Review contracted milestones, submit deliverable evidence for verification, and receive disbursements.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeRole === 'client' ? (
              <Button
                onClick={() => navigate(ROUTES.NEW_PROJECT)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Button>
            ) : (
              <Button
                onClick={() => navigate(ROUTES.DELIVERY_VERIFICATION(selectedContract?.id || 'contract-1'))}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Submit Work</span>
              </Button>
            )}
          </div>
        </div>

        {/* 4 Multi-Dimensional Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  {activeRole === 'client' ? 'Active Contracts' : 'Active Projects'}
                </span>
                <Briefcase className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-white">{roleMetrics.activeCount}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeRole === 'client' ? 'Active freelancer contracts' : 'Active client engagements'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metric 2 */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Staged Payments
                </span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrency(roleMetrics.escrowAmount)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeRole === 'client' ? 'Staged in PayPal Sandbox' : 'Guaranteed by client'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metric 3 */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Pending Actions
                </span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-indigo-300">
                  {roleMetrics.pendingCount} Milestones
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Awaiting review or delivery</div>
              </div>
            </CardContent>
          </Card>

          {/* Metric 4 */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Released Payments
                </span>
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-teal-300">
                  {formatCurrency(roleMetrics.settledAmount)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Disbursed via PayPal</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between border-b border-[#222A3D] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All Contracts' },
                { id: 'needs_action', label: 'Needs Action' },
                { id: 'in_verification', label: 'In Review' },
                { id: 'settled', label: 'Completed & Released' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                    activeFilter === tab.id
                      ? activeRole === 'client' ? 'bg-blue-600 text-white font-medium shadow-xs' : 'bg-emerald-600 text-white font-medium shadow-xs'
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

        {/* Main Grid & Contract Details Section */}
        {roleContracts.length === 0 ? (
          <div className="bg-[#131B2E] rounded-xl border border-[#222A3D] p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#172038] border border-blue-900/40 flex items-center justify-center text-blue-400">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-bold text-white">No contracts found in this workspace</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeRole === 'client'
                  ? "You haven't created any contracts yet. Draft an AI-assisted scope and stage milestone payments in PayPal Sandbox."
                  : "You haven't been assigned to any contracts yet. Switch to Client mode to create a project or check back later."}
              </p>
            </div>
            {activeRole === 'client' ? (
              <Button onClick={() => navigate(ROUTES.NEW_PROJECT)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9">
                <Plus className="w-4 h-4" />
                <span>Create Your First Project</span>
              </Button>
            ) : (
              <Button onClick={() => toggleActiveRole()} variant="outline" className="border-[#2D3449] bg-[#171F33] text-slate-200 text-xs h-9">
                Switch to Client Mode
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): AG Grid Ledger */}
            <div className="lg:col-span-8 bg-[#131B2E] rounded-xl border border-[#222A3D] p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Contracts Ledger</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Click row to inspect details
                </span>
              </div>

              {/* AG Grid Container */}
              {filteredContracts.length === 0 ? (
                <div className="w-full rounded-lg border border-[#222A3D] bg-[#0E1528] py-16 flex flex-col items-center justify-center gap-3 text-center">
                  <Inbox className="w-8 h-8 text-slate-500" />
                  <p className="text-xs text-slate-400">No contracts match this filter category.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveFilter('all')}
                    className="border-[#2D3449] bg-[#171F33] text-slate-300 text-xs"
                  >
                    View All Contracts
                  </Button>
                </div>
              ) : (
                <div
                  className="w-full rounded-lg overflow-hidden border border-[#222A3D] bg-[#0E1528]"
                  style={{ minHeight: '260px', height: '360px', width: '100%', backgroundColor: '#0E1528' }}
                >
                  <AgGridReact
                    theme={darkLedgerTheme}
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
              )}
            </div>

            {/* Right Column (4 cols): Selected Contract Overview Panel */}
            <div className="lg:col-span-4 bg-[#131B2E] rounded-xl border border-[#222A3D] p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
                    Contract Overview
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-blue-400 font-semibold">
                  {selectedContract?.code}
                </span>
              </div>

              {/* Selected Contract Info */}
              <div className="space-y-1.5">
                <span className="text-sm font-bold text-white leading-tight block">
                  {selectedContract?.title}
                </span>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Staged Budget:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatCurrency(selectedContract?.stagedAmount || 0, selectedContract?.currency)}
                  </span>
                </div>
              </div>

              {/* AI Verification Score Bar */}
              <div className="bg-[#171F33] p-3.5 rounded-xl border border-[#222A3D] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Delivery Status</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {activeMilestone?.assessment?.overallScore ? `${activeMilestone.assessment.overallScore}% Passed` : 'Ready for Review'}
                  </span>
                </div>
                <Progress value={activeMilestone?.assessment?.overallScore || 94} className="h-2" />
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Milestones &amp; Payouts
                </span>
                <div className="space-y-2">
                  {selectedContract?.milestones?.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg bg-[#0E1528] border border-[#222A3D] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {m.status === 'settled' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : m.status === 'verifying' ? (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className="text-slate-200 font-medium truncate">{m.title}</span>
                      </div>
                      <span className="font-mono text-emerald-400 text-[11px] font-semibold shrink-0">
                        {formatCurrency(m.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons tailored to role */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#222A3D]">
                {activeRole === 'client' ? (
                  <>
                    {activeMilestone && activeMilestone.status === 'verified' && activeMilestone.paymentStatus !== 'released' && (
                      <Button
                        onClick={() => {
                          setPendingReleaseMilestone({
                            id: activeMilestone.id,
                            amount: activeMilestone.amount,
                            title: activeMilestone.title
                          })
                          setReleaseDialogOpen(true)
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Release Milestone Payment (${activeMilestone.amount})</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => navigate(ROUTES.CONTRACT_DETAIL(selectedContract?.id || 'contract-1'))}
                      className="w-full border-[#2D3449] bg-[#171F33] hover:bg-[#222A3D] text-slate-200 text-xs gap-1.5 h-9"
                    >
                      <span>View Contract Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate(ROUTES.DELIVERY_VERIFICATION(selectedContract?.id || 'contract-1'))}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Submit Work for Verification</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(ROUTES.CONTRACT_DETAIL(selectedContract?.id || 'contract-1'))}
                      className="w-full border-[#2D3449] bg-[#171F33] hover:bg-[#222A3D] text-slate-200 text-xs gap-1.5 h-9"
                    >
                      <span>Review Acceptance Terms</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Recent Activity Stream */}
        <Card className="border-[#222A3D] bg-[#131B2E] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#222A3D]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Recent Contract Activity
              </CardTitle>
            </div>
            <button
              onClick={() => navigate(ROUTES.ACTIVITY_HISTORY(selectedContract?.id || 'contract-1'))}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Audit Log</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </CardHeader>

          <CardContent className="p-4 space-y-2">
            {selectedContract?.auditLogs?.slice(0, 4).map((log) => (
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
          </CardContent>
        </Card>

        {/* Payment Release Confirmation Dialog */}
        <AlertDialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
          <AlertDialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Authorize Payment Release</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 text-xs">
                Are you sure you want to release {pendingReleaseMilestone ? formatCurrency(pendingReleaseMilestone.amount) : '$0'} USD to {selectedContract?.freelancer?.name || (selectedContract as any)?.supplier?.name || 'the freelancer'}?
                This will disburse the staged funds from PayPal Sandbox for milestone "{pendingReleaseMilestone?.title}". This action is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="border-[#2D3449] bg-[#0E1528] text-slate-300 hover:bg-[#171F33] text-xs">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingReleaseMilestone) {
                    handleRelease(pendingReleaseMilestone.id, pendingReleaseMilestone.amount)
                    setReleaseDialogOpen(false)
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Confirm &amp; Disburse Funds
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
