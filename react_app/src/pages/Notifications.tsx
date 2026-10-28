import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/hooks/useNotifications'
import {
  Bell,
  CheckCircle2,
  DollarSign,
  FileCheck2,
  FileText,
  Filter,
  CheckCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } =
    useNotificationStore()
  const [filter, setFilter] = useState<'all' | 'unread' | 'payment' | 'verification' | 'application'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'payment') return n.type === 'payment'
    if (filter === 'verification') return n.type === 'verification'
    if (filter === 'application') return n.type === 'application'
    return true
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="w-4 h-4 text-emerald-400" />
      case 'verification':
        return <Sparkles className="w-4 h-4 text-blue-400" />
      case 'application':
        return <FileCheck2 className="w-4 h-4 text-purple-400" />
      default:
        return <FileText className="w-4 h-4 text-slate-400" />
    }
  }

  const unreadTotal = unreadCount()

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Notifications</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time activity across milestone funding, AI verifications, and PayPal payouts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadTotal > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'unread', label: `Unread (${unreadTotal})` },
            { id: 'payment', label: 'Payments' },
            { id: 'verification', label: 'AI Verification' },
            { id: 'application', label: 'Applications' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filter === tab.id
                ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0E1528] p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">No notifications matching the selected filter.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markAsRead(n.id)
                if (n.link) navigate(n.link)
              }}
              className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer group ${
                !n.read
                  ? 'bg-[#131B2E] border-blue-900/60 hover:border-blue-500/60 shadow-lg shadow-blue-950/20'
                  : 'bg-[#0B1120] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  n.type === 'payment'
                    ? 'bg-emerald-950/40 border-emerald-800/50'
                    : n.type === 'verification'
                    ? 'bg-blue-950/40 border-blue-800/50'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {n.title}
                    </span>
                    {!n.read && (
                      <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400 text-[10px] px-1.5 py-0 h-4">
                        New
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(n.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.description}</p>

                {n.link && (
                  <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 group-hover:text-blue-300">
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
export default NotificationsPage
