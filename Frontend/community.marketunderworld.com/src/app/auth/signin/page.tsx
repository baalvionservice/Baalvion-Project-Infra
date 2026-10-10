
"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ChevronLeft, Lock, Loader2, Skull } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'
import { isAdminIdentity } from '@/lib/auth/gateway-session'
import { ApiError } from '@baalvion/auth-sdk'

// Allowlist for the post-login OAuth bounce-back. Two legitimate shapes reach here:
//  1. oauth-service's own /oauth/authorize (cross-origin, absolute) — its interactive-login
//     redirect lands here first since /oauth/authorize needs the hub session cookie, which
//     is scoped to baalvion.com and invisible on marketunderworld.com. We never navigate to
//     it directly; its params get decomposed and forwarded to our own /api/oauth-bridge,
//     which can read this site's httpOnly access_token cookie server-side and complete the
//     exchange itself.
//  2. our own /api/oauth-bridge (same-origin, relative) — the bridge's loop-back when it
//     found no cookie the first time (e.g. cookie expired mid-flow); just re-enter it as-is.
// Anything else is treated as an open-redirect attempt and ignored.
function isOAuthServiceAuthorizeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.pathname.endsWith('/oauth/authorize')
    )
  } catch {
    return false
  }
}

function isOwnOAuthBridgePath(path: string): boolean {
  return path.startsWith('/api/oauth-bridge?') || path === '/api/oauth-bridge'
}

const FORWARDED_OAUTH_PARAMS = ['client_id', 'redirect_uri', 'scope', 'state', 'code_challenge', 'code_challenge_method', 'nonce']

function toBridgeUrl(oauthAuthorizeUrl: string): string {
  const source = new URL(oauthAuthorizeUrl)
  const bridge = new URL('/api/oauth-bridge', window.location.origin)
  for (const key of FORWARDED_OAUTH_PARAMS) {
    const value = source.searchParams.get(key)
    if (value) bridge.searchParams.set(key, value)
  }
  return bridge.toString()
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
      const identity = await login(email, password)
      toast({ title: "Access Granted", description: "Welcome back to the network." })

      // OAuth bounce-back — see the allowlist functions above for the two legitimate shapes.
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      if (redirect && isOAuthServiceAuthorizeUrl(redirect)) {
        window.location.href = toBridgeUrl(redirect)
        return
      }
      if (redirect && isOwnOAuthBridgePath(redirect)) {
        window.location.href = redirect
        return
      }

      router.push(isAdminIdentity(identity) ? '/admin' : '/bounty')
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-900 to-black border-2 border-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <Skull className="w-10 h-10 animate-pulse text-red-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500 uppercase italic drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">Sign In</h1>
          <p className="text-sm text-red-500/70 font-medium">Access your Market Underworld node.</p>
        </div>

        <div className="bg-red-950/30 border border-red-600/50 p-4 rounded-xl text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
           <p className="text-[11px] text-red-400 font-mono leading-relaxed relative z-10 uppercase tracking-wide">
             ⚠️ <strong className="text-red-500">ATTENTION HACKERS:</strong> Whoever can crack any password on this website and fix the bugs will be awarded <strong className="text-white">$500 in BTC</strong>. Take the challenge and enter.
           </p>
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
            <div className="flex items-center justify-between ml-1">
              <label htmlFor="password" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
              <Link href="/auth/forgot-password" className="text-[10px] font-bold text-brand-green hover:underline underline-offset-4">Forgot?</Link>
            </div>
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
