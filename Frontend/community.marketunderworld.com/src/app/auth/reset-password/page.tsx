"use client"

import React, { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { gatewayAuth } from '@/lib/auth/gateway-session'
import { ApiError } from '@baalvion/auth-sdk'

function ResetPasswordForm() {
  const token = useSearchParams().get('token')
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsSubmitting(true)
    try {
      await gatewayAuth.resetPassword(token, password)
      toast({ title: 'Password reset', description: 'You can now sign in with your new password.' })
      router.push('/auth/signin')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "That reset link is invalid or expired."
      toast({ variant: 'destructive', title: "Couldn't reset password", description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 text-center space-y-4">
        <p className="text-white font-bold">Invalid link</p>
        <p className="text-sm text-gray-500">This reset link is missing its token. Request a new one below.</p>
        <Link href="/auth/forgot-password" className="inline-block text-brand-green text-xs font-bold uppercase tracking-widest hover:underline underline-offset-4">
          Request New Link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
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
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  )
}

export default function ResetPassword() {
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
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">New Password</h1>
          <p className="text-sm text-gray-500 font-medium text-center">Choose a new password for your account.</p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-500 text-sm">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
