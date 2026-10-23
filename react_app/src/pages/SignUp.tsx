import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { useContractStore } from '@/hooks/useContractStore'
import { Mail, Lock, User, Building2, ArrowRight } from 'lucide-react'

export const SignUp: React.FC = () => {
  const navigate = useNavigate()
  const { setActiveRole } = useContractStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer')
  const [agreed, setAgreed] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveRole(role)
    navigate(ROUTES.DASHBOARD)
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-between font-sans">
      <header className="h-16 px-6 flex items-center justify-between border-b border-[#DDE4EF] bg-white">
        <Logo />
        <Link to={ROUTES.HOME} className="text-xs font-medium text-slate-500 hover:text-slate-800">
          ← Return to Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#DDE4EF] p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-2xl font-bold text-[#1A2940]">Create Your Account</h1>
            <p className="text-xs text-[#5D6B82]">
              Join TrustBroker AI to coordinate contracts and conditional PayPal releases.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1A2940]">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                    role === 'buyer'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Project Buyer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('supplier')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                    role === 'supplier'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Supplier / Freelancer
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1A2940]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1A2940]">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Organization */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1A2940]">Organization (Optional)</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Acme Ventures Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1A2940]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the PayPal Sandbox testing terms and automated AI verification evaluation conditions.
              </span>
            </label>

            <button
              type="submit"
              disabled={!agreed}
              className="w-full h-10 mt-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to={ROUTES.SIGN_IN} className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustBroker AI &bull; PayPal AI Hackathon Sandbox Prototype
      </footer>
    </div>
  )
}
