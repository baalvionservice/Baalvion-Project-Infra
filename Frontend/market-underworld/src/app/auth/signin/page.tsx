
"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ChevronLeft, Lock, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'
import { ApiError } from '@baalvion/auth-sdk'

// Allowlist for the post-login OAuth bounce-back — must be exactly oauth-service's
// public authorize endpoint, never an arbitrary attacker-supplied destination. This is
// never navigated to directly: oauth-service's /oauth/authorize needs the hub session
// cookie, which is scoped to baalvion.com and invisible here on marketunderworld.com.
// Instead we route through our own same-origin /api/oauth-bridge, which can read this
// site's httpOnly access_token cookie server-side and complete the exchange itself.
function isSafeOAuthRedirect(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'api.baalvion.com' &&
      parsed.pathname.endsWith('/oauth/authorize')
    )
  } catch {
    return false
  }
}

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await login(email, password)
      toast({ title: "Access Granted", description: "Welcome back to the network." })

      // OAuth bounce-back: satellite apps (e.g. the NodeBB forum) send users here via
      // oauth-service's /oauth/authorize interactive-login redirect, with ?redirect= pointing
      // back to that same authorize endpoint. Only ever follow it if it's actually that
      // endpoint — anything else is treated as an open-redirect attempt and ignored. Routed
      // through our own /api/oauth-bridge (see isSafeOAuthRedirect above for why).
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      if (redirect && isSafeOAuthRedirect(redirect)) {
        window.location.href = `/api/oauth-bridge?target=${encodeURIComponent(redirect)}`
        return
      }

      router.push('/app/home')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid credentials. Try again.";
      toast({ variant: 'destructive', title: "Authentication Failed", description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#39FF14 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest z-10">
        <ChevronLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-10 relative z-10"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#39FF14] to-[#3B82F6] flex items-center justify-center text-black font-bold text-2xl">MU</div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">Sign In</h1>
          <p className="text-sm text-gray-500 font-medium">Access your Market Underworld node.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-12 bg-black/40 border border-[#252A33] rounded-xl px-4 text-white font-medium focus:border-[#39FF14] outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-12 bg-black/40 border border-[#252A33] rounded-xl px-4 pr-12 text-white font-medium focus:border-[#39FF14] outline-none transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#39FF14] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#2BE010] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {isSubmitting ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-tight">
          Don&apos;t have an account? <Link href="/auth/registration" className="text-brand-green hover:underline underline-offset-4">Sign up</Link>
        </p>
      </motion.div>
    </div>
  )
}
