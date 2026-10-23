import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={cn('inline-flex flex-col items-center justify-center gap-2 p-2', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeMap[size])} />
      {text && <p className="text-xs text-slate-500 font-medium animate-pulse">{text}</p>}
    </div>
  )
}
