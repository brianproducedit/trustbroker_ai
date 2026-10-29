import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Inbox,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

export const ClientApplications: React.FC = () => {
  const { contracts, fetchContracts } = useContractStore()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Award confirmation state
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [awardDialogOpen, setAwardDialogOpen] = useState(false)
  const [isAwarding, setIsAwarding] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      await fetchContracts()
      const allApps: any[] = []
      // Standard UUID validator to prevent 422 errors on mock contract IDs
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      // Query applications for each valid backend contract
      await Promise.all(
        contracts.map(async (c) => {
          if (!c.id || !UUID_REGEX.test(c.id)) {
            return
          }
          try {
            const res = await api.contracts.listApplications(c.id)
            const apps = res?.applications || []
            apps.forEach((a: any) => {
              allApps.push({
                ...a,
                contractId: c.id,
                contractCode: c.code,
                contractTitle: c.title,
                contractBudget: c.totalAmount ?? (c as any).budget,
                contractCurrency: c.currency,
              })
            })
          } catch {
            // Silently ignore individual non-existent contract applications
          }
        })
      )
      setApplications(allApps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [contracts.length])

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'pending'
          ? app.status === 'submitted' || app.status === 'ranked'
          : app.status === filter

      const matchesSearch =
        searchQuery === ''
          ? true
          : (app.freelancer?.name || '')
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (app.contractTitle || '')
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (app.contractCode || '')
              .toLowerCase()
              .includes(searchQuery.toLowerCase())

      return matchesFilter && matchesSearch
    })
  }, [applications, filter, searchQuery])

  const stats = useMemo(() => {
    const total = applications.length
    const shortlisted = applications.filter((a) => a.status === 'shortlisted').length
    const awarded = applications.filter((a) => a.status === 'awarded').length
    const scores = applications
      .map((a) => a.vettingReport?.score)
      .filter((s) => typeof s === 'number')
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0

    return { total, shortlisted, awarded, avgScore }
  }, [applications])

  const handleShortlist = async (appId: string) => {
    try {
      await api.applications.shortlist(appId)
      toast.success('Applicant shortlisted.')
      await loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to shortlist applicant.')
    }
  }

  const handleAward = async () => {
    if (!selectedApp) return
    setIsAwarding(true)
    try {
      await api.applications.award(selectedApp.id)
      toast.success(
        `Contract ${selectedApp.contractCode} awarded to ${
          selectedApp.freelancer?.name || 'freelancer'
        }!`
      )
      setAwardDialogOpen(false)
      setSelectedApp(null)
      await loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to award contract.')
    } finally {
      setIsAwarding(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-900/50 font-semibold">
                Client Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Applications & Proposals
            </h1>
            <p className="text-slate-400 text-xs">
              Review and evaluate incoming freelancer proposals with AI vetting reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-[#0E1528] border-[#222A3D] text-white text-xs h-9"
              />
            </div>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#131B2E] border-[#222A3D] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Applications</span>
              <Inbox className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-2">
              {stats.total}
            </div>
          </Card>

          <Card className="bg-[#131B2E] border-[#222A3D] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Shortlisted</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300 mt-2">
              {stats.shortlisted}
            </div>
          </Card>

          <Card className="bg-[#131B2E] border-[#222A3D] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Awarded Contracts</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">
              {stats.awarded}
            </div>
          </Card>

          <Card className="bg-[#131B2E] border-[#222A3D] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Avg AI Compatibility</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
              {stats.avgScore}%
            </div>
          </Card>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-[#222A3D] pb-3 text-xs">
          {[
            { id: 'all', label: 'All Proposals' },
            { id: 'pending', label: 'Under Review' },
            { id: 'shortlisted', label: 'Shortlisted' },
            { id: 'awarded', label: 'Awarded' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#152037]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-xs">Aggregating contract applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-[#131B2E] border border-[#222A3D] rounded-xl p-12 text-center space-y-3">
            <Inbox className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Applications Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no proposals matching your current filter. When freelancers submit proposals to your open listings, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => {
              const isExpanded = expandedId === app.id
              const vetting = app.vettingReport || {}
              const score = vetting.score ?? 85
              const recommendation = vetting.recommendation ?? 'CONSIDER'

              return (
                <div
                  key={app.id}
                  className="bg-[#131B2E] border border-[#222A3D] rounded-xl overflow-hidden transition-all hover:border-slate-700"
                >
                  {/* Row Summary */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#162137] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/30">
                        {(app.freelancer?.name || 'F')[0].toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {app.freelancer?.name || 'Verified Freelancer'}
                          </span>
                          <span className="text-slate-500 text-xs">•</span>
                          <span className="text-xs text-slate-400">
                            {app.freelancer?.email || 'freelancer@trustbroker.ai'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-blue-400 font-medium">
                            Applying for:
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {app.contractTitle}
                          </span>
                          <span className="text-slate-600 font-mono text-[10px]">
                            ({app.contractCode})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* AI Vetting Pill */}
                      <div className="flex items-center gap-2 bg-[#0B1120] px-3 py-1.5 rounded-lg border border-[#222A3D]">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-mono font-bold text-white">
                          {score}/100
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            recommendation === 'HIRE'
                              ? 'bg-emerald-950 text-emerald-400'
                              : recommendation === 'CONSIDER'
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-red-950 text-red-400'
                          }`}
                        >
                          {recommendation}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        className={`text-[10px] uppercase font-mono ${
                          app.status === 'awarded'
                            ? 'bg-emerald-600 text-white'
                            : app.status === 'shortlisted'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {app.status}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-5 border-t border-[#222A3D] bg-[#0E162B] space-y-4">
                      {/* Cover Proposal */}
                      <div>
                        <div className="text-xs font-mono uppercase text-slate-400 font-semibold mb-1.5">
                          Proposal Cover Note
                        </div>
                        <p className="text-xs text-slate-200 bg-[#0B1120] p-4 rounded-lg border border-[#222A3D] leading-relaxed whitespace-pre-wrap">
                          {app.coverNote || 'Proposal delivered per statement of work milestones.'}
                        </p>
                      </div>

                      {/* AI Vetting Deep Dive */}
                      <div className="bg-[#0B1120] border border-blue-900/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI Evaluation Assessment
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Multi-Factor Match: {score}%
                          </span>
                        </div>

                        {vetting.reasons && vetting.reasons.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Evaluation Highlights:
                            </span>
                            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                              {vetting.reasons.map((r: string, i: number) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {vetting.matched_skills && vetting.matched_skills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-slate-400 mr-1">Skills:</span>
                            {vetting.matched_skills.map((skill: string, i: number) => (
                              <span
                                key={i}
                                className="bg-blue-950/80 text-blue-300 border border-blue-800/50 text-[10px] px-2 py-0.5 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action CTAs */}
                      <div className="flex items-center justify-between pt-2">
                        <Button asChild variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                          <Link to={ROUTES.CONTRACT_DETAIL(app.contractId)}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Go to Contract Details
                          </Link>
                        </Button>

                        <div className="flex items-center gap-2">
                          {app.status === 'submitted' && (
                            <Button
                              onClick={() => handleShortlist(app.id)}
                              variant="outline"
                              size="sm"
                              className="border-[#222A3D] text-slate-300 hover:bg-[#1E293B] text-xs"
                            >
                              Shortlist Applicant
                            </Button>
                          )}

                          {app.status !== 'awarded' && (
                            <Button
                              onClick={() => {
                                setSelectedApp(app)
                                setAwardDialogOpen(true)
                              }}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            >
                              <Award className="w-3.5 h-3.5 mr-1.5" /> Award Contract ({app.contractCode})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Award Confirmation Dialog */}
        <AlertDialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
          <AlertDialogContent className="w-full max-w-md sm:max-w-lg bg-[#131B2E] border-[#222A3D] text-white p-6 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Award Contract</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 text-xs">
                Are you sure you want to award contract{' '}
                <span className="text-white font-mono font-bold">
                  {selectedApp?.contractCode}
                </span>{' '}
                to{' '}
                <span className="text-white font-semibold">
                  {selectedApp?.freelancer?.name || 'this freelancer'}
                </span>
                ? This will designate them for the project and transition the contract to dual acceptance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#0E1528] border-[#222A3D] text-slate-300 hover:bg-[#1A253C] text-xs">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAward}
                disabled={isAwarding}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {isAwarding ? 'Awarding...' : 'Confirm Award'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}

export default ClientApplications
