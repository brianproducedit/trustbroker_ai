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
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const SignIn: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, setActiveRole } = useAuthStore()

  const roleParam = searchParams.get('role')
  const redirectParam = searchParams.get('redirect')

  const initialRole: 'client' | 'freelancer' =
    roleParam === 'supplier' || roleParam === 'freelancer' ? 'freelancer' : 'client'

  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer'>(initialRole)
  const [email, setEmail] = useState(
    initialRole === 'freelancer' ? 'tariro@devstudio.co.zw' : 'elena@acmeglobal.com'
  )
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (roleParam === 'supplier' || roleParam === 'freelancer') {
      setSelectedRole('freelancer')
      setEmail('tariro@devstudio.co.zw')
    } else if (roleParam === 'buyer' || roleParam === 'client') {
      setSelectedRole('client')
      setEmail('elena@acmeglobal.com')
    }
  }, [roleParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setActiveRole(selectedRole)
    const result = await signIn(email, password)
    setIsLoading(false)

    if (result.success) {
      const roleName = selectedRole === 'client' ? 'Client' : 'Freelancer'
      toast.success(`Signed in successfully as ${roleName}!`)
      navigate(redirectParam ? decodeURIComponent(redirectParam) : ROUTES.DASHBOARD)
    } else {
      toast.error(result.error || 'Failed to sign in. Please check your credentials.')
    }
  }

  const handleQuickFill = (role: 'client' | 'freelancer') => {
    setSelectedRole(role)
    setActiveRole(role)
    if (role === 'client') {
      setEmail('elena@acmeglobal.com')
      setPassword('password123')
    } else {
      setEmail('tariro@devstudio.co.zw')
      setPassword('password123')
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-[#DDE4EF] bg-white">
        <Logo />
        <Link
          to={ROUTES.HOME}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <Card className="w-full max-w-md shadow-sm border-[#DDE4EF] bg-white">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl font-bold text-[#1A2940]">Sign In</CardTitle>
            <CardDescription className="text-xs text-[#5D6B82] mt-1">
              Access your contracts, staged milestone funds, and verification reports.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Quick Demo Test Logins */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                <span>Demo Accounts:</span>
                <span className="text-blue-600 font-semibold text-[10px]">1-Click Quick Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedRole === 'client' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFill('client')}
                  className={`h-8 text-xs font-medium justify-center gap-1.5 ${
                    selectedRole === 'client'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Client (Elena)</span>
                </Button>

                <Button
                  type="button"
                  variant={selectedRole === 'freelancer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFill('freelancer')}
                  className={`h-8 text-xs font-medium justify-center gap-1.5 ${
                    selectedRole === 'freelancer'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Freelancer (Tariro)</span>
                </Button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="text-xs font-semibold text-[#1A2940]">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="pl-9 bg-slate-50 border-slate-200 text-sm focus-visible:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password" className="text-xs font-semibold text-[#1A2940]">
                    Password
                  </Label>
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signin-password"
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
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  />
                  <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer select-none">
                    Remember this device
                  </label>
                </div>

                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SSL Protected
                </span>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm h-10 gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In as {selectedRole === 'client' ? 'Client' : 'Freelancer'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-3 pb-6 border-t border-slate-100 flex justify-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <Link to={ROUTES.SIGN_UP} className="text-blue-600 font-semibold hover:underline ml-1">
              Create an account
            </Link>
          </CardFooter>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustBroker AI &bull; PayPal AI Hackathon Sandbox Prototype &bull; Secure Authentication
      </footer>
    </div>
  )
}

export default SignIn
