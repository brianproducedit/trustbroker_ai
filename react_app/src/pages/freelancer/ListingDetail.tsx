import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [cover, setCover] = useState('')
  const [proposedStart, setProposedStart] = useState(new Date().toISOString().slice(0, 10))
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
      await api.contracts.apply(id, {
        cover_note: cover,
        portfolio_snapshot: snapshot,
        proposed_start: proposedStart,
      })
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
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.MARKETPLACE)} className="border-[#2D3449] text-slate-300 text-xs gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Marketplace
        </Button>

        {/* Client Organization Profile Card */}
        <Card className="border-[#222A3D] bg-[#0E1528] text-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/30">
                {(listing.client_org || listing.client_name || 'A')[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Posted by</span>
                  <span className="font-semibold text-sm text-white">{listing.client_org || 'Acme Global Ventures LLC'}</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> PayPal Verified
                  </Badge>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Sponsor: {listing.client_name || 'Elena Rostova'} · 100% Escrow Funded
                </div>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-[#222A3D] text-blue-400 hover:text-white hover:bg-blue-950/50 text-xs shrink-0 self-start sm:self-center"
            >
              <Link to={`/app/client/profile/${listing.client_id || 'client-1'}`}>
                View Client Profile <ExternalLink className="w-3 h-3 ml-1.5" />
              </Link>
            </Button>
          </div>
        </Card>

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
        <DialogContent className="w-full max-w-2xl sm:max-w-2xl md:max-w-3xl bg-[#131B2E] border-[#222A3D] text-white p-6 sm:p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Apply to this contract</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cover note plus optional portfolio items. You can only apply once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Cover note & approach *</Label>
              <Textarea
                rows={4}
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="Explain how you will deliver this milestone specification and your relevant stack experience..."
                className="bg-[#0B1326] border-[#2D3449] text-white text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Proposed Start Date</Label>
              <Input
                type="date"
                value={proposedStart}
                onChange={(e) => setProposedStart(e.target.value)}
                className="bg-[#0B1326] border-[#2D3449] text-white text-xs h-9 font-mono"
              />
            </div>

            {portfolio.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-300">Attach Verified Portfolio Cards</Label>
                  <span className="text-[11px] text-slate-500">Selected items feed into AI vetting</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {portfolio.map((p, idx) => {
                    const isSelected = selected.includes(idx)
                    return (
                      <div
                        key={idx}
                        onClick={() =>
                          setSelected((prev) =>
                            isSelected ? prev.filter((i) => i !== idx) : [...prev, idx]
                          )
                        }
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-[#0B1326] border-[#222A3D] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-white truncate">
                            {isSelected ? '✓ ' : ''}{p.title || 'Untitled Project'}
                          </span>
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 text-[10px] shrink-0"
                            >
                              Preview <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {p.url || 'Portfolio artifact'}
                        </p>
                      </div>
                    )
                  })}
                </div>
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
