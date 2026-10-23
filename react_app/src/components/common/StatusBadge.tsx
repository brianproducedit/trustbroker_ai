import React from 'react'
import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/constants'
import { CheckCircle2, Clock, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'

export type BadgeVariant = 
  | 'verified' 
  | 'settled' 
  | 'active' 
  | 'in_verification' 
  | 'verifying' 
  | 'revision_requested' 
  | 'staged_in_sandbox' 
  | 'pending' 
  | 'draft' 
  | 'disputed' 
  | 'neutral'

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className,
  size = 'md',
  showIcon = true,
}) => {
  const displayLabel = label || STATUS_LABELS[status] || status.replace(/_/g, ' ')

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-[12px] px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-[13px] px-3 py-1.5 gap-2 font-semibold',
  }

  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200'
  let IconComponent = Clock

  switch (status.toLowerCase()) {
    case 'verified':
    case 'pass':
      styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50'
      IconComponent = CheckCircle2
      break
    case 'settled':
    case 'released':
      styleClasses = 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/50'
      IconComponent = CheckCircle2
      break
    case 'active':
    case 'in_progress':
      styleClasses = 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50'
      IconComponent = Clock
      break
    case 'in_verification':
    case 'verifying':
      styleClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50'
      IconComponent = Sparkles
      break
    case 'staged_in_sandbox':
    case 'release_authorized':
      styleClasses = 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/50'
      IconComponent = CheckCircle2
      break
    case 'revision_requested':
    case 'needs_review':
      styleClasses = 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50'
      IconComponent = RefreshCw
      break
    case 'disputed':
    case 'fail':
      styleClasses = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50'
      IconComponent = ShieldAlert
      break
    case 'pending':
    case 'pending_acceptance':
    case 'draft':
    default:
      styleClasses = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      IconComponent = Clock
      break
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border transition-colors',
        sizeClasses[size],
        styleClasses,
        className
      )}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span className="capitalize">{displayLabel}</span>
    </span>
  )
}
