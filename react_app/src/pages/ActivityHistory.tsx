import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { truncateHash, formatDate } from '@/lib/utils'
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

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState<string>('all')

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const filteredLogs = contract.auditLogs.filter((log) => {
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
