import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  ShieldCheck,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

export const ClientProfilePublic: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>()
  const { contracts, fetchContracts } = useContractStore()

  const [clientData] = useState<any>({
    id: clientId || 'client-1',
    name: 'Elena Rostova',
    organization: 'Acme Global Ventures LLC',
    headline: 'Managing Partner & Technology Sponsor',
    bio: 'Backing global developers building resilient fintech and AI products. All contracts feature pre-funded milestone escrow in PayPal Sandbox with AI automated verification checks.',
    website: 'https://acmeglobalventures.com',
    memberSince: 'March 2026',
    verified: true,
  })

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // Filter listings that match this client
  const clientListings = contracts.filter((c) => c.status === 'open')

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-[#171F33] -ml-2"
          >
            <Link to={ROUTES.MARKETPLACE}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Marketplace
            </Link>
          </Button>
        </div>

        {/* Client Banner */}
        <div className="bg-[#131B2E] border border-[#222A3D] rounded-xl p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg border border-blue-400/30">
                {(clientData.organization || 'A')[0]}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {clientData.organization}
                  </h1>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PayPal Verified
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">{clientData.headline}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="text-slate-400">Representative: {clientData.name}</span>
                  <span>•</span>
                  <span className="text-slate-400">Active on TrustBroker</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-blue-950 text-blue-300 border-blue-800 text-xs px-3 py-1">
                100% Escrow Funded
              </Badge>
            </div>
          </div>
        </div>

        {/* Company Overview Card */}
        <Card className="bg-[#131B2E] border-[#222A3D] text-white p-6 space-y-4">
          <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold">
            About the Hiring Organization
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#0B1120] p-4 rounded-lg border border-[#222A3D]">
            {clientData.bio}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#0B1120] p-3.5 rounded-lg border border-[#222A3D] flex items-center justify-between">
              <span className="text-xs text-slate-400">Official Website</span>
              <a
                href={clientData.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" /> Visit Website
              </a>
            </div>

            <div className="bg-[#0B1120] p-3.5 rounded-lg border border-[#222A3D] flex items-center justify-between">
              <span className="text-xs text-slate-400">Payment Security</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> PayPal Sandbox Verified
              </span>
            </div>
          </div>
        </Card>

        {/* Open Opportunities Posted by this Client */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" /> Open Contracts from this Client ({clientListings.length})
            </h3>
          </div>

          {clientListings.length === 0 ? (
            <div className="bg-[#131B2E] border border-[#222A3D] rounded-xl p-8 text-center text-slate-400 text-xs">
              No open listings currently available from this client.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {clientListings.map((c) => (
                <Card
                  key={c.id}
                  className="bg-[#131B2E] border-[#222A3D] text-white p-4 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {c.code}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-semibold text-sm text-white">{c.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {c.description || 'Milestone deliverable with automated AI acceptance verification.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Budget</div>
                      <div className="font-mono font-bold text-sm text-white">
                        {formatCurrency(c.totalAmount ?? (c as any).budget ?? 0, c.currency)}
                      </div>
                    </div>
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                      <Link to={ROUTES.LISTING_DETAIL(c.id)}>
                        View & Apply <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ClientProfilePublic
