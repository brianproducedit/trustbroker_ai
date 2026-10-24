import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/hooks/useAuthStore'

export const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={200}>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
