import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const LABELS: Record<string, string> = {
  submitted: 'Pending',
  ranked: 'Pending',
  shortlisted: 'Shortlisted',
  awarded: 'Awarded',
  rejected: 'Not selected',
  withdrawn: 'Withdrawn',
}

export const MyApplications: React.FC = () => {
  const navigate = useNavigate()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.applications
      .mine()
      .then((res) => setApps(res.applications || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-3xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">My applications</h1>
          <p className="text-xs text-slate-400 mt-1">Pending, shortlisted, awarded, or not selected.</p>
        </div>
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {!loading && apps.length === 0 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-sm">You have not applied to any open contracts yet.</p>
              <Button size="sm" onClick={() => navigate(ROUTES.MARKETPLACE)} className="bg-emerald-600 text-white text-xs">
                Find work
              </Button>
            </CardContent>
          </Card>
        )}
        {apps.map((a) => (
          <Card key={a.id} className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="py-4 flex justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{a.contract_title || a.contract_code}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.cover_note}</p>
              </div>
              <span className="text-[11px] uppercase font-semibold text-emerald-400 shrink-0">
                {LABELS[a.status] || a.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  )
}

export default MyApplications
