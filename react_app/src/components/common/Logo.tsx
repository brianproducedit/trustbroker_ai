import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  isDark?: boolean
  hideSubtitle?: boolean
  linkToHome?: boolean
}

export const Logo: React.FC<LogoProps> = ({
  className,
  isDark = false,
  hideSubtitle = false,
  linkToHome = true,
}) => {
  const content = (
    <div className={cn('flex items-center gap-2.5 group cursor-pointer select-none', className)}>
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
          isDark
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'bg-[#0E1B35] text-white shadow-sm'
        )}
      >
        <ShieldCheck className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            'text-[17px] font-bold tracking-tight leading-none',
            isDark ? 'text-white' : 'text-[#1A2940]'
          )}
        >
          TrustBroker<span className="text-blue-500">.ai</span>
        </span>
        {!hideSubtitle && (
          <span
            className={cn(
              'text-[10px] font-mono uppercase tracking-wider mt-0.5 leading-tight font-medium',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )}
          >
            AI Verification
          </span>
        )}
      </div>
    </div>
  )

  if (linkToHome) {
    return (
      <Link to={ROUTES.HOME} className="inline-flex items-center no-underline">
        {content}
      </Link>
    )
  }

  return content
}
