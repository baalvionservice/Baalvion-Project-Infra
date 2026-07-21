"use client"

import React, { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { gatewayAuth } from '@/lib/auth/gateway-session'
import { ApiError } from '@baalvion/auth-sdk'

type VerifyState = 'verifying' | 'success' | 'error'

function VerifyEmailStatus() {
  const token = useSearchParams().get('token')
  const [state, setState] = useState<VerifyState>('verifying')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setState('error'); setError('This verification link is missing its token.'); return }
    gatewayAuth.verifyEmail(token)
      .then(() => setState('success'))
      .catch((err) => {
        setState('error')
        setError(err instanceof ApiError ? err.message : 'This verification link is invalid or expired.')
      })
  }, [token])

  if (state === 'verifying') {
    return (
      <div className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-green mx-auto animate-spin" />
        <p className="text-gray-500 text-sm">Verifying your email…</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 text-center space-y-4">
        <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto" />
        <p className="text-white font-bold">Email verified</p>
        <p className="text-sm text-gray-500">Your account is now fully verified.</p>
        <Link href="/auth/signin" className="inline-block text-brand-green text-xs font-bold uppercase tracking-widest hover:underline underline-offset-4">
          Continue to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 text-center space-y-4">
      <XCircle className="w-10 h-10 text-semantic-error mx-auto" />
      <p className="text-white font-bold">Verification failed</p>
      <p className="text-sm text-gray-500">{error}</p>
      <Link href="/auth/signin" className="inline-block text-brand-green text-xs font-bold uppercase tracking-widest hover:underline underline-offset-4">
        Back to Sign In
      </Link>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#39FF14 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest z-10">
        <ChevronLeft className="w-4 h-4" /> Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-10 relative z-10"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#39FF14] to-[#3B82F6] flex items-center justify-center text-black font-bold text-2xl">MU</div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">Verify Email</h1>
        </div>

        <Suspense fallback={<div className="text-center text-gray-500 text-sm">Loading…</div>}>
          <VerifyEmailStatus />
        </Suspense>
      </motion.div>
    </div>
  )
}
