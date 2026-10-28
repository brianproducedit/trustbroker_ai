import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { truncateHash, formatDate } from '@/lib/utils'
import { api } from '@/lib/api'
import { 
  History, 
  ArrowLeft, 
  ShieldCheck, 
  Copy, 
  Check, 
  Filter 
} from 'lucide-react'

export const ActivityHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { contracts } = useContractStore()

  const contract = id 
    ? contracts.find((c) => c.id === id || c.code === id)
    : (contracts[0] || null)

  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [liveLogs, setLiveLogs] = useState<any[] | null>(null)

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-16 p-8 rounded-xl bg-[#131B2E] border border-[#222A3D] text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1E293B] border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">Activity Log Not Found</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              No audit trail found for contract <span className="text-blue-400 font-mono">{id}</span> or your account is not authorized to inspect it.
            </p>
          </div>
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  useEffect(() => {
    if (contract?.id) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contract.id)
      if (isUuid) {
        api.audit.getAuditTrail(contract.id)
          .then((logs) => {
            if (Array.isArray(logs) && logs.length > 0) {
              setLiveLogs(
                logs.map((e: any) => ({
                  id: String(e.id),
                  timestamp: e.created_at || new Date().toISOString(),
                  actor: e.actor_name || 'System',
                  action: e.action || 'UPDATE',
                  details: e.details || '',
                  recordHash: e.metadata_json?.hash || undefined,
                }))
              )
            }
          })
          .catch((err) => console.warn('Audit trail live fetch note:', err))
      }
    }
  }, [contract?.id])

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const logsToDisplay = liveLogs || contract.auditLogs
  const filteredLogs = logsToDisplay.filter((log) => {
    if (filterAction === 'all') return true
    return log.action.toLowerCase().includes(filterAction.toLowerCase())
  })

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link
              to={ROUTES.CONTRACT_DETAIL(contract.id)}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Contract {contract.code}</span>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-blue-400" />
              <span>Tamper-Proof Activity &amp; Audit Trail</span>
            </h1>
            <p className="text-xs text-slate-400">
              Chronological immutable event ledger for contract {contract.code}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tamper-Proof Anchoring</span>
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-[#222A3D] pb-3">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'accepted', label: 'Signatures' },
              { id: 'paypal', label: 'PayPal Operations' },
              { id: 'ai', label: 'AI Verifications' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterAction(f.id)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filterAction === f.id
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-[#171F33]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="bg-[#131B2E] rounded-xl border border-[#222A3D] p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {filteredLogs.map((log, idx) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-[#0E1528] border border-[#222A3D] flex flex-col gap-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-900/60 text-blue-300 font-mono text-[11px] font-bold flex items-center justify-center">
                      {filteredLogs.length - idx}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs text-slate-300 font-medium">{log.actor}</span>
                  </div>

                  <span className="font-mono text-[11px] text-slate-400">
                    {formatDate(log.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                  {log.details}
                </p>

                {log.recordHash && (
                  <div className="pl-8 pt-1 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <span>Hash:</span>
                    <span className="text-slate-400">{truncateHash(log.recordHash, 10, 8)}</span>
                    <button
                      onClick={() => copyToClipboard(log.recordHash!)}
                      className="p-1 hover:text-white text-slate-500 transition-colors"
                      title="Copy full SHA-256 hash"
                    >
                      {copiedHash === log.recordHash ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
