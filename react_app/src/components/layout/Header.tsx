import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { Menu, X, ArrowRight, User } from 'lucide-react'

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'For Buyers', href: '#for-buyers' },
    { label: 'For Suppliers', href: '#for-suppliers' },
    { label: 'Developers', to: ROUTES.DEVELOPER_PORTAL },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#DDE4EF]">
      <div className="h-[68px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            if (link.to) {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-[#5D6B82] hover:text-[#1A2940]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            }
            return (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#5D6B82] hover:text-[#1A2940] transition-colors"
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        {/* CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to={ROUTES.SIGN_IN}
            className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-[#DDE4EF] bg-white text-sm font-medium text-[#1A2940] hover:bg-slate-50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to={ROUTES.DASHBOARD}
            className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all hover:gap-2"
          >
            <span>Live Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to={ROUTES.SIGN_IN}
            className="p-2 text-slate-600 hover:text-slate-900"
            aria-label="Account"
          >
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#DDE4EF] bg-white px-4 pt-3 pb-6 flex flex-col gap-3 shadow-lg">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href || link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700 py-2 hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to={ROUTES.SIGN_IN}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.DASHBOARD}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-10 inline-flex items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
            >
              Launch Dashboard Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
