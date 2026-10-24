import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/hooks/useAuthStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export const SignUp: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp } = useAuthStore()
  const roleParam = searchParams.get('role')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'client' | 'freelancer'>(
    roleParam === 'supplier' || roleParam === 'freelancer' ? 'freelancer' : 'client'
  )
  const [agreed, setAgreed] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (roleParam === 'supplier' || roleParam === 'freelancer') {
      setRole('freelancer')
    } else if (roleParam === 'buyer' || roleParam === 'client') {
      setRole('client')
    }
  }, [roleParam])

  const getStrength = (pass: string) => {
    let score = 0
    if (pass.length >= 8) score += 25
    if (/[A-Z]/.test(pass)) score += 25
    if (/[0-9]/.test(pass)) score += 25
    if (/[^A-Za-z0-9]/.test(pass)) score += 25
    return score
  }

  const strength = getStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!agreed) {
      setError('You must accept the terms to continue.')
      return
    }

    setIsLoading(true)
    const result = await signUp(email, password, {
      full_name: name,
      organization,
      role,
    })
    setIsLoading(false)

    if (result.success) {
      if (result.requiresConfirmation) {
        toast.success('Account created! Please check your email to verify.')
        navigate(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`)
      } else {
        toast.success('Account created and signed in successfully!')
        navigate(ROUTES.DASHBOARD)
      }
    } else {
      setError(result.error || 'Failed to create account. Please check your details.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-between font-sans">
      <header className="h-16 px-6 flex items-center justify-between border-b border-[#DDE4EF] bg-white">
        <Logo />
        <Link to={ROUTES.HOME} className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
          ← Return to Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <Card className="w-full max-w-md shadow-sm border-[#DDE4EF] bg-white">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl font-bold text-[#1A2940]">Create Your Account</CardTitle>
            <CardDescription className="text-xs text-[#5D6B82] mt-1">
              Join TrustBroker AI to coordinate contracts with conditional PayPal milestone payouts.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Primary Role Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A2940]">Primary Focus</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={role === 'client' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRole('client')}
                    className={`h-8 text-xs font-medium ${
                      role === 'client'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    I am Hiring (Client)
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'freelancer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRole('freelancer')}
                    className={`h-8 text-xs font-medium ${
                      role === 'freelancer'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    I am Delivering (Freelancer)
                  </Button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-name" className="text-xs font-semibold text-[#1A2940]">Full Name</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="pl-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-xs font-semibold text-[#1A2940]">Work Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="pl-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                  />
                </div>
              </div>

              {/* Organization */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-org" className="text-xs font-semibold text-[#1A2940]">
                  Organization / Studio <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Acme Ventures Ltd"
                    className="pl-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-xs font-semibold text-[#1A2940]">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-password"
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
                  <div className="pt-1">
                    <Progress value={strength} className="h-1.5" />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm" className="text-xs font-semibold text-[#1A2940]">Confirm Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 pr-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2 pt-1">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(Boolean(checked))}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  I agree to the Terms of Service, Privacy Policy, and PayPal Sandbox testing conditions.
                </label>
              </div>

              <Button
                type="submit"
                disabled={!agreed || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm h-10 gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-3 pb-6 border-t border-slate-100 flex justify-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to={ROUTES.SIGN_IN} className="text-blue-600 font-semibold hover:underline ml-1">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustBroker AI &bull; PayPal AI Hackathon Sandbox Prototype
      </footer>
    </div>
  )
}

export default SignUp
