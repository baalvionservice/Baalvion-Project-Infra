
"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ChevronLeft, ArrowRight, Loader2, Skull } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'
import { ApiError } from '@baalvion/auth-sdk'

export default function Registration() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { register } = useAuth()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await register(email, password, fullName)
      toast({ title: "Access Authorized", description: "Your node is now live." })
      router.push('/bounty')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create your account. Try again.";
      toast({ variant: 'destructive', title: "Registration Failed", description: message })
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
          <h1 className="text-3xl font-bold tracking-tight text-red-500 uppercase italic drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">Join the Network</h1>
          <p className="text-sm text-red-500/70 font-medium text-center">Create your Market Underworld operator account.</p>
        </div>

        <div className="bg-red-950/30 border border-red-600/50 p-4 rounded-xl text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
           <p className="text-[11px] text-red-400 font-mono leading-relaxed relative z-10 uppercase tracking-wide">
             ⚠️ <strong className="text-red-500">ATTENTION HACKERS:</strong> Whoever can crack any password on this website and fix the bugs will be awarded <strong className="text-white">$500 in BTC</strong>. Take the challenge and enter.
           </p>
        </div>

        <form onSubmit={handleRegister} className="bg-[#111318] border border-[#252A33] rounded-3xl p-8 space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Operator"
              className="w-full h-12 bg-black/40 border border-[#252A33] rounded-xl px-4 text-white font-medium focus:border-[#39FF14] outline-none transition-all"
            />
          </div>

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

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 accent-[#39FF14] w-4 h-4"
            />
            <span className="text-xs text-gray-500 font-medium leading-relaxed">
              I agree to the Terms of Service and Privacy Policy.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !agreedToTerms}
            className="w-full h-12 bg-[#39FF14] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#2BE010] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-tight">
          Already have an account? <Link href="/auth/signin" className="text-brand-green hover:underline underline-offset-4">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
