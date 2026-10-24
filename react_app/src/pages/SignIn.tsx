import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { useContractStore } from '@/hooks/useContractStore'
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react'

export const SignIn: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useContractStore()

  const roleParam = searchParams.get('role') as 'buyer' | 'supplier' | null
  const redirectParam = searchParams.get('redirect')

  const [selectedRole, setSelectedRole] = useState<'buyer' | 'supplier'>(
    roleParam === 'supplier' ? 'supplier' : 'buyer'
  )
  const [email, setEmail] = useState(
    roleParam === 'supplier' ? 'tariro@devstudio.co.zw' : 'elena@acmeglobal.com'
  )
  const [password, setPassword] = useState('••••••••••••')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (roleParam === 'supplier') {
      setSelectedRole('supplier')
      setEmail('tariro@devstudio.co.zw')
    } else if (roleParam === 'buyer') {
      setSelectedRole('buyer')
      setEmail('elena@acmeglobal.com')
    }
  }, [roleParam])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      login(selectedRole)
      setIsLoading(false)
      navigate(redirectParam || ROUTES.DASHBOARD)
    }, 400)
  }

  const handleQuickFill = (role: 'buyer' | 'supplier') => {
    setSelectedRole(role)
    if (role === 'buyer') {
      setEmail('elena@acmeglobal.com')
    } else {
      setEmail('tariro@devstudio.co.zw')
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
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#DDE4EF] p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold text-[#1A2940]">Sign in to TrustBroker</h1>
            <p className="text-xs text-[#5D6B82]">
              Access your contracts, PayPal Sandbox reserves, and verification assessments.
            </p>
          </div>

          {/* Quick Demo Role Fill Selector */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-medium px-1">
              <span>Quick Demo Fill:</span>
              <span className="text-blue-600 font-semibold">1-Click Test Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('buyer')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  selectedRole === 'buyer'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Buyer (Elena)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('supplier')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  selectedRole === 'supplier'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Supplier (Tariro)</span>
              </button>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1A2940]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1A2940]">Password</label>
                <a href="#forgot" className="text-xs text-blue-600 hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>Remember this session</span>
              </label>
              <span className="text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSL Protected
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole === 'buyer' ? 'Buyer' : 'Supplier'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create Account link */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <Link to={ROUTES.SIGN_UP} className="text-blue-600 font-semibold hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>

      {/* Simplified Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustBroker AI &bull; PayPal AI Hackathon Sandbox Prototype &bull; Secure Authentication
      </footer>
    </div>
  )
}
