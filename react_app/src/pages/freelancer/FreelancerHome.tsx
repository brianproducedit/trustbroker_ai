import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Search, UserCircle2, Inbox } from 'lucide-react'

export const FreelancerHome: React.FC = () => {
  const navigate = useNavigate()
  const [listings, setListings] = useState<any[]>([])
  const [apps, setApps] = useState<any[]>([])
  const [completeness, setCompleteness] = useState(0)

  useEffect(() => {
    api.listings.list({ per_page: 4 }).then((r) => setListings(r.listings || [])).catch(() => setListings([]))
    api.applications.mine().then((r) => setApps(r.applications || [])).catch(() => setApps([]))
    api.profiles.me().then((p) => setCompleteness(p.profile_completeness || 0)).catch(() => setCompleteness(0))
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Your work</h1>
            <p className="text-xs text-slate-400 mt-1">
              Open contracts recommended for you. Apply, track status, then deliver after award and funding.
            </p>
          </div>
          <Button onClick={() => navigate(ROUTES.MARKETPLACE)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
            <Search className="w-3.5 h-3.5" /> Browse marketplace
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-[#222A3D] bg-[#132328] text-white">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Profile completeness</span>
                <span className="font-mono">{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2" />
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.FREELANCER_PROFILE)} className="border-emerald-800 text-emerald-300 text-xs gap-1">
                <UserCircle2 className="w-3.5 h-3.5" /> Edit profile
              </Button>
            </CardContent>
          </Card>
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-slate-400">Applications</p>
              <p className="text-2xl font-mono font-bold">{apps.length}</p>
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.FREELANCER_APPLICATIONS)} className="border-[#2D3449] text-slate-200 text-xs gap-1">
                <Inbox className="w-3.5 h-3.5" /> View statuses
              </Button>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Recommended open contracts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {listings.map((l) => (
              <Card
                key={l.id}
                className="border-[#222A3D] bg-[#131B2E] text-white cursor-pointer hover:border-emerald-800"
                onClick={() => navigate(ROUTES.LISTING_DETAIL(l.id))}
              >
                <CardContent className="py-4">
                  <p className="text-[11px] font-mono text-emerald-400">{l.code}</p>
                  <p className="font-semibold text-sm mt-1">{l.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatCurrency(Number(l.total_amount) || 0)}</p>
                </CardContent>
              </Card>
            ))}
            {listings.length === 0 && <p className="text-xs text-slate-400">No open listings yet.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default FreelancerHome
