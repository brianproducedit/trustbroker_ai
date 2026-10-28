import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useContractStore } from '@/hooks/useContractStore'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Globe,
  Edit2,
  Save,
  X,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export const ClientProfile: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const { contracts, fetchContracts } = useContractStore()

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Profile Form state
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchContracts()
        const data = await api.profiles.me().catch(() => null)
        if (data) {
          setName(data.name || user?.name || 'Elena Rostova')
          setOrganization(data.organization || user?.organization || 'Acme Global Ventures LLC')
          setHeadline(data.headline || 'Managing Partner & Technology Sponsor')
          setBio(
            data.bio ||
              'Funding high-impact cross-border engineering teams using automated smart contracts and verified milestone disbursements.'
          )
          setWebsite(data.website || 'https://acmeglobalventures.com')
          setCategory(data.category || 'Venture & Engineering Incubation')
        } else {
          setName(user?.name || 'Elena Rostova')
          setOrganization(user?.organization || 'Acme Global Ventures LLC')
          setHeadline('Managing Partner & Technology Sponsor')
          setBio(
            'Funding high-impact cross-border engineering teams using automated smart contracts and verified milestone disbursements.'
          )
          setWebsite('https://acmeglobalventures.com')
          setCategory('Venture & Engineering Incubation')
        }
      } catch (err) {
        console.warn('Failed to load profile:', err)
      }
    }
    loadProfile()
  }, [user, fetchContracts])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.profiles.updateMe({
        name,
        organization,
        headline,
        bio,
        website,
        category,
      })
      toast.success('Client profile updated successfully.')
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // Calculate client metrics
  const totalContracts = contracts.length
  const totalStaged = contracts.reduce((sum, c) => sum + (c.stagedAmount || 0), 0)
  const totalReleased = contracts.reduce((sum, c) => sum + (c.releasedAmount || 0), 0)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header Banner */}
        <div className="bg-[#131B2E] border border-[#222A3D] rounded-xl p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg border border-blue-400/30">
                {(organization || name || 'C')[0].toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {organization || name || 'Client Organization'}
                  </h1>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">
                    Verified Client
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  {headline || 'Verified Sponsor on TrustBroker AI'}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <User className="w-3.5 h-3.5" /> {name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Mail className="w-3.5 h-3.5" /> {user?.email || 'client@trustbroker.ai'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
              className="border-[#222A3D] text-slate-200 hover:bg-[#1E293B] text-xs self-start md:self-center"
            >
              {isEditing ? (
                <>
                  <X className="w-3.5 h-3.5 mr-1.5" /> Cancel Edit
                </>
              ) : (
                <>
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#131B2E] border-[#222A3D] text-white p-4">
            <span className="text-xs text-slate-400">Total Sponsored SOWs</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {totalContracts}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Active & Open Listings</span>
          </Card>

          <Card className="bg-[#131B2E] border border-amber-900/30 text-white p-4">
            <span className="text-xs text-amber-400">Total Escrow Staged</span>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
              {formatCurrency(totalStaged, 'USD')}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Secured via PayPal Sandbox</span>
          </Card>

          <Card className="bg-[#131B2E] border border-emerald-900/30 text-white p-4">
            <span className="text-xs text-emerald-400">Disbursed to Freelancers</span>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
              {formatCurrency(totalReleased, 'USD')}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Settled Milestone Payouts</span>
          </Card>
        </div>

        {/* Profile Content / Edit Form */}
        <Card className="bg-[#131B2E] border-[#222A3D] text-white p-6">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#222A3D] pb-3">
                <h3 className="font-semibold text-sm text-white">Edit Organization Profile</h3>
                <span className="text-xs text-slate-400">Visible to applicants</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Contact Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Organization Name *</label>
                  <Input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Organization Headline</label>
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Venture studio funding AI applications"
                    className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Official Website</label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Company Bio & Hiring Mission</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="bg-[#0B1120] border-[#222A3D] text-white text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#222A3D]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold mb-2">
                  About the Organization
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0B1120] p-4 rounded-lg border border-[#222A3D]">
                  {bio || 'No organization bio provided yet.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0B1120] p-4 rounded-lg border border-[#222A3D] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Website
                  </span>
                  <div className="text-xs text-blue-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    {website ? (
                      <a href={website} target="_blank" rel="noreferrer" className="hover:underline">
                        {website}
                      </a>
                    ) : (
                      <span className="text-slate-500">Not configured</span>
                    )}
                  </div>
                </div>

                <div className="bg-[#0B1120] p-4 rounded-lg border border-[#222A3D] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    PayPal Sandbox Settlement
                  </span>
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Instant Escrow Pre-Funding Enabled
                  </div>
                </div>
              </div>

              {/* Active Listings Preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold">
                    Current Open Listings ({contracts.filter((c) => c.status === 'open').length})
                  </h3>
                  <Button asChild variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300 p-0">
                    <Link to={ROUTES.CLIENT_CONTRACTS}>
                      View all contracts <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2">
                  {contracts.filter((c) => c.status === 'open').slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="bg-[#0B1120] border border-[#222A3D] rounded-lg p-3 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-xs text-white block">{c.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.code}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-white">
                          {formatCurrency(c.totalAmount ?? (c as any).budget ?? 0, c.currency)}
                        </span>
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-blue-400">
                          <Link to={ROUTES.CONTRACT_DETAIL(c.id)}>Manage</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ClientProfile
