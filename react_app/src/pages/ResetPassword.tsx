import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password strength calculation
  const getStrength = (pass: string) => {
    let score = 0
    if (pass.length >= 8) score += 25
    if (/[A-Z]/.test(pass)) score += 25
    if (/[0-9]/.test(pass)) score += 25
    if (/[^A-Za-z0-9]/.test(pass)) score += 25
    return score
  }

  const strength = getStrength(password)

  const getStrengthLabel = (score: number) => {
    if (score <= 25) return { label: 'Weak', color: 'text-red-500' }
    if (score <= 50) return { label: 'Fair', color: 'text-amber-500' }
    if (score <= 75) return { label: 'Good', color: 'text-blue-500' }
    return { label: 'Strong', color: 'text-emerald-500' }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      toast.success('Your password has been reset successfully!')
      setTimeout(() => {
        navigate(ROUTES.SIGN_IN)
      }, 1500)
    }, 750)
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-between font-sans">
      <header className="h-16 px-6 flex items-center justify-between border-b border-[#DDE4EF] bg-white">
        <Logo />
        <Link
          to={ROUTES.SIGN_IN}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Return to Sign In
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <Card className="w-full max-w-md shadow-sm border-[#DDE4EF] bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-[#1A2940]">Set New Password</CardTitle>
            <CardDescription className="text-xs text-[#5D6B82] mt-1">
              Choose a strong, unique password to secure your account and contract authorizations.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-800">Password Updated!</h3>
                  <p className="text-xs text-slate-500">
                    Redirecting you to the sign-in page...
                  </p>
                </div>
                <Button
                  onClick={() => navigate(ROUTES.SIGN_IN)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                >
                  Proceed to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold text-[#1A2940]">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-9 pr-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Password strength:</span>
                        <span className={`font-medium ${getStrengthLabel(strength).color}`}>
                          {getStrengthLabel(strength).label}
                        </span>
                      </div>
                      <Progress value={strength} className="h-1.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#1A2940]">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-9 pr-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      Update Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-2 pb-6 border-t border-slate-100 flex justify-center text-xs text-slate-600">
            Never mind?{' '}
            <Link to={ROUTES.SIGN_IN} className="text-blue-600 font-semibold hover:underline ml-1">
              Back to Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustBroker AI &bull; PayPal AI Hackathon Sandbox Prototype &bull; Security
      </footer>
    </div>
  )
}

export default ResetPassword
