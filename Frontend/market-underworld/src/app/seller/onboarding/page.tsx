"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Store, 
  Package, 
  ShieldCheck, 
  Wallet, 
  FileText, 
  Rocket, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Camera,
  Plus,
  X,
  Sparkles,
  Info,
  Clock,
  Shield
} from 'lucide-react'
import { NexusButton } from '@/components/ui/nexus-button'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STEPS = [
  "Welcome", "Store", "Appearance", "Product", "Identity", "Crypto", "Policies", "Launch"
]

export default function SellerOnboarding() {
  const [step, setStep] = useState(0)
  const [isLaunched, setIsLaunched] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setAnswers] = useState({
    storeName: '',
    storeTagline: '',
    category: [] as string[],
    region: 'South Asia',
    logo: null,
    banner: null,
    color: '#00E676',
    description: '',
    productName: '',
    price: '',
    stock: '',
    payoutCoin: 'ETH',
    payoutSchedule: 'Weekly'
  })

  const nextStep = () => setStep(s => Math.min(s + 1, 7))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-[#00E676]/20">
      {/* Progress Bar */}
      {step > 0 && !isLaunched && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#0D0D14] border-b border-white/5 z-50 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E676] to-[#00BCD4] flex items-center justify-center text-black font-bold text-xs">NX</div>
            <span className="font-bold text-sm hidden sm:block">Seller Onboarding</span>
          </div>
          
          <div className="flex-1 max-w-xl mx-12 hidden md:block">
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2">
                {STEPS.map((s, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#00E676]' : 'bg-white/5'}`} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Step {step} of 7</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Save & Exit</button>
          </div>
        </header>
      )}

      <main className="pt-24 pb-32 px-6">
        <AnimatePresence mode="wait">
          {step === 0 && <WelcomeScreen onStart={() => setStep(1)} />}
          {step === 1 && <StoreBasics key="s1" data={formData} setAnswers={setAnswers} onNext={nextStep} onPrev={prevStep} />}
          {step === 2 && <StoreAppearance key="s2" data={formData} setAnswers={setAnswers} onNext={nextStep} onPrev={prevStep} />}
          {step === 3 && <FirstProduct key="s3" data={formData} setAnswers={setAnswers} onNext={nextStep} onPrev={prevStep} />}
          {step === 4 && <IdentityVerification key="s4" data={formData} setAnswers={setAnswers} onNext={nextStep} onPrev={prevStep} />}
          {step === 5 && <CryptoSetup key="s5" data={formData} setAnswers={setAnswers} onNext={nextStep} onPrev={prevStep} />}
          {step === 6 && <StorePolicies key="s6" data={formData} setAnswers={setAnswers} onNext={nextStep} onPrev={prevStep} />}
          {step === 7 && <LaunchReview key="s7" data={formData} onLaunch={() => setIsLaunched(true)} onPrev={prevStep} />}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isLaunched && (
          <div className="fixed inset-0 z-[100] bg-[#050508]/95 flex items-center justify-center p-6 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-lg w-full text-center space-y-12"
            >
              <div className="relative">
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-32 h-32 bg-[#00E676]/10 rounded-[2.5rem] flex items-center justify-center text-[#00E676] mx-auto shadow-2xl shadow-[#00E676]/20 border border-[#00E676]/30"
                >
                  <Rocket className="w-16 h-16" />
                </motion.div>
                <div className="absolute top-0 right-0">✨</div>
                <div className="absolute bottom-0 left-0">🎉</div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">Store Submitted! 🚀</h2>
                <p className="text-gray-400 text-lg">{formData.storeName || 'Your store'} is now under review by our team.</p>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-400 font-medium text-sm">
                  Estimated live time: ~2 hours
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <NexusButton className="bg-[#00E676] text-black h-14 text-lg font-bold" onClick={() => router.push('/admin/seller')}>Go to Seller Dashboard</NexusButton>
                <NexusButton variant="outline" className="h-14 font-bold border-white/10" onClick={() => router.push('/')}>Return to Homepage</NexusButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center pt-12"
    >
      <div className="space-y-10">
        <NexusBadge className="bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20 px-5 py-2">🏪 Become a NEXUS Seller</NexusBadge>
        <h1 className="text-6xl font-bold leading-[1.1] tracking-tight">
          Turn Your Products Into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-[#00BCD4]">Global Revenue.</span>
        </h1>
        <p className="text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
          Join 1,247 sellers earning crypto from 3,430 active buyers across 7 global regions. Setup takes under 10 minutes.
        </p>
        
        <div className="grid grid-cols-2 gap-6">
          <NexusCard className="p-6 bg-white/5 border-white/5 space-y-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Avg Earnings</div>
            <div className="text-2xl font-bold">0.84 ETH<span className="text-xs text-gray-500 ml-1">/mo</span></div>
          </NexusCard>
          <NexusCard className="p-6 bg-white/5 border-white/5 space-y-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Platform Fee</div>
            <div className="text-2xl font-bold">20%<span className="text-xs text-gray-500 ml-1">Flat</span></div>
          </NexusCard>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
          <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E676]" /> Verified Program</span>
          <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E676]" /> Crypto Payouts</span>
          <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E676]" /> 49 Countries</span>
        </div>

        <NexusButton onClick={onStart} className="px-12 h-16 text-lg font-bold bg-[#00E676] text-black shadow-2xl shadow-[#00E676]/20">🚀 Start Selling Now</NexusButton>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-[#00E676]/5 blur-[100px] rounded-full" />
        <NexusCard className="p-10 border-[#00E676]/20 bg-white/[0.02] relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00E676]/20 flex items-center justify-center text-[#00E676]">TG</div>
              <div>
                <div className="font-bold">TechGadgets Store</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Electronics • Verified ✅</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400">4.28 ETH</div>
              <div className="text-[9px] text-gray-500 uppercase">Total Earned</div>
            </div>
          </div>
          <div className="h-px bg-white/5" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Growth Curve</div>
            <div className="text-emerald-500 font-bold text-sm">↑ +23%</div>
          </div>
        </NexusCard>
      </div>
    </motion.div>
  )
}

function StoreBasics({ data, setAnswers, onNext, onPrev }: any) {
  const [slug, setSlug] = useState('')

  useEffect(() => {
    setSlug(data.storeName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''))
  }, [data.storeName])

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-12"
    >
      <div className="space-y-2">
        <h2 className="text-4xl font-bold">🏪 Create Your Store</h2>
        <p className="text-gray-500">First, let's set up your store's identity</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Store Name</label>
          <Input 
            value={data.storeName}
            onChange={(e) => setAnswers({ ...data, storeName: e.target.value })}
            placeholder="e.g. TechGadgets Store"
            className="h-14 text-lg font-bold bg-black/40 border-white/10 focus:border-[#00E676]/50" 
          />
          {slug && (
            <div className="text-[10px] font-bold text-gray-500">
              Your store URL will be: <span className="text-[#00E676]">nexus.io/store/{slug}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Short Tagline</label>
          <Input 
            value={data.storeTagline}
            onChange={(e) => setAnswers({ ...data, storeTagline: e.target.value })}
            placeholder="e.g. Premium Electronics & Gadgets"
            className="h-14 bg-black/40 border-white/10" 
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Primary Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {['Electronics', 'Fashion', 'Food', 'Books', 'Sports', 'Home'].map(cat => (
              <button
                key={cat}
                onClick={() => setAnswers({ ...data, category: [cat] })}
                className={`p-4 rounded-2xl border transition-all text-sm font-bold ${data.category.includes(cat) ? 'bg-[#00E676]/10 border-[#00E676] text-[#00E676]' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 flex gap-4">
        <NexusButton variant="outline" className="flex-1 h-14 border-white/10" onClick={onPrev}><ArrowLeft className="w-4 h-4 mr-2" /> Back</NexusButton>
        <NexusButton className="flex-[2] h-14 bg-[#00E676] text-black font-bold" disabled={!data.storeName} onClick={onNext}>Continue <ArrowRight className="w-4 h-4 ml-2" /></NexusButton>
      </div>
    </motion.div>
  )
}

function StoreAppearance({ data, setAnswers, onNext, onPrev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12"
    >
      <div className="lg:col-span-7 space-y-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold">🎨 Design Your Store</h2>
          <p className="text-gray-500">Make your store stand out to buyers</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Store Logo</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-[#00E676]/50 transition-colors">
                <Camera className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Upload a square logo. <br />PNG, JPG up to 2MB.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Brand Color</label>
            <div className="flex gap-3">
              {['#00E676', '#6C63FF', '#00D4FF', '#FF9500', '#FF6584', '#FFD600'].map(c => (
                <button
                  key={c}
                  onClick={() => setAnswers({ ...data, color: c })}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${data.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">About Your Store</label>
            <div className="relative">
              <Textarea 
                value={data.description}
                onChange={(e) => setAnswers({ ...data, description: e.target.value })}
                className="bg-black/40 border-white/10 min-h-[150px] font-medium"
                placeholder="Tell buyers what makes your store unique..."
              />
              <button 
                onClick={() => setAnswers({ ...data, description: "TechGadgets Store is your premier destination for cutting-edge electronics and gadgets. We specialize in..." })}
                className="absolute right-4 bottom-4 flex items-center gap-2 text-[10px] font-bold text-[#00E676] bg-[#00E676]/10 px-3 py-1.5 rounded-lg hover:bg-[#00E676]/20 transition-all"
              >
                <Sparkles className="w-3 h-3" /> Write with AI
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 flex gap-4">
          <NexusButton variant="outline" className="flex-1 h-14 border-white/10" onClick={onPrev}>Back</NexusButton>
          <NexusButton className="flex-[2] h-14 bg-[#00E676] text-black font-bold" onClick={onNext}>Continue</NexusButton>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-32 space-y-6">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Live Preview</div>
          <NexusCard className="overflow-hidden border-white/10 bg-white/[0.02]">
            <div className="h-24 w-full bg-gradient-to-r opacity-40" style={{ backgroundImage: `linear-gradient(to right, ${data.color}, #000)` }} />
            <div className="p-8 -mt-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-[1.5rem] bg-white/10 border-4 border-[#050508] mx-auto flex items-center justify-center font-bold text-2xl" style={{ color: data.color }}>
                {data.storeName ? data.storeName.charAt(0) : 'S'}
              </div>
              <div>
                <h3 className="text-xl font-bold">{data.storeName || 'Your Store Name'}</h3>
                <p className="text-xs text-gray-500 italic mt-1">"{data.storeTagline || 'Add your tagline...'}"</p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <NexusBadge variant="success" className="bg-emerald-500/10 text-emerald-400 border-none">NEW SELLER</NexusBadge>
                <NexusBadge variant="info" className="bg-blue-500/10 text-blue-400 border-none">{data.region}</NexusBadge>
              </div>
            </div>
          </NexusCard>
        </div>
      </div>
    </motion.div>
  )
}

function FirstProduct({ data, setAnswers, onNext, onPrev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-12"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold">📦 Add First Product</h2>
          <p className="text-gray-500">Let's get your shop started with one item</p>
        </div>
        <button onClick={onNext} className="text-xs font-bold text-gray-500 hover:text-white mt-4">Skip for now →</button>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
          <Input 
            value={data.productName}
            onChange={(e) => setAnswers({ ...data, productName: e.target.value })}
            placeholder="e.g. iPhone 16 Pro 256GB"
            className="h-14 bg-black/40 border-white/10" 
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Price (USDT)</label>
            <Input 
              value={data.price}
              onChange={(e) => setAnswers({ ...data, price: e.target.value })}
              placeholder="1200"
              className="h-14 bg-black/40 border-white/10 font-bold" 
            />
            {data.price && <div className="text-[9px] text-gray-500 font-bold uppercase">≈ {(Number(data.price) / 2900).toFixed(4)} ETH</div>}
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stock</label>
            <Input 
              value={data.stock}
              onChange={(e) => setAnswers({ ...data, stock: e.target.value })}
              placeholder="10"
              className="h-14 bg-black/40 border-white/10 font-bold" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Product Images</label>
          <div className="grid grid-cols-4 gap-4">
            <div className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-[#00E676]/30 flex items-center justify-center cursor-pointer">
              <Plus className="w-6 h-6 text-gray-600" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/5" />
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 flex gap-4">
        <NexusButton variant="outline" className="flex-1 h-14 border-white/10" onClick={onPrev}>Back</NexusButton>
        <NexusButton className="flex-[2] h-14 bg-[#00E676] text-black font-bold" onClick={onNext}>Continue</NexusButton>
      </div>
    </motion.div>
  )
}

function IdentityVerification({ data, setAnswers, onNext, onPrev }: any) {
  const [otpSent, setOtpSent] = useState(false)
  const [verified, setVerified] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-12"
    >
      <div className="space-y-2 text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-6">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold">🪪 Verify Your Identity</h2>
        <p className="text-gray-500">Required for crypto payouts and store validation</p>
      </div>

      <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] flex items-start gap-4">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
        <div className="text-sm text-gray-400 leading-relaxed">
          NEXUS uses enterprise-grade encryption to protect your data. Identity verification helps prevent fraud and ensures secure crypto settlements.
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Legal Full Name</label>
            <Input className="bg-black/40 border-white/10 h-12" placeholder="As per ID" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date of Birth</label>
            <Input className="bg-black/40 border-white/10 h-12" placeholder="DD/MM/YYYY" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
          <div className="flex gap-3">
            <Input className="bg-black/40 border-white/10 h-12 flex-[3]" placeholder="+91 98765 43210" />
            <NexusButton 
              variant={otpSent ? "secondary" : "primary"} 
              className="flex-1 h-12 text-[10px] bg-white/5 border-white/10 text-white" 
              onClick={() => { setOtpSent(true); setTimeout(() => setVerified(true), 3000) }}
            >
              {otpSent ? (verified ? 'VERIFIED ✓' : 'SENDING...') : 'SEND OTP'}
            </NexusButton>
          </div>
        </div>

        {otpSent && !verified && (
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center block">Enter 6-digit code</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <input key={i} className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center font-bold text-lg focus:border-[#00E676] outline-none" maxLength={1} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 flex gap-4">
        <NexusButton variant="outline" className="flex-1 h-14 border-white/10" onClick={onPrev}>Back</NexusButton>
        <NexusButton className="flex-[2] h-14 bg-[#00E676] text-black font-bold" onClick={onNext} disabled={!verified}>Continue</NexusButton>
      </div>
    </motion.div>
  )
}

function CryptoSetup({ data, setAnswers, onNext, onPrev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-12"
    >
      <div className="space-y-2 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-[#00E676] mx-auto mb-6">
          <Wallet className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold">💰 Crypto Payouts</h2>
        <p className="text-gray-500">Select how you want to receive your earnings</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {['ETH', 'BTC', 'USDT', 'SOL'].map(coin => (
          <button
            key={coin}
            onClick={() => setAnswers({ ...data, payoutCoin: coin })}
            className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-4 ${data.payoutCoin === coin ? 'bg-[#00E676]/10 border-[#00E676] shadow-xl shadow-[#00E676]/10' : 'bg-white/5 border-white/5 grayscale opacity-60'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs">{coin}</div>
            <div className="font-bold">{coin === 'ETH' ? 'Ethereum' : coin === 'USDT' ? 'Tether' : coin === 'BTC' ? 'Bitcoin' : 'Solana'}</div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your {data.payoutCoin} Wallet Address</label>
        <div className="relative">
          <Input className="h-14 bg-black/40 border-white/10 pl-12 font-mono text-sm" placeholder="0x..." />
          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payout Schedule</label>
        <div className="grid grid-cols-2 gap-4">
          {['Instant', 'Weekly', 'Monthly'].map(s => (
            <button
              key={s}
              onClick={() => setAnswers({ ...data, payoutSchedule: s })}
              className={`py-3 rounded-xl border text-xs font-bold transition-all ${data.payoutSchedule === s ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 text-gray-500'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-8 flex gap-4">
        <NexusButton variant="outline" className="flex-1 h-14 border-white/10" onClick={onPrev}>Back</NexusButton>
        <NexusButton className="flex-[2] h-14 bg-[#00E676] text-black font-bold" onClick={onNext}>Continue</NexusButton>
      </div>
    </motion.div>
  )
}

function StorePolicies({ data, setAnswers, onNext, onPrev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-12"
    >
      <div className="space-y-2">
        <h2 className="text-4xl font-bold">📜 Store Policies</h2>
        <p className="text-gray-500">sensible defaults are pre-filled for your protection</p>
      </div>

      <div className="space-y-10">
        <div className="space-y-4">
          <label className="text-sm font-bold">Return & Refund Policy</label>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
            <div className="flex gap-3">
              {['None', '7 Days', '14 Days', '30 Days'].map(d => (
                <button key={d} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${d === '14 Days' ? 'bg-[#00E676]/10 border-[#00E676] text-[#00E676]' : 'bg-white/5 border-white/5 text-gray-500'}`}>{d}</button>
              ))}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed italic">"We accept returns within 14 days of delivery for unused items in original packaging. Buyer pays return shipping."</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-bold">Seller Agreement</label>
          <div className="max-h-40 overflow-y-auto p-6 bg-black/40 border border-white/10 rounded-2xl text-[10px] text-gray-500 leading-relaxed space-y-4 no-scrollbar">
            <p>1. PROVISION OF SERVICES. NEXUS provides a platform for sellers to list and sell products to global buyers.</p>
            <p>2. PLATFORM FEES. A standard fee of 20% is deducted from each successful transaction.</p>
            <p>3. CRYPTO SETTLEMENT. Payments are held in escrow until order completion is verified.</p>
            <p>4. COMPLIANCE. Sellers must comply with all local and global trade regulations.</p>
          </div>
          <div className="flex items-start gap-3 p-2">
            <input type="checkbox" className="mt-1 accent-[#00E676]" id="agree" />
            <label htmlFor="agree" className="text-xs text-gray-400">I have read and agree to the NEXUS Seller Terms of Service</label>
          </div>
        </div>
      </div>

      <div className="pt-8 flex gap-4">
        <NexusButton variant="outline" className="flex-1 h-14 border-white/10" onClick={onPrev}>Back</NexusButton>
        <NexusButton className="flex-[2] h-14 bg-[#00E676] text-black font-bold" onClick={onNext}>Continue</NexusButton>
      </div>
    </motion.div>
  )
}

function LaunchReview({ data, onLaunch, onPrev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold tracking-tight">🚀 Ready to Launch!</h2>
        <p className="text-gray-500 text-lg">Review your store details before going live</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="text-xl font-bold border-b border-white/5 pb-4">Setup Checklist</h3>
          <div className="space-y-4">
            {[
              { label: 'Store Identity', val: data.storeName, status: 'complete' },
              { label: 'Marketplace Category', val: data.category[0], status: 'complete' },
              { label: 'Identity Verified', val: 'Basic Level', status: 'complete' },
              { label: 'Payout Method', val: `${data.payoutCoin} (${data.payoutSchedule})`, status: 'complete' },
              { label: 'Initial Product', val: data.productName || 'None listed', status: data.productName ? 'complete' : 'optional' },
              { label: 'Logo & Branding', val: 'Default theme', status: 'optional' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  {item.status === 'complete' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Check className="w-3 h-3" /></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">!</div>
                  )}
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <span className="text-xs text-gray-500">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-xl font-bold border-b border-white/5 pb-4">Timeline</h3>
          <div className="relative pl-10 space-y-12 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {[
              { title: 'Store Review', desc: 'Our team will review your application (1-2h)', icon: Clock, color: 'text-blue-400' },
              { title: 'Approval Alert', desc: 'You\'ll receive a notification when ready', icon: Check, color: 'text-purple-400' },
              { title: 'Go Live!', desc: 'Your store becomes visible to global buyers', icon: Rocket, color: 'text-emerald-400' },
            ].map((t, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-10 w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center ${t.color}`}><t.icon className="w-3 h-3" /></div>
                <h4 className="font-bold text-sm mb-1">{t.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-12 text-center space-y-8">
        <NexusButton 
          className="w-full max-w-xl h-20 text-2xl bg-[#00E676] text-black font-bold shadow-3xl shadow-[#00E676]/30 pulse-glow"
          onClick={onLaunch}
        >
          🚀 Launch My Store!
        </NexusButton>
        <button onClick={onPrev} className="block mx-auto text-sm font-bold text-gray-500 hover:text-white transition-colors">Wait, I need to edit something</button>
      </div>

      <style jsx global>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.4); }
          70% { box-shadow: 0 0 40px 10px rgba(0, 230, 118, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
        }
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </motion.div>
  )
}
