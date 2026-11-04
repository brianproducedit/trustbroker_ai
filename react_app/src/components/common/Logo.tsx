import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import portalLogo from '@/assets/trustbroker_portal_logo.png'
import publicLogo from '@/assets/trustbroker_public_logo.png'

interface LogoProps {
  className?: string
  isDark?: boolean
  hideSubtitle?: boolean
  linkToHome?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const Logo: React.FC<LogoProps> = ({
  className,
  isDark = false,
  hideSubtitle: _hideSubtitle = false,
  linkToHome = true,
  size = 'md',
}) => {
  const heights: Record<string, string> = { sm: 'h-7', md: 'h-9', lg: 'h-12' }
  const logoSrc = isDark ? portalLogo : publicLogo

  const content = (
    <div className={cn('flex items-center group cursor-pointer select-none', className)}>
      <img
        src={logoSrc}
        alt="TrustBroker AI"
        className={cn(heights[size], 'w-auto object-contain transition-transform group-hover:scale-105')}
        draggable={false}
      />
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
