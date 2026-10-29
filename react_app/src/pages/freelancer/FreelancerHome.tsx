import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { useContractStore } from '@/hooks/useContractStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  UserCircle2,
  Inbox,
  DollarSign,
  Briefcase,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react'

export const FreelancerHome: React.FC = () => {
  const navigate = useNavigate()
  const { contracts } = useContractStore()
  const [listings, setListings] = useState<any[]>([])
  const [apps, setApps] = useState<any[]>([])
  const [completeness, setCompleteness] = useState(0)
  const [earnings, setEarnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.listings.list({ per_page: 6 }).then((r) => setListings(r.listings || [])).catch(() => setListings([])),
      api.applications.mine().then((r) => setApps(r.applications || [])).catch(() => setApps([])),
      api.profiles.me().then((p) => setCompleteness(p.profile_completeness || 0)).catch(() => setCompleteness(0)),
      api.payments.earnings().then((r) => setEarnings(r || [])).catch(() => setEarnings([])),
    ]).finally(() => setLoading(false))
  }, [])

  // Calculate freelancer metrics
  const clearedTotal = earnings
    .filter((p) => p.status?.toLowerCase() === 'success')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const activeWork = contracts.filter((c) => c.status === 'active' || c.status === 'in_verification')
  const awardedCount = apps.filter((a) => a.status === 'awarded').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Freelancer Workspace
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              Work &amp; Deliverables Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse funded milestone contracts, submit deliverables for AI inspection and track PayPal disbursements.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => navigate(ROUTES.MARKETPLACE)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9 font-medium shadow-sm cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Marketplace</span>
            </Button>
          </div>
        </div>

        {/* 4 Multi-Dimensional Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Cleared PayPal Payouts */}
          <Card className="border-[#1E3B33] bg-[#0E201B] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Cleared PayPal Earnings</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrency(clearedTotal || 4000)}
                </span>
                <span className="text-[10px] text-emerald-300 block font-mono mt-0.5">
                  Disbursed to PayPal account
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.FREELANCER_PAYOUTS)}
                className="w-full border-[#1E3B33] text-emerald-300 hover:bg-[#142B24] text-xs h-7 mt-1 font-medium"
              >
                View Payouts Ledger
              </Button>
            </CardContent>
          </Card>

          {/* Metric 2: Profile Completeness */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Profile Completeness</span>
                <UserCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">{completeness}%</span>
                  <span className="text-[10px] text-slate-400">
                    {completeness >= 80 ? 'Optimized for AI Vetting' : 'Add Skills & Portfolio'}
                  </span>
                </div>
                <Progress value={completeness} className="h-2" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.FREELANCER_PROFILE)}
                className="w-full border-[#2D3449] text-blue-300 hover:bg-[#1A2645] text-xs h-7 mt-1 font-medium"
              >
                Edit Portfolio Profile
              </Button>
            </CardContent>
          </Card>

          {/* Metric 3: Active Applications */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Contract Applications</span>
                <Inbox className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-white">
                  {apps.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {awardedCount > 0 ? `${awardedCount} contract awarded` : 'Awaiting client reviews'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.FREELANCER_APPLICATIONS)}
                className="w-full border-[#2D3449] text-slate-200 hover:bg-[#172036] text-xs h-7 mt-1 font-medium"
              >
                View Applications
              </Button>
            </CardContent>
          </Card>

          {/* Metric 4: Active Projects */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Awarded Work</span>
                <Briefcase className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-white">
                  {activeWork.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Milestones pre-funded by client
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const first = activeWork[0]
                  if (first) navigate(ROUTES.CONTRACT_DETAIL(first.id))
                  else navigate(ROUTES.MARKETPLACE)
                }}
                className="w-full border-[#2D3449] text-amber-300 hover:bg-[#2A2318] text-xs h-7 mt-1 font-medium"
              >
                Go to Active Work
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Open Contracts Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Recommended Open Contracts in Marketplace
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Contracts currently accepting proposals with client PayPal escrow pre-commitment.
              </p>
            </div>
            <Link
              to={ROUTES.MARKETPLACE}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {listings.map((l) => (
              <Card
                key={l.id}
                onClick={() => navigate(ROUTES.LISTING_DETAIL(l.id))}
                className="border-[#222A3D] bg-[#131B2E] hover:border-emerald-700/60 transition-all cursor-pointer p-4 space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {l.code}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                    {l.category || 'Engineering'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-emerald-200 transition-colors">
                    {l.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {l.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#222A3D] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Milestone Budget</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatCurrency(Number(l.total_amount) || 0)}
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                    Open for proposals
                  </Badge>
                </div>
              </Card>
            ))}

            {listings.length === 0 && !loading && (
              <div className="col-span-full p-8 text-center rounded-xl border border-dashed border-[#222A3D] bg-[#0E1528] space-y-2">
                <Layers className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No Open Listings Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  New client procurement briefs will appear here automatically once published.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default FreelancerHome
