import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [cover, setCover] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    api.listings
      .get(id)
      .then(setListing)
      .catch(() => setListing(null))
    api.profiles.me().then(setProfile).catch(() => setProfile(null))
  }, [id])

  const portfolio: any[] = Array.isArray(profile?.portfolio) ? profile.portfolio : []

  const submit = async () => {
    if (!id) return
    if (!cover.trim()) {
      toast.error('Add a short cover note.')
      return
    }
    setSubmitting(true)
    try {
      const snapshot = selected.map((i) => portfolio[i]).filter(Boolean)
      await api.contracts.apply(id, { cover_note: cover, portfolio_snapshot: snapshot })
      toast.success('Application sent. AI is ranking your profile for the client.')
      setOpen(false)
      setListing((prev: any) => (prev ? { ...prev, already_applied: true } : prev))
      navigate(ROUTES.FREELANCER_APPLICATIONS)
    } catch (err: any) {
      toast.error(err?.detail || 'Could not apply')
    } finally {
      setSubmitting(false)
    }
  }

  if (!listing) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-400">Loading listing…</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.MARKETPLACE)} className="border-[#2D3449] text-slate-300 text-xs gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Marketplace
        </Button>
        <Card className="border-[#222A3D] bg-[#131B2E] text-white">
          <CardHeader>
            <p className="text-[11px] font-mono text-emerald-400">{listing.code}</p>
            <CardTitle>{listing.title}</CardTitle>
            <p className="text-xs text-slate-400 capitalize">{listing.category} · {formatCurrency(Number(listing.total_amount) || 0)}</p>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-300">
            <p>{listing.description}</p>
            {(listing.required_skills || []).length > 0 && (
              <p>Skills: {(listing.required_skills || []).join(', ')}</p>
            )}
            <div className="space-y-2">
              {(listing.milestones || []).map((m: any, idx: number) => (
                <div key={m.id || idx} className="p-3 rounded-lg bg-[#0B1326] border border-[#222A3D]">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-white">M{idx + 1}. {m.title}</span>
                    <span className="font-mono">{formatCurrency(Number(m.amount) || 0)}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{m.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={listing.already_applied}
              onClick={() => setOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              {listing.already_applied ? 'Already applied' : 'Apply'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to this contract</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cover note plus optional portfolio items. You can only apply once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Cover note</Label>
              <Textarea rows={4} value={cover} onChange={(e) => setCover(e.target.value)} className="bg-[#0B1326] border-[#2D3449] text-white text-xs" />
            </div>
            {portfolio.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Portfolio to include</Label>
                {portfolio.map((p, idx) => (
                  <label key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Checkbox
                      checked={selected.includes(idx)}
                      onCheckedChange={(checked) =>
                        setSelected((prev) => (checked ? [...prev, idx] : prev.filter((i) => i !== idx)))
                      }
                    />
                    <span>
                      {p.title || 'Untitled'} {p.url ? `· ${p.url}` : ''}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="border-[#2D3449] text-slate-300 text-xs">
              Cancel
            </Button>
            <Button size="sm" disabled={submitting} onClick={() => void submit()} className="bg-emerald-600 text-white text-xs gap-1">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default ListingDetail
