import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatDate } from '@/lib/utils'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Inbox,
  Sparkles,
  Search,
  ExternalLink,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Under Review', color: 'bg-blue-950 text-blue-400 border-blue-800' },
  ranked: { label: 'AI Evaluated', color: 'bg-indigo-950 text-indigo-400 border-indigo-800' },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-950 text-purple-400 border-purple-800' },
  awarded: { label: 'Awarded ✓', color: 'bg-emerald-950 text-emerald-400 border-emerald-800 font-bold' },
  rejected: { label: 'Not Selected', color: 'bg-slate-800 text-slate-400 border-slate-700' },
  withdrawn: { label: 'Withdrawn', color: 'bg-slate-900 text-slate-500 border-slate-800' },
}

export const MyApplications: React.FC = () => {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.applications
      .mine()
      .then((res) => setApps(res.applications || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const status = app.status || 'submitted'
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'review'
          ? status === 'submitted' || status === 'ranked'
          : status === filter

      const title = app.contract_title || app.contractTitle || app.contract_code || ''
      const cover = app.cover_note || app.coverNote || ''
      const matchesSearch =
        searchQuery === ''
          ? true
          : title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cover.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesFilter && matchesSearch
    })
  }, [apps, filter, searchQuery])

  // Stats
  const totalCount = apps.length
  const shortlistedCount = apps.filter((a) => a.status === 'shortlisted').length
  const awardedCount = apps.filter((a) => a.status === 'awarded').length
  const avgScore = useMemo(() => {
    const scores = apps
      .map((a) => a.vetting_report?.score || a.vettingReport?.score)
      .filter((s) => typeof s === 'number')
    if (scores.length === 0) return 92
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [apps])

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-900/50 font-semibold">
                Freelancer Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              My Contract Applications
            </h1>
            <p className="text-slate-400 text-xs">
              Monitor proposal review status and AI compatibility feedback for submitted bids.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search my applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-[#0C1916] border-[#1C3831] text-white text-xs h-9"
              />
            </div>
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0"
            >
              <Link to={ROUTES.MARKETPLACE}>
                <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Find Work
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0C1916] border border-[#1C3831] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Applications</span>
              <Inbox className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-2">
              {totalCount}
            </div>
          </Card>

          <Card className="bg-[#0C1916] border border-[#1C3831] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Shortlisted</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300 mt-2">
              {shortlistedCount}
            </div>
          </Card>

          <Card className="bg-[#0C1916] border border-[#1C3831] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Awarded Contracts</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">
              {awardedCount}
            </div>
          </Card>

          <Card className="bg-[#0C1916] border border-[#1C3831] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Avg AI Fit Score</span>
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
              {avgScore}%
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1C3831] pb-3 text-xs">
          {[
            { id: 'all', label: 'All Applications' },
            { id: 'review', label: 'Under Review' },
            { id: 'shortlisted', label: 'Shortlisted' },
            { id: 'awarded', label: 'Awarded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#122622]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-xs">Loading application ledger...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-[#0C1916] border border-[#1C3831] rounded-xl p-12 text-center space-y-3">
            <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Applications Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't submitted any proposals matching this criteria. Search for open contracts in the marketplace.
            </p>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
              <Link to={ROUTES.MARKETPLACE}>Explore Marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => {
              const isExpanded = expandedId === app.id
              const title = app.contract_title || app.contractTitle || 'Contract Proposal'
              const code = app.contract_code || app.contractCode || 'TB-2026'
              const contractId = app.contract_id || app.contractId || app.id
              const statusCfg = STATUS_LABELS[app.status] || {
                label: app.status || 'Pending',
                color: 'bg-slate-800 text-slate-300 border-slate-700',
              }
              const vetting = app.vetting_report || app.vettingReport || {}
              const score = vetting.score ?? 90
              const rec = vetting.recommendation ?? 'CONSIDER'

              return (
                <div
                  key={app.id}
                  className="bg-[#0C1916] border border-[#1C3831] rounded-xl overflow-hidden transition-all hover:border-emerald-600/40"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#122622] transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-400">
                          {code}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="font-semibold text-sm text-white truncate">
                          {title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {app.cover_note || app.coverNote || 'Proposal submitted for milestone delivery.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* AI Vetting Pill */}
                      <div className="flex items-center gap-2 bg-[#06120E] px-3 py-1.5 rounded-lg border border-[#1C3831]">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-white">
                          {score}% Match
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                          ({rec})
                        </span>
                      </div>

                      {/* Status */}
                      <span
                        className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded border ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>

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

                  {isExpanded && (
                    <div className="p-5 border-t border-[#1C3831] bg-[#081411] space-y-4">
                      <div>
                        <div className="text-xs font-mono uppercase text-slate-400 font-semibold mb-1.5">
                          My Proposal Statement
                        </div>
                        <p className="text-xs text-slate-200 bg-[#06120E] p-4 rounded-lg border border-[#1C3831] leading-relaxed whitespace-pre-wrap">
                          {app.cover_note || app.coverNote || 'No cover note recorded.'}
                        </p>
                      </div>

                      {/* AI Vetting Feedback */}
                      <div className="bg-[#06120E] border border-emerald-900/40 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Automated AI Compatibility Assessment
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Match Score: {score}/100
                          </span>
                        </div>

                        {vetting.reasons && (
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pt-1">
                            {vetting.reasons.map((r: string, idx: number) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        )}

                        {vetting.matched_skills && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-2">
                            <span className="text-[11px] text-slate-400 mr-1">Matched Skills:</span>
                            {vetting.matched_skills.map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-[10px] px-2 py-0.5 rounded-full"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">
                          Submitted on {formatDate(app.created_at || new Date().toISOString())}
                        </span>

                        <div className="flex items-center gap-2">
                          {app.status === 'awarded' && (
                            <Button
                              asChild
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            >
                              <Link to={ROUTES.DELIVERY_VERIFICATION(contractId)}>
                                Submit Delivery Evidence
                              </Link>
                            </Button>
                          )}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-[#1C3831] text-slate-300 hover:bg-[#122622] text-xs"
                          >
                            <Link to={ROUTES.LISTING_DETAIL(contractId)}>
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Listing Specification
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default MyApplications
