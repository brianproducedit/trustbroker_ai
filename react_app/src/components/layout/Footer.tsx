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
              The trust layer between clients and freelancers: AI-drafted contracts, PayPal-secured milestones and evidence-based verification.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-mono mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Built on the PayPal developer platform</span>
            </div>
          </div>

          {/* Product links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Product</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li>
                <Link to={ROUTES.HOW_IT_WORKS} className="hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link to={ROUTES.FOR_CLIENTS} className="hover:text-white transition-colors">
                  For clients
                </Link>
              </li>
              <li>
                <Link to={ROUTES.FOR_FREELANCERS} className="hover:text-white transition-colors">
                  For freelancers
                </Link>
              </li>
              <li>
                <Link to={ROUTES.SIGN_UP} className="hover:text-white transition-colors">
                  Create an account
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
                  href="https://console.groq.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Groq Cloud Docs</span>
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
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Trust</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
              <li>
                <span className="text-emerald-400 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  PayPal-secured milestones
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
            TrustBroker AI &copy; 2026. PayPal-secured milestone payments for clients and freelancers.
          </p>
          <div className="flex items-center gap-6 text-slate-400">
            <span>PayPal</span>
            <span>Groq &amp; OpenRouter</span>
            <span>AG Grid</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
