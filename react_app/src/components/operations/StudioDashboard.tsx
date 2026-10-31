import React, { useMemo, useState } from 'react'
import { AgStudio } from 'ag-studio-react'
import { enableStudioDevValidations } from 'ag-studio'
import type { AgStudioMode } from 'ag-studio'
import { buildInitialState, buildStudioData } from '@/lib/studioData'
import { trustBrokerStudioTheme } from '@/lib/studioTheme'
import type { Contract } from '@/types/contract'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Eye, Pencil } from 'lucide-react'

if (import.meta.env.DEV) {
  enableStudioDevValidations()
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {workspace === 'client' ? 'Client' : 'Freelancer'} Analytics Studio
              <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 text-[10px] font-mono">
                AG Studio
              </Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Live contracts & milestones · {contracts.length} contract(s) in scope
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0B1326] p-1 rounded-lg border border-[#1E293B] self-start">
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

      <div className="h-[82vh] min-h-[640px] rounded-xl overflow-hidden border border-[#1E293B] bg-[#0B1326]">
        <AgStudio
          data={data}
          initialState={initialState}
          mode={mode}
          theme={trustBrokerStudioTheme}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
