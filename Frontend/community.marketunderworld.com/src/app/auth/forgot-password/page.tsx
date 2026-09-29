"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { gatewayAuth } from '@/lib/auth/gateway-session'
import { ApiError } from '@baalvion/auth-sdk'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await gatewayAuth.forgotPassword(email)
      // Always show success, regardless of whether the email exists — never leak account existence.
      setSent(true)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't send reset email. Try again."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#39FF14 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <Link href="/auth/signin" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest z-10">
        <ChevronLeft className="w-4 h-4" /> Back to Sign In
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-10 relative z-10"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#39FF14] to-[#3B82F6] flex items-center justify-center text-black font-bold text-2xl">MU</div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">Reset Password</h1>
          <p className="text-sm text-gray-500 font-medium text-center">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto" />
            <p className="text-white font-bold">Check your inbox</p>
            <p className="text-sm text-gray-500">If an account exists for {email}, a reset link is on its way.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 space-y-6">
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

            {error && <p className="text-xs text-semantic-error font-medium">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#39FF14] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#2BE010] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
