import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const emailParam = searchParams.get('email') || 'your email address'
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleResend = () => {
    setIsResending(true)
    setTimeout(() => {
      setIsResending(false)
      setCanResend(false)
      setCountdown(30)
      toast.success('Verification email resent! Please check your inbox.')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-between font-sans">
      <header className="h-16 px-6 flex items-center justify-between border-b border-[#DDE4EF] bg-white">
        <Logo />
        <Link
          to={ROUTES.HOME}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Return to Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <Card className="w-full max-w-md shadow-sm border-[#DDE4EF] bg-white text-center">
          <CardHeader className="pb-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
              <Mail className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#1A2940]">Check Your Inbox</CardTitle>
            <CardDescription className="text-xs text-[#5D6B82] mt-1.5 leading-relaxed">
              We sent a verification link to <span className="font-semibold text-slate-800">{emailParam}</span>. Please click the link inside to activate your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Verify your identity to stage and release PayPal milestone payments.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Receive real-time AI verification results and milestone delivery updates.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Link to={ROUTES.SIGN_IN}>
                  Continue to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                variant="outline"
                disabled={!canResend || isResending}
                onClick={handleResend}
                className="w-full text-xs gap-2 border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {canResend ? 'Resend verification email' : `Resend available in ${countdown}s`}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-6 border-t border-slate-100 flex justify-center text-xs text-slate-500">
            Need help? Contact support@trustbroker.ai
          </CardFooter>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustBroker AI &bull; PayPal AI Hackathon Sandbox Prototype &bull; Verification
      </footer>
    </div>
  )
}

export default VerifyEmail
