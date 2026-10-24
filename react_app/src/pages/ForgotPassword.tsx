import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Mail, ArrowLeft, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      toast.success('Password reset link sent! Please check your inbox.')
    }, 750)
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-between font-sans">
      <header className="h-16 px-6 flex items-center justify-between border-b border-[#DDE4EF] bg-white">
        <Logo />
        <Link
          to={ROUTES.SIGN_IN}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <Card className="w-full max-w-md shadow-sm border-[#DDE4EF] bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-[#1A2940]">Reset Password</CardTitle>
            <CardDescription className="text-xs text-[#5D6B82] mt-1">
              Enter your work email and we will send you a secure link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSubmitted ? (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-sm font-semibold">Check your email</AlertTitle>
                  <AlertDescription className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    If an account exists for <span className="font-semibold text-emerald-900">{email}</span>, you will receive password reset instructions shortly.
                  </AlertDescription>
                </Alert>

                <p className="text-xs text-slate-500 text-center">
                  Did not receive an email? Check your spam folder or try again in 5 minutes.
                </p>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Try another email address
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-[#1A2940]">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="pl-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-2 pb-6 border-t border-slate-100 flex justify-center text-xs text-slate-600">
            Remember your credentials?{' '}
            <Link to={ROUTES.SIGN_IN} className="text-blue-600 font-semibold hover:underline ml-1">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustBroker AI &bull; PayPal AI Hackathon Sandbox Prototype &bull; Account Recovery
      </footer>
    </div>
  )
}

export default ForgotPassword
