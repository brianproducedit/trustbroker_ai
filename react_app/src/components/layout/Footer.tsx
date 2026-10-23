import React from 'react'
import { Logo } from '@/components/common/Logo'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { ExternalLink, ShieldCheck } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0E1B35] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & mission */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Logo isDark />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Decoupling cross-border digital payments from subjective disputes through AI statement of work verification and PayPal Sandbox conditional release coordination.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-mono mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PayPal AI Hackathon Submission 2026</span>
            </div>
          </div>

          {/* Product links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Product</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li>
                <Link to={ROUTES.DASHBOARD} className="hover:text-white transition-colors">
                  Contract Ledger
                </Link>
              </li>
              <li>
                <Link to={ROUTES.HOME} className="hover:text-white transition-colors">
                  AI SOW Generator
                </Link>
              </li>
              <li>
                <Link to={ROUTES.DELIVERY_VERIFICATION('TB-2026-084')} className="hover:text-white transition-colors">
                  Evidence Verification
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ACTIVITY_HISTORY('TB-2026-084')} className="hover:text-white transition-colors">
                  Audit Activity Trail
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer resources */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Developers</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li>
                <Link to={ROUTES.DEVELOPER_PORTAL} className="hover:text-white transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <a
                  href="https://developer.paypal.com/docs/api/orders/v2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>PayPal Orders API</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://ai.google.dev/gemini-api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Gemini API Docs</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance & Trust */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Trust &amp; Demo</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li>
                <span className="text-emerald-400 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  PayPal Sandbox Connected
                </span>
              </li>
              <li>
                <span className="text-xs text-slate-400">
                  Tamper-proof event logging
                </span>
              </li>
              <li>
                <span className="text-xs text-slate-400">
                  Dual-party acceptance checks
                </span>
              </li>
              <li>
                <span className="text-xs text-slate-400">
                  Automated milestone releases
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer row */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            TrustBroker AI &copy; 2026. Built for the PayPal AI Hackathon. Prototype demonstration for conditional milestone disbursements.
          </p>
          <div className="flex items-center gap-6 text-slate-400">
            <span>PayPal Sandbox Integration</span>
            <span>Gemini AI Engine</span>
            <span>Lexend &amp; React 19</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
