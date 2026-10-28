import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { AgGridReact } from 'ag-grid-react'
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from 'ag-grid-community'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContractOverviewDialog } from '@/components/dialogs/ContractOverviewDialog'
import { FileText, PlusCircle, ListFilter } from 'lucide-react'

// Register AG Grid modules once
ModuleRegistry.registerModules([AllCommunityModule])

// Dark theme matching the project palette
const contractsTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: '#0B1120',
  foregroundColor: '#F8FAFC',
  headerBackgroundColor: '#131B2E',
  headerTextColor: '#94A3B8',
  oddRowBackgroundColor: '#0E1528',
  borderColor: '#222A3D',
  accentColor: '#3B82F6',
  fontSize: 13,
})

type FilterKey = 'all' | 'draft' | 'open' | 'active' | 'completed'

const FILTER_OPTIONS: { label: string; value: FilterKey }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Open', value: 'open' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
]

const StatusCell = (params: ICellRendererParams) => {
  const colors: Record<string, string> = {
    draft: 'bg-slate-700 text-slate-300',
    open: 'bg-indigo-900/60 text-indigo-300',
    awarded: 'bg-amber-900/60 text-amber-300',
    active: 'bg-blue-900/60 text-blue-300',
    in_verification: 'bg-purple-900/60 text-purple-300',
    completed: 'bg-emerald-900/60 text-emerald-300',
    cancelled: 'bg-red-900/60 text-red-300',
  }
  const cls = colors[params.value] || 'bg-slate-700 text-slate-300'
  const labels: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    awarded: 'Awarded',
    active: 'Active',
    in_verification: 'In Review',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {labels[params.value] || params.value}
    </span>
  )
}

export const ClientContracts: React.FC = () => {
  const navigate = useNavigate()
  const { contracts, fetchContracts, isLoading } = useContractStore()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const rowData = useMemo(() => {
    if (activeFilter === 'all') return contracts
    if (activeFilter === 'active') {
      return contracts.filter((c) => c.status === 'active' || c.status === 'in_verification')
    }
    return contracts.filter((c) => c.status === activeFilter)
  }, [contracts, activeFilter])

  const onRowClicked = (event: any) => {
    setSelectedContract(event.data)
    setDialogOpen(true)
  }

  const colDefs = useMemo<ColDef[]>(() => [
    {
      field: 'code',
      headerName: 'Code',
      width: 130,
      cellRenderer: (params: ICellRendererParams) => (
        <span className="font-mono font-semibold text-blue-400 cursor-pointer hover:underline">
          {params.value}
        </span>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex flex-col justify-center leading-tight py-1">
          <span className="font-medium text-slate-100 truncate">{params.value}</span>
        </div>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 140,
      cellRenderer: (params: ICellRendererParams) => (
        <span className="text-slate-300 text-xs capitalize">{params.value || 'General'}</span>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      cellRenderer: StatusCell,
    },
    {
      field: 'budget',
      headerName: 'Budget',
      width: 140,
      cellRenderer: (params: ICellRendererParams) => (
        <span className="font-mono text-xs font-semibold text-white">
          {formatCurrency(Number(params.value) || 0, params.data?.currency)}
        </span>
      ),
    },
    {
      headerName: 'Milestones',
      width: 110,
      valueGetter: (params) => (params.data?.milestones || []).length,
      cellRenderer: (params: ICellRendererParams) => (
        <span className="text-slate-400 text-xs">{params.value}</span>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 120,
      cellRenderer: (params: ICellRendererParams) => (
        <span className="text-slate-400 text-xs">
          {params.value ? new Date(params.value).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      headerName: 'Actions',
      width: 110,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 px-2 gap-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            if (params.data?.id) navigate(ROUTES.CONTRACT_DETAIL(params.data.id))
          }}
        >
          Open →
        </Button>
      ),
    },
  ], [navigate])

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222A3D] pb-5">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">My Contracts</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage, track, and review all your contracts
              </p>
            </div>
          </div>

          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9 font-medium shadow-sm self-start sm:self-auto"
          >
            <Link to={ROUTES.NEW_PROJECT}>
              <PlusCircle className="w-3.5 h-3.5" />
              Create Contract
            </Link>
          </Button>
        </div>

        {/* Contracts Table Card */}
        <Card className="border-[#222A3D] bg-[#0E1528] text-white shadow-sm">
          <CardHeader className="p-4 border-b border-[#222A3D] bg-[#0B1120]/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                  <ListFilter className="w-4 h-4 text-blue-400" />
                  Contracts Ledger
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Click any row to view contract details
                </CardDescription>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#0B1120] p-1 rounded-lg border border-[#222A3D]">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActiveFilter(opt.value)}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${
                      activeFilter === opt.value
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <span className="text-xs text-slate-400 animate-pulse">Loading contracts…</span>
              </div>
            ) : (
              <div className="w-full rounded-lg overflow-hidden border border-[#222A3D]">
                <AgGridReact
                  theme={contractsTheme}
                  rowData={rowData}
                  columnDefs={colDefs}
                  domLayout="autoHeight"
                  pagination={true}
                  paginationPageSize={10}
                  paginationPageSizeSelector={[10, 25, 50]}
                  rowHeight={48}
                  headerHeight={38}
                  suppressCellFocus={true}
                  animateRows={true}
                  onRowClicked={onRowClicked}
                  rowClass="cursor-pointer"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Overview Dialog */}
        <ContractOverviewDialog
          contract={selectedContract}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </DashboardLayout>
  )
}

export default ClientContracts
