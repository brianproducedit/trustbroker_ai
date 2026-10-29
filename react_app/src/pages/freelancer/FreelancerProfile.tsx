import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PortfolioItem {
  title: string
  url: string
  kind: string
}

export const FreelancerProfile: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [organization, setOrganization] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [paypal, setPaypal] = useState('')
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [completeness, setCompleteness] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const me = await api.profiles.me()
      setFullName(me.full_name || '')
      setHeadline(me.headline || '')
      setBio(me.bio || '')
      setOrganization(me.organization || '')
      setSkillsText((me.skills || []).join(', '))
      setPaypal(me.paypal_payout_email || '')
      setPortfolio(
        Array.isArray(me.portfolio) && me.portfolio.length
          ? me.portfolio.map((p: any) => ({
            title: p.title || '',
            url: p.url || '',
            kind: p.kind || 'link',
          }))
          : [{ title: '', url: '', kind: 'link' }]
      )
      setCompleteness(me.profile_completeness || 0)
    } catch (err: any) {
      toast.error(err?.detail || 'Could not load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.profiles.updateMe({
        full_name: fullName,
        headline,
        bio,
        organization,
        paypal_payout_email: paypal,
        skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
        portfolio: portfolio.filter((p) => p.title.trim() || p.url.trim()),
        primary_workspace: 'freelancer',
      })
      setCompleteness(updated.profile_completeness || 0)
      toast.success('Profile saved')
    } catch (err: any) {
      toast.error(err?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Freelancer profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            Completeness affects vetting. Newcomers are judged on portfolio and skills, not empty job history.
          </p>
        </div>
        <Card className="border-[#222A3D] bg-[#131B2E] text-white">
          <CardHeader>
            <CardTitle className="text-sm">Profile completeness</CardTitle>
            <CardDescription className="text-xs text-slate-400">{completeness} / 100</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={completeness} className="h-2" />
            {completeness < 40 && (
              <p className="text-[11px] text-amber-300 mt-2">
                Below 40 — clients will see a “Needs profile” badge until you add bio, skills and portfolio.
              </p>
            )}
          </CardContent>
        </Card>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Full name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-[#0B1326] border-[#2D3449] text-white text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Organization</Label>
                  <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="bg-[#0B1326] border-[#2D3449] text-white text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Headline</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="bg-[#0B1326] border-[#2D3449] text-white text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bio</Label>
                <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="bg-[#0B1326] border-[#2D3449] text-white text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Skills (comma-separated)</Label>
                <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="bg-[#0B1326] border-[#2D3449] text-white text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PayPal payout email</Label>
                <Input value={paypal} onChange={(e) => setPaypal(e.target.value)} className="bg-[#0B1326] border-[#2D3449] text-white text-xs" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Portfolio</Label>
                  <button
                    type="button"
                    className="text-xs text-emerald-400 inline-flex items-center gap-1"
                    onClick={() => setPortfolio((p) => [...p, { title: '', url: '', kind: 'link' }])}
                  >
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>
                {portfolio.map((item, idx) => (
                  <div key={idx} className="grid sm:grid-cols-12 gap-2">
                    <Input
                      placeholder="Title"
                      value={item.title}
                      onChange={(e) => {
                        const next = [...portfolio]
                        next[idx] = { ...item, title: e.target.value }
                        setPortfolio(next)
                      }}
                      className="sm:col-span-4 bg-[#0B1326] border-[#2D3449] text-white text-xs"
                    />
                    <Input
                      placeholder="https://"
                      value={item.url}
                      onChange={(e) => {
                        const next = [...portfolio]
                        next[idx] = { ...item, url: e.target.value }
                        setPortfolio(next)
                      }}
                      className="sm:col-span-7 bg-[#0B1326] border-[#2D3449] text-white text-xs"
                    />
                    <button type="button" className="text-slate-500 hover:text-red-400" onClick={() => setPortfolio(portfolio.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled={saving} onClick={() => void save()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save profile
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default FreelancerProfile
