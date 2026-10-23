import React from 'react'
import { Info, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SandboxBannerProps {
  isDark?: boolean
  className?: string
  compact?: boolean
}

export const SandboxBanner: React.FC<SandboxBannerProps> = ({
  isDark = false,
  className,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1 text-xs rounded border',
          isDark
            ? 'bg-slate-900/80 border-slate-700/60 text-slate-300'
            : 'bg-blue-50/70 border-blue-200 text-blue-900',
          className
        )}
      >
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
        <span className="font-mono text-[11px] font-medium tracking-wide uppercase">
          PayPal Sandbox • Demo Mode
        </span>
      </div>
    )
  }

  return (
    <aside
      aria-label="Institutional Sandbox Disclaimer"
      className={cn(
        'relative overflow-hidden px-4 py-2.5 text-xs flex items-center justify-between gap-4 border',
        isDark
          ? 'bg-[#131B2E] border-slate-800 text-slate-300'
          : 'bg-[#F8FAFC] border-[#DDE4EF] text-[#5D6B82]',
        className
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
      <div className="flex items-center gap-2.5 pl-1.5 flex-1">
        <Info className={cn('w-4 h-4 flex-shrink-0', isDark ? 'text-blue-400' : 'text-blue-600')} />
        <p className="leading-relaxed">
          <strong
            className={cn(
              'font-semibold uppercase tracking-wider font-mono mr-2',
              isDark ? 'text-blue-300' : 'text-blue-700'
            )}
          >
            PayPal Sandbox Demo
          </strong>
          TrustBroker AI coordinates conditional payment releases against verified deliverables using PayPal Sandbox. Not a licensed banking or fiduciary escrow institution.
        </p>
      </div>
      <a
        href="https://developer.paypal.com"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'hidden sm:inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-1 rounded transition-colors whitespace-nowrap',
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
        )}
      >
        <span>PayPal Dev Docs</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </aside>
  )
}
