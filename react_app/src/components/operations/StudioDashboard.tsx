import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AgStudio } from 'ag-studio-react'
import { enableStudioDevValidations } from 'ag-studio'
import type { AgStudioMode } from 'ag-studio'
import { buildInitialState, buildStudioData } from '@/lib/studioData'
import { trustBrokerStudioTheme } from '@/lib/studioTheme'
import { HAS_STUDIO_LICENSE } from '@/lib/agLicense'
import { ROUTES } from '@/constants'
import type { Contract } from '@/types/contract'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Eye, Pencil, Table, AlertCircle, CheckCircle2 } from 'lucide-react'

if (import.meta.env.DEV) {
  enableStudioDevValidations()
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  workspace: 'client' | 'freelancer'
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class StudioErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[StudioErrorBoundary] AG Studio encountered an error, activating Community fallback:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const fallbackRoute = this.props.workspace === 'client' ? ROUTES.CLIENT_OPERATIONS : ROUTES.FREELANCER_OPERATIONS
      return (
        <div className="p-8 rounded-xl bg-[#0B1326] border border-[#222A3D] text-center space-y-4 my-auto flex flex-col items-center justify-center min-h-[480px]">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white">AG Studio Trial Pro Key Depleted or Unavailable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AG Studio Enterprise trial license has ended or could not be verified. Your full contract, milestone, and payout data remains 100% accessible via the free, watermark-free Community Operations Ledger.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9 font-semibold">
              <Link to={fallbackRoute}>
                <Table className="w-4 h-4" />
                <span>Open Community Operations Ledger</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false })}
              className="border-[#2D3449] text-slate-300 hover:text-white text-xs h-9"
            >
              Retry AG Studio
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface StudioDashboardProps {
  contracts: Contract[]
  workspace: 'client' | 'freelancer'
}

/**
 * Real AG Studio instance: multi-page dashboard built from live contract/milestone
 * data, with the Studio AI module registered by the surrounding AgStudioProvider.
 */
export const StudioDashboard: React.FC<StudioDashboardProps> = ({ contracts, workspace }) => {
  const [mode, setMode] = useState<AgStudioMode>('view')

  const data = useMemo(() => buildStudioData(contracts, workspace), [contracts, workspace])
  const initialState = useMemo(() => buildInitialState(workspace), [workspace])
  const fallbackRoute = workspace === 'client' ? ROUTES.CLIENT_OPERATIONS : ROUTES.FREELANCER_OPERATIONS

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center flex-wrap gap-2">
              {workspace === 'client' ? 'Client' : 'Freelancer'} Analytics Studio
              <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 text-[10px] font-mono">
                AG Studio
              </Badge>
              {HAS_STUDIO_LICENSE ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Pro License Active</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px] font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Community / Trial Fallback</span>
                </Badge>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              Live contracts & milestones · {contracts.length} contract(s) in scope
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2.5 gap-1.5 border-[#1E293B] bg-[#0B1326] text-slate-300 hover:text-white hover:bg-[#1A2338]"
            title="Open watermark-free Community edition ledgers"
          >
            <Link to={fallbackRoute}>
              <Table className="w-3.5 h-3.5 text-blue-400" />
              <span>Community Grid</span>
            </Link>
          </Button>

          <div className="flex items-center gap-1 bg-[#0B1326] p-1 rounded-lg border border-[#1E293B]">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode('view')}
              className={`h-7 text-xs px-2.5 gap-1.5 ${mode === 'view' ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white' : 'text-slate-300 hover:text-white'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode('edit')}
              className={`h-7 text-xs px-2.5 gap-1.5 ${mode === 'edit' ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white' : 'text-slate-300 hover:text-white'}`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Layout
            </Button>
          </div>
        </div>
      </div>

      <div className="h-[82vh] min-h-[640px] rounded-xl overflow-hidden border border-[#1E293B] bg-[#0B1326]">
        <StudioErrorBoundary workspace={workspace}>
          <AgStudio
            data={data}
            initialState={initialState}
            mode={mode}
            theme={trustBrokerStudioTheme}
            style={{ width: '100%', height: '100%' }}
          />
        </StudioErrorBoundary>
      </div>
    </div>
  )
}
