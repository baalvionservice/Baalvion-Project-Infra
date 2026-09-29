"use client"

import { use, useState, useEffect, useMemo } from "react"
import { TEACHERS, REGIONS_DATA } from "@/lib/mock-data"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Star, 
  Users, 
  Globe, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Award, 
  Download, 
  Play, 
  ChevronRight, 
  ArrowRight,
  Shield,
  ThumbsUp,
  CreditCard,
  Gift,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { notFound } from "next/navigation"

export default function TeacherStorefront({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const teacher = TEACHERS.find(t => t.id === resolvedParams.id);
  
  if (!teacher) {
    notFound();
  }

  const region = REGIONS_DATA.find(r => r.id === teacher.regionId);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const TABS = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "pricing", label: "Classes & Pricing", icon: "📚" },
    { id: "booking", label: "Schedule & Booking", icon: "📅" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "materials", label: "Courses & Materials", icon: "🎓" },
    { id: "qa", label: "Q&A", icon: "💬" },
  ];

  const scrollIntoView = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 140; // Navbar + Tab bar offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-blue-500/20 selection:text-blue-400">
      <Navbar />

      {/* Cover Banner */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 opacity-40" 
          style={{ background: `linear-gradient(135deg, ${region?.color || '#3b82f6'}, #0A0A0F)` }} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.05] via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Floating Pills */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {(teacher.tags ?? []).map((tag, i) => (
            <motion.div
              key={tag}
              animate={{ 
                y: [0, -20, 0],
                x: [0, i % 2 === 0 ? 10 : -10, 0]
              }}
              transition={{ 
                duration: 5 + i, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute text-[10px] font-bold px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
              style={{ 
                top: `${20 + (i * 15)}%`, 
                left: `${10 + (i * 20)}%` 
              }}
            >
              {tag}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-6 relative z-10 -mt-32">
        <NexusCard className="p-10 bg-[#0A0A0F]/60 backdrop-blur-2xl border-white/5 shadow-3xl">
          <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center">
            {/* Left Cluster */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-[#0A0A0F] overflow-hidden shadow-2xl">
                  <img src={teacher.avatar_url} className="w-full h-full object-cover" alt={teacher.name} />
                </div>
                {teacher.is_live && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0A0A0F] animate-pulse" />
                )}
                <NexusBadge variant="live" className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80">
                  LIVE NOW
                </NexusBadge>
              </div>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </div>
            </div>

            {/* Center Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <h1 className="text-5xl font-bold tracking-tight nexus-gradient-text">{teacher.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-400 font-medium">
                  <span className="flex items-center gap-2">
                    {getFlagEmoji(teacher.countryCode)} {teacher.country}
                  </span>
                  <NexusBadge variant="info" className="bg-white/5 border border-white/10">
                    {teacher.regionId.toUpperCase()}
                  </NexusBadge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(teacher.tags ?? []).map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-bold">{teacher.rating}</span>
                  <span className="text-sm text-gray-500 font-bold border-l border-white/10 pl-2">({teacher.reviewCount} reviews)</span>
                </div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                  Member since {teacher.memberSince}
                </div>
              </div>

              <p className="text-gray-400 text-lg leading-relaxed max-w-2xl font-medium">
                {teacher.bio}
              </p>
            </div>

            {/* Right Cluster */}
            <div className="w-full lg:w-72 space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Students", val: teacher.students_count, icon: Users },
                  { label: "Classes", val: teacher.classesGiven, icon: Award },
                  { label: "Hours", val: teacher.hoursTaught, icon: Clock },
                  { label: "Earnings", val: teacher.totalEarned, icon: Globe },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">{stat.label}</div>
                    <div className="font-bold text-md">{stat.val}</div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Price / Hour</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {teacher.price_crypto} {teacher.currency}
                    <span className="text-gray-500 text-sm ml-2">(${teacher.price_usd})</span>
                  </div>
                </div>
                <NexusButton onClick={() => scrollIntoView('booking')} className="w-full nexus-gradient-bg h-14 text-lg">Book Private Class</NexusButton>
                <NexusButton variant="outline" className="w-full border-white/10 h-14">Send Message</NexusButton>
              </div>
            </div>
          </div>
        </NexusCard>
      </div>

      {/* Sticky Tab Nav */}
      <div className="sticky top-20 z-40 bg-[#0A0A0F]/80 backdrop-blur-2xl border-y border-white/5 mt-12">
        <div className="container mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 py-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollIntoView(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 nexus-gradient-bg" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="flex-1 space-y-32">
            {/* Overview Section */}
            <section id="overview" className="scroll-mt-40 space-y-16">
              <div className="space-y-8">
                <h2 className="text-3xl font-bold flex items-center gap-4">
                  <span className="text-2xl">📋</span> About {teacher.name.split(' ')[0]}
                </h2>
                <div className="prose prose-invert max-w-none text-gray-400 text-lg leading-relaxed font-medium">
                  {teacher.longBio}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-16 border-t border-white/5">
                <div className="space-y-8">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500">Expertise & Skills</h3>
                  <div className="space-y-6">
                    {teacher.skills?.map(skill => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm font-bold mb-3">
                          <span>{skill.name}</span>
                          <span className="text-blue-400">{skill.level}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full nexus-gradient-bg" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500">Credentials</h3>
                  <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                    {teacher.education?.map((edu, i) => (
                      <div key={i} className="pl-10 relative">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#0A0A0F] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <div className="text-[10px] font-bold text-gray-500 mb-1">{edu.year}</div>
                        <div className="font-bold text-lg mb-1">{edu.degree}</div>
                        <div className="text-sm text-gray-400 font-medium">{edu.institution}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="scroll-mt-40 space-y-12">
              <h2 className="text-3xl font-bold flex items-center gap-4">
                <span className="text-2xl">📚</span> Classes & Packages
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "Starter", price: teacher.price_crypto, desc: "Perfect for a single evaluation session.", features: ["60 min class", "Study plan", "Session recording"], color: "blue" },
                  { name: "Growth", price: "0.15", desc: "8 classes per month. Save 37% over single sessions.", features: ["8 x 60 min classes", "Priority booking", "24/7 Support", "Curriculum"], popular: true, color: "gold" },
                  { name: "Elite", price: "0.35", desc: "Full exam prep intensive. Daily access.", features: ["20 x 60 min classes", "Mock exams", "WhatsApp Support", "Guaranteed Result"], color: "pink" }
                ].map((tier, i) => (
                  <NexusCard key={i} className={`relative flex flex-col h-full border-white/5 bg-white/[0.02] hover:border-white/10 transition-all ${tier.popular ? 'ring-2 ring-blue-500/50' : ''}`}>
                    {tier.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <NexusBadge variant="live" className="bg-blue-600 text-white border-none px-6">BEST VALUE</NexusBadge>
                      </div>
                    )}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{tier.desc}</p>
                    </div>
                    <div className="mb-8">
                      <div className="text-3xl font-bold text-white mb-1">
                        {tier.price} <span className="text-lg">ETH</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Per Session/Package</div>
                    </div>
                    <div className="space-y-4 flex-1 mb-10">
                      {tier.features.map(f => (
                        <div key={f} className="flex items-center gap-3 text-sm font-medium text-gray-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f}
                        </div>
                      ))}
                    </div>
                    <NexusButton onClick={() => setIsPaymentModalOpen(true)} className={`w-full ${tier.popular ? 'nexus-gradient-bg' : 'variant-outline border-white/10'}`}>
                      Select Plan
                    </NexusButton>
                  </NexusCard>
                ))}
              </div>
            </section>

            {/* Schedule Section */}
            <section id="booking" className="scroll-mt-40 space-y-12">
              <h2 className="text-3xl font-bold flex items-center gap-4">
                <span className="text-2xl">📅</span> Availability
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold">March 2025</h3>
                    <div className="flex gap-2">
                      <NexusButton variant="outline" size="sm" className="w-8 h-8 p-0 rounded-lg">←</NexusButton>
                      <NexusButton variant="outline" size="sm" className="w-8 h-8 p-0 rounded-lg">→</NexusButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 31 }).map((_, i) => {
                      const isBooked = (i + 1) % 5 === 0;
                      const isAvailable = (i + 1) % 3 === 0;
                      return (
                        <button
                          key={i}
                          onClick={() => isAvailable && setSelectedDay(i + 1)}
                          disabled={isBooked}
                          className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all relative ${
                            selectedDay === i + 1 ? 'nexus-gradient-bg text-white shadow-xl' :
                            isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' :
                            isBooked ? 'bg-red-500/5 text-red-900 opacity-20 cursor-not-allowed' :
                            'bg-white/5 text-gray-500 hover:bg-white/10'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </NexusCard>

                <div className="space-y-8">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500">Available Slots</h3>
                  {selectedDay ? (
                    <div className="grid grid-cols-3 gap-4">
                      {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '06:00 PM', '07:00 PM'].map(time => (
                        <NexusButton key={time} variant="outline" className="border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 font-bold h-12">
                          {time}
                        </NexusButton>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-white/10 rounded-3xl text-gray-500">
                      <Calendar className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-medium">Select a date to view available times</p>
                    </div>
                  )}
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4" /> All times shown in UTC (Your local: GMT+9)
                  </div>
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section id="reviews" className="scroll-mt-40 space-y-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-4">
                  <span className="text-2xl">⭐</span> Student Reviews
                </h2>
                <div className="text-sm font-bold text-gray-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  247 Verified Reviews
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 text-center">
                    <div className="text-5xl font-bold mb-2">{teacher.rating}</div>
                    <div className="flex justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}
                    </div>
                    <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Course Accuracy Score</div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { star: 5, val: 89 },
                      { star: 4, val: 9 },
                      { star: 3, val: 2 },
                      { star: 2, val: 0 },
                      { star: 1, val: 0 },
                    ].map(r => (
                      <div key={r.star} className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-500 w-4">{r.star}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: `${r.val}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-8">{r.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                  {[
                    { name: "Aryan M.", country: "IN", date: "2 days ago", body: "Yuki explained calculus concepts I had struggled with for 2 years in just 3 sessions. His teaching style is incredibly clear.", title: "Best Math Teacher on NEXUS" },
                    { name: "Emma L.", country: "AU", date: "1 week ago", body: "Paid in ETH, booking was instant, class was exactly on time. Yuki prepared custom problems just for my university exam.", title: "Worth every Satoshi" }
                  ].map((rev, i) => (
                    <NexusCard key={i} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                            {rev.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {rev.name} <span>{getFlagEmoji(rev.country)}</span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{rev.date}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(j => <Star key={j} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />)}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold mb-3">{rev.title}</h4>
                      <p className="text-gray-400 leading-relaxed italic mb-6">"{rev.body}"</p>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5" /> Helpful (12)
                        </button>
                      </div>
                    </NexusCard>
                  ))}
                  <NexusButton variant="outline" className="w-full border-white/10 font-bold h-14">Load More Reviews</NexusButton>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Widget (Sticky) */}
          <aside className="w-full lg:w-96 shrink-0">
            <div className="sticky top-32 space-y-8">
              <NexusCard className="p-8 border-white/10 bg-white/[0.04] shadow-2xl ring-1 ring-white/5">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-bold">Booking Sidebar</h3>
                  <NexusBadge variant="live">ONLINE</NexusBadge>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Class Type</div>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                      {['1-on-1', 'Group'].map(t => (
                        <button key={t} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all hover:bg-white/5 active:bg-blue-500/20">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-4">Duration</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[30, 60, 90, 120].map(d => (
                        <button 
                          key={d} 
                          onClick={() => setSelectedDuration(d)}
                          className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                            selectedDuration === d 
                            ? 'nexus-gradient-bg border-blue-500 shadow-lg' 
                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-6 border-y border-white/5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-500 uppercase">Total Amount</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{(Number(teacher.price_crypto) * (selectedDuration / 60)).toFixed(3)} {teacher.currency}</div>
                        <div className="text-xs text-gray-500 font-bold">≈ ${(Number(teacher.price_usd) * (selectedDuration / 60)).toFixed(2)} USD</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <NexusButton onClick={() => setIsPaymentModalOpen(true)} className="w-full nexus-gradient-bg h-14 text-lg font-bold">Book & Pay in Crypto</NexusButton>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                        <Shield className="w-4 h-4 text-emerald-500" /> Secure Crypto Escrow
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                        <Clock className="w-4 h-4 text-emerald-500" /> Free cancellation before 24h
                      </div>
                    </div>
                  </div>
                </div>
              </NexusCard>

              {/* VIP Tip Card */}
              <NexusCard className="p-8 border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">Send a VIP Tip</h4>
                    <p className="text-xs text-gray-500 font-medium">Support {teacher.name.split(' ')[0]}'s work</p>
                  </div>
                </div>
                <NexusButton onClick={() => setIsTipModalOpen(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white border-none shadow-amber-500/20">Send Appreciation</NexusButton>
              </NexusCard>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#111118] border border-white/10 rounded-3xl p-10 relative"
            >
              <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 mx-auto">
                  <CreditCard className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">Confirm Payment</h3>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Recipient</span>
                    <span className="font-bold">{teacher.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Session</span>
                    <span className="font-bold">Mathematics (60 min)</span>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Total Amount</span>
                    <span className="text-xl font-bold text-emerald-400">{teacher.price_crypto} ETH</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center p-6 bg-white rounded-2xl">
                    {/* Mock QR Code */}
                    <div className="w-40 h-40 bg-gray-200 border-4 border-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                      MOCK_QR_CODE
                    </div>
                  </div>
                  <div className="font-mono text-[10px] bg-black p-4 rounded-xl text-gray-400 break-all select-all cursor-pointer">
                    0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                  </div>
                </div>

                <div className="flex gap-4">
                  <NexusButton variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 border-white/10 h-14">Cancel</NexusButton>
                  <NexusButton onClick={() => {
                    setIsPaymentModalOpen(false);
                    alert("Payment Sent Successfully! Redirecting to Dashboard...");
                  }} className="flex-1 nexus-gradient-bg h-14">I Have Paid</NexusButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tip Modal */}
      <AnimatePresence>
        {isTipModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#111118] border border-amber-500/20 rounded-3xl p-10 relative"
            >
              <button onClick={() => setIsTipModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mx-auto">
                  <Star className="w-10 h-10 fill-amber-500" />
                </div>
                <h3 className="text-2xl font-bold">Appreciate {teacher.name.split(' ')[0]}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {[0.001, 0.005, 0.01, 0.05].map(amt => (
                    <button key={amt} className="p-4 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-amber-500/10 hover:border-amber-500/50 transition-all">
                      {amt} ETH
                    </button>
                  ))}
                </div>

                <textarea 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-gray-600 focus:ring-1 focus:ring-amber-500/50" 
                  placeholder="Add a thank you message..."
                  rows={3}
                />

                <NexusButton onClick={() => {
                  setIsTipModalOpen(false);
                  alert("Appreciation Sent! 🎉");
                }} className="w-full bg-amber-500 hover:bg-amber-600 h-14 text-lg font-bold">Send Tip</NexusButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
