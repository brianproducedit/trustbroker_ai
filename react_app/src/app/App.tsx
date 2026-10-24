import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export const App: React.FC = () => {
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
