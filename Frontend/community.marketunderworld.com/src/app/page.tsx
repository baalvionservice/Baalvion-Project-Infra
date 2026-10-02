"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Globe, 
  Zap, 
  Users, 
  MessageSquare, 
  Terminal as TerminalIcon, 
  ShieldCheck,
  MapPin,
  Sparkles,
  Skull,
  Eye,
  Lock,
  Flame,
  ShoppingBag,
  Calendar,
  BookOpen,
  Radio,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AppButton } from '@/components/ui/AppButton';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { REGIONS, LIVE_ACTIVITY_MOCK } from '@/data/mockData';
import { useIdentity } from '@/context/identity-context';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { flag: '🇺🇸', name: 'United States', traders: '18.4K', status: 'ACTIVE' },
  { flag: '🇮🇳', name: 'India', traders: '14.2K', status: 'ACTIVE' },
  { flag: '🇬🇧', name: 'United Kingdom', traders: '9.1K', status: 'ACTIVE' },
  { flag: '🇳🇬', name: 'Nigeria', traders: '7.8K', status: 'ACTIVE' },
  { flag: '🇧🇷', name: 'Brazil', traders: '6.3K', status: 'ACTIVE' },
  { flag: '🇩🇪', name: 'Germany', traders: '5.9K', status: 'ACTIVE' },
  { flag: '🇵🇭', name: 'Philippines', traders: '5.4K', status: 'ACTIVE' },
  { flag: '🇷🇺', name: 'Russia', traders: '4.8K', status: 'RESTRICTED' },
  { flag: '🇿🇦', name: 'South Africa', traders: '4.2K', status: 'ACTIVE' },
  { flag: '🇵🇰', name: 'Pakistan', traders: '3.9K', status: 'ACTIVE' },
  { flag: '🇧🇩', name: 'Bangladesh', traders: '3.1K', status: 'ACTIVE' },
  { flag: '🇨🇳', name: 'China', traders: '2.9K', status: 'RESTRICTED' },
];

const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Underground Marketplace',
    desc: 'Buy & sell across 150+ countries. Verified sellers. Encrypted deals. No questions asked on legit trades.',
    color: '#cc0000',
    tag: 'CORE',
  },
  {
    icon: Users,
    title: 'Elite Clubs & Communities',
    desc: 'Join invite-only clubs by country, niche, or skill. Connect with underground operators worldwide.',
    color: '#8b00ff',
    tag: 'SOCIAL',
  },
  {
    icon: BookOpen,
    title: 'Forum Intelligence',
    desc: 'Discuss real methods. Share wins. Learn from operators who have actually done it — not theory.',
    color: '#ff6600',
    tag: 'KNOWLEDGE',
  },
  {
    icon: Calendar,
    title: 'Events & Calendar',
    desc: 'Club nights, trading sessions, live events by city. Country-filtered so you only see what is near you.',
    color: '#00cc88',
    tag: 'EVENTS',
  },
  {
    icon: Radio,
    title: 'Live Sessions',
    desc: 'Real-time live streams. Trading rooms. Expert operators teach what schools never will.',
    color: '#ff0066',
    tag: 'LIVE',
  },
  {
    icon: Globe,
    title: 'Locals Hub',
    desc: 'Hyper-local listings by city. Find deals, services, and connects in your exact area.',
    color: '#0099ff',
    tag: 'LOCAL',
  },
];

const HELL_STATS = [
  { label: 'Countries Active', value: '150+', icon: Globe },
  { label: 'Operators Online', value: '12,400+', icon: Eye },
  { label: 'Deals Closed', value: '$4.2M+', icon: TrendingUp },
  { label: 'Forum Posts', value: '890K+', icon: MessageSquare },
];

const SCARY_GLOBAL_CSS = `
  @keyframes scanlineMove {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes glitch1 {
    0%, 90%, 100% { transform: none; clip-path: none; }
    92% { transform: translate(-3px, 0); clip-path: polygon(0 10%, 100% 10%, 100% 30%, 0 30%); }
    94% { transform: translate(3px, 0); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
    96% { transform: translate(-1px, 0); clip-path: polygon(0 40%, 100% 40%, 100% 55%, 0 55%); }
  }
  @keyframes emberFloat {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
    50%  { transform: translateY(-40px) translateX(10px) scale(1.2); opacity: 0.5; }
    100% { transform: translateY(-80px) translateX(-5px) scale(0.5); opacity: 0; }
  }
  @keyframes hellBorder {
    0%, 100% { border-color: rgba(180,0,0,0.3); box-shadow: 0 0 10px rgba(180,0,0,0.1); }
    50%       { border-color: rgba(220,0,0,0.7); box-shadow: 0 0 25px rgba(220,0,0,0.3); }
  }
  @keyframes countryPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
  @keyframes terminalBlink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .scanline-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.08) 2px,
      rgba(0,0,0,0.08) 4px
    );
    pointer-events: none;
    z-index: 1;
  }
  .hell-border {
    animation: hellBorder 2s ease-in-out infinite;
  }
  .glitch-title {
    animation: glitch1 5s ease-in-out infinite;
  }
  .ember {
    animation: emberFloat 2s ease-out infinite;
  }
  .terminal-cursor::after {
    content: '█';
    animation: terminalBlink 1s step-end infinite;
    color: #00ff88;
  }
`;

// Pre-computed stable ember positions (avoids hydration mismatch from Math.random)
const EMBER_PARTICLES = [
  { bottom: 12, size: 3, delay: 0.00, duration: 1.80 },
  { bottom: 22, size: 5, delay: 0.18, duration: 2.10 },
  { bottom: 8,  size: 3, delay: 0.36, duration: 2.20 },
  { bottom: 18, size: 7, delay: 0.54, duration: 1.90 },
  { bottom: 25, size: 3, delay: 0.72, duration: 2.40 },
  { bottom: 5,  size: 5, delay: 0.90, duration: 1.80 },
  { bottom: 15, size: 3, delay: 1.08, duration: 2.00 },
  { bottom: 20, size: 7, delay: 1.26, duration: 2.20 },
  { bottom: 10, size: 3, delay: 1.44, duration: 1.80 },
  { bottom: 28, size: 5, delay: 1.62, duration: 2.40 },
  { bottom: 7,  size: 3, delay: 1.80, duration: 2.00 },
  { bottom: 18, size: 7, delay: 1.98, duration: 2.20 },
];

function CountryCycler({ initialCountry }: { initialCountry: string }) {
  const [country, setCountry] = useState(initialCountry);
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setCountry(COUNTRIES[i % COUNTRIES.length].name);
      i++;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{country}</>;
}

export default function HomePage() {
  const { identity, isGlobalView, setGlobalView, isLoading } = useIdentity();

  const displayRegions = useMemo(() => {
    if (!identity || isGlobalView) return REGIONS;
    return [...REGIONS].sort((a, b) => {
      if (a.id === identity.regionId) return -1;
      if (b.id === identity.regionId) return 1;
      return 0;
    });
  }, [identity, isGlobalView]);

  const activeSessions = useMemo(() => {
    const sessions = LIVE_ACTIVITY_MOCK.activeSessions;
    if (!identity || isGlobalView) return sessions;
    return [...sessions].sort((a, b) => {
      if (a.regionId === identity.regionId) return -1;
      if (b.regionId === identity.regionId) return 1;
      return 0;
    });
  }, [identity, isGlobalView]);

  return (
    <div className="min-h-screen bg-[#0B0C0F]">
      <style dangerouslySetInnerHTML={{ __html: SCARY_GLOBAL_CSS }} />
      <Navbar />

      {/* ══════════════════════════════════════════════════════
          HERO — Satanic/Hacker Dark Theme
      ══════════════════════════════════════════════════════ */}
      <section
        className="scanline-overlay min-h-screen flex items-center justify-center pt-24 lg:pt-20 px-4 sm:px-6 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at top center, rgba(100,0,0,0.25) 0%, rgba(0,0,0,0) 60%), #0B0C0F',
        }}
      >
        {/* Floating ember particles - stable positions, no Math.random */}
        {EMBER_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="ember"
            style={{
              position: 'absolute',
              bottom: `${p.bottom}%`,
              left: `${10 + i * 7.5}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: `rgba(${180 + i * 5}, ${i * 10}, 0, 0.8)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              zIndex: 2,
            }}
          />
        ))}

        {/* Pentagram watermark */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'min(80vw, 600px)',
          color: 'rgba(140,0,0,0.04)',
          userSelect: 'none',
          pointerEvents: 'none',
          lineHeight: 1,
          zIndex: 0,
        }}>✡</div>

        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          <div className="lg:col-span-7 space-y-8 lg:space-y-10 text-center lg:text-left">
            <div className="space-y-6">

              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-red-900/50 bg-red-950/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-bold text-red-400 uppercase tracking-[0.25em]">
                  {identity && !isGlobalView ? `NODE ACTIVE: ${identity.region?.toUpperCase() || 'UNKNOWN'}` : 'GLOBAL NETWORK ONLINE'}
                </span>
              </div>

              <h1
                className="glitch-title text-[36px] sm:text-[52px] md:text-[68px] lg:text-[76px] font-black leading-[1.0] tracking-tight text-white"
              >
                {identity && !isGlobalView ? (
                  <>The Underground<br />Market for<br /><span style={{ color: '#cc2200' }}><CountryCycler initialCountry={identity.country || 'the World'} />.</span></>
                ) : (
                  <>The Underground<br />Market Where<br /><span style={{ color: '#cc2200' }}>The World Trades.</span></>
                )}
              </h1>

              <p className="text-[#9ca3af] text-base sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Marketplace. Forums. Clubs. Live Sessions. Events. Locals.{' '}
                <span className="text-white font-semibold">One platform. Every country.</span>{' '}
                No gatekeepers.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/marketplace" className="w-full sm:w-auto">
                <button
                  className="w-full sm:px-10 px-6 py-3.5 font-black uppercase tracking-widest text-sm text-white rounded border border-red-700"
                  style={{ background: 'linear-gradient(135deg, #8b0000, #cc2200)', boxShadow: '0 0 30px rgba(180,0,0,0.4)' }}
                >
                  Enter the Market <ArrowRight className="inline ml-2 w-4 h-4" />
                </button>
              </Link>
              <button
                className="w-full sm:w-auto sm:px-10 px-6 py-3.5 font-bold uppercase tracking-widest text-sm text-gray-300 rounded border border-white/10 hover:border-white/30 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                onClick={() => setGlobalView(!isGlobalView)}
              >
                {isGlobalView ? '🌍 Focus Local Node' : '🌐 Global View'}
              </button>
            </div>

            {/* Live stats bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2">
              {HELL_STATS.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal panel (right side) */}
          <div id="terminal-auth" className="lg:col-span-5 hidden lg:block">
            <TerminalPanel identity={identity} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT YOU FIND HERE — Feature Grid
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 relative" style={{ background: '#0a0a0a' }}>
        {/* Section heading */}
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#cc2200' }}>
              ☠ EVERYTHING YOU NEED ☠
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-4 mb-4">
              What You'll Find Here
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every tool, every category, every country — all in one dark market network.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="hell-border rounded-lg p-6 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(180,0,0,0.2)' }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ background: f.color }}
                />
                <div className="flex items-start gap-4 relative z-10">
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}
                  >
                    <f.icon style={{ color: f.color }} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-base">{f.title}</h3>
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                        style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}44` }}
                      >
                        {f.tag}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          COUNTRIES — Global Coverage Grid
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-32 px-4 sm:px-6" style={{ background: '#0B0C0F' }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#cc2200' }}>
                ☠ GLOBAL REACH
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
                {identity && !isGlobalView ? 'Your Region Node.' : '150+ Countries. One Network.'}
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                The platform auto-detects your location and surfaces local deals, events, and operators.
              </p>
            </div>
            {identity && !isGlobalView && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded border text-xs font-bold uppercase tracking-widest"
                style={{ background: 'rgba(0,180,0,0.08)', borderColor: 'rgba(0,200,0,0.3)', color: '#00cc66' }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Connected: {identity.regionId.toUpperCase()}
              </div>
            )}
          </div>

          {/* Countries table */}
          <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(180,0,0,0.2)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(140,0,0,0.15)', borderBottom: '1px solid rgba(180,0,0,0.2)' }}>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Country</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Operators</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {COUNTRIES.map((c, i) => (
                  <tr
                    key={c.name}
                    style={{
                      borderBottom: i < COUNTRIES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <span className="text-lg mr-3">{c.flag}</span>
                      <span className="text-white font-semibold">{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-gray-400">{c.traders}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className="text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest"
                        style={{
                          background: c.status === 'ACTIVE' ? 'rgba(0,180,0,0.1)' : 'rgba(180,100,0,0.1)',
                          color: c.status === 'ACTIVE' ? '#00cc66' : '#ff8800',
                          border: `1px solid ${c.status === 'ACTIVE' ? 'rgba(0,180,0,0.2)' : 'rgba(180,100,0,0.2)'}`,
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Existing regions grid */}
          <div className="mt-14">
            <h3 className="text-xl font-bold text-white mb-6">
              <span style={{ color: '#cc2200' }}>⚡</span> Intelligence Nodes by Region
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayRegions.map((reg, idx) => (
                <Link key={reg.id} href={`/education?region=${reg.id}`}>
                  <ListingCard
                    index={idx}
                    className={cn(
                      'group cursor-pointer hover:border-red-800/60 transition-all relative overflow-hidden',
                      identity?.regionId === reg.id && !isGlobalView && 'border-green-700/50 bg-green-900/5 ring-1 ring-green-700/20'
                    )}
                  >
                    {identity?.regionId === reg.id && !isGlobalView && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-green-400 animate-pulse" />
                        <span className="text-[8px] font-bold text-green-400 uppercase tracking-widest">Recommended</span>
                      </div>
                    )}
                    <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">{reg.icon}</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{reg.name}</h3>
                    <div className="flex justify-between items-center pt-4 border-t border-[#252A33] mt-4">
                      <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7280] uppercase">{reg.teachers} Teachers</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-red-400 uppercase">{reg.sessions} Live</span>
                      </div>
                    </div>
                  </ListingCard>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LIVE SESSIONS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-32" style={{ background: 'rgba(10,0,0,0.8)' }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12 lg:mb-16 text-center md:text-left">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#ff3300' }}>
              ⚡ OPERATIONAL STREAMS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4">Live Session Intelligence.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {activeSessions.map((session, idx) => (
              <ListingCard key={session.id} index={idx} className="p-0 overflow-hidden group border-[#252A33] hover:border-red-900/60">
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                  <div className="text-red-900/20 group-hover:scale-110 transition-transform duration-1000">
                    <TerminalIcon size={120} />
                  </div>
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <Badge variant="live">LIVE</Badge>
                    {identity?.regionId === session.regionId && (
                      <Badge variant="success" className="bg-green-800 text-green-200">LOCAL NODE</Badge>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 z-20">
                    <div className="text-[11px] sm:text-xs font-bold text-white mb-1">{session.viewers} watching</div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest" style={{ color: '#cc2200' }}>
                      {session.region} • {session.country}
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                  <h4 className="text-lg sm:text-xl font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                    {session.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-red-950 border border-red-900/50 flex items-center justify-center font-bold text-[10px] sm:text-xs text-red-400">
                      {session.teacherName.charAt(0)}
                    </div>
                    <span className="text-[13px] sm:text-sm font-medium text-gray-400">{session.teacherName}</span>
                  </div>
                  <button
                    className="w-full h-10 text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-white rounded border border-red-900/50 hover:bg-red-950/50 transition-all"
                    style={{ background: 'rgba(140,0,0,0.15)' }}
                  >
                    Connect Stream
                  </button>
                </div>
              </ListingCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA — Hell Gate Banner
      ══════════════════════════════════════════════════════ */}
      <section
        className="py-24 px-4 sm:px-6 text-center relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at center, rgba(100,0,0,0.3) 0%, #000 70%)' }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          pointerEvents: 'none',
        }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-5xl mb-4">☠</div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            Ready to Enter the<br />
            <span style={{ color: '#cc2200' }}>Underground?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            150+ countries. 12,000+ active operators. The market doesn't sleep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/registration">
              <button
                className="px-10 py-4 font-black uppercase tracking-widest text-sm text-white rounded"
                style={{ background: 'linear-gradient(135deg, #8b0000, #cc2200)', boxShadow: '0 0 40px rgba(180,0,0,0.5)' }}
              >
                Create Account — Free
              </button>
            </Link>
            <Link href="/forum">
              <button className="px-10 py-4 font-bold uppercase tracking-widest text-sm text-gray-300 rounded border border-white/10 hover:border-white/30 hover:text-white transition-all">
                Browse Forums First
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Interactive Hacker Auth Terminal ─────────────────────────────────────────
const SECRET_CODE = 'UNDERGROUND';

type TerminalStage = 'booting' | 'scanning' | 'warning' | 'prompt' | 'checking' | 'denied' | 'granted';

function TerminalPanel({ identity }: { identity: any }) {
  const [lines, setLines] = useState<Array<{ text: string; color?: string }>>([]);
  const [stage, setStage] = useState<TerminalStage>('booting');
  const [inputVal, setInputVal] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const addLine = (text: string, color?: string, delay = 0) =>
    new Promise<void>((res) => setTimeout(() => {
      setLines(prev => [...prev, { text, color }]);
      res();
    }, delay));

  const addLines = async (pairs: Array<[string, string?, number?]>) => {
    for (const [text, color, delay = 0] of pairs) {
      await addLine(text, color, delay);
    }
  };

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [lines]);

  // Boot sequence → scan → scary warning → prompt
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await addLines([
        ['> underground_market.boot()', '#444', 0],
        ['✓ Encrypted tunnel established', '#00cc66', 180],
        ['> identity.geolocate()', '#444', 280],
        [identity ? `✓ Node: ${identity.region}` : '  Scanning global proxy...', '#00cc66', 380],
        [identity ? `✓ Country: ${identity.country}` : '  Tracing IP headers...', '#00cc66', 480],
        [identity ? `✓ IP: ${identity.ip}` : '  Verifying anonymity...', '#00cc66', 580],
        ['> market.status()', '#444', 700],
        ['  Operators online:  12,447', '#888', 820],
        ['  Active deals:      8,923', '#888', 940],
        ['  ETH volume:    $4.2M', '#888', 1060],
        ['  Countries:         150+', '#888', 1180],
      ]);

      if (cancelled) return;
      setStage('scanning');

      await addLines([
        ['', undefined, 400],
        ['> auth.scan_visitor()', '#444', 0],
        ['', undefined, 300],
        ['⚠  UNKNOWN ENTITY DETECTED ON NETWORK', '#ff3300', 400],
        ['   Facial recognition: RUNNING...', '#888', 600],
        ['   Device fingerprint: CAPTURED', '#ff8800', 800],
        ['   ISP:  ' + (identity?.ip ? identity.ip.split('.').slice(0, 2).join('.') + '.x.x' : '103.x.x.x'), '#888', 1000],
        ['   Cookies: HARVESTED', '#ff8800', 1100],
        ['   Browser history: SCANNING...', '#888', 1200],
      ]);

      if (cancelled) return;
      setStage('warning');

      await addLines([
        ['', undefined, 300],
        ['  ██████████████████████████████████', '#cc0000', 200],
        ['  ██                              ██', '#cc0000', 80],
        ['  ██   I KNOW WHO YOU ARE.        ██', '#ff0000', 80],
        ['  ██   I CAN SEE YOU RIGHT NOW.   ██', '#ff0000', 80],
        ['  ██   THERE IS NO MERCY HERE.    ██', '#ff0000', 80],
        ['  ██                              ██', '#cc0000', 80],
        ['  ██████████████████████████████████', '#cc0000', 80],
        ['', undefined, 400],
        ['  This platform monitors ALL activity.', '#ff4400', 200],
        ['  Every click. Every keystroke. Every second.', '#ff4400', 300],
        ['  You have been warned. There is no turning back.', '#cc0000', 400],
        ['', undefined, 500],
        ['> auth.request_access_code()', '#444', 300],
        ['', undefined, 300],
        ['  HINT: The code is hidden in plain sight.', '#555', 200],
        ['  Look at what this platform IS.', '#444', 300],
        ['  Type it below. One chance.', '#666', 400],
        ['', undefined, 200],
        ['  access_code: _', '#00cc66', 300],
      ]);

      if (cancelled) return;
      setStage('prompt');
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputVal.trim().toUpperCase();
    setInputVal('');
    setStage('checking');

    setLines(prev => [...prev.slice(0, -1), { text: `  access_code: ${inputVal}`, color: '#00cc66' }]);

    await addLine('', undefined, 200);
    await addLine('> auth.verify("' + code + '")', '#444', 200);
    await addLine('  Verifying against encrypted vault...', '#888', 600);

    if (code === SECRET_CODE) {
      await addLines([
        ['', undefined, 400],
        ['  ✓ HASH MATCH CONFIRMED', '#00cc66', 200],
        ['  ✓ IDENTITY PROTOCOL ACCEPTED', '#00cc66', 300],
        ['  ✓ CLEARANCE LEVEL: OPERATOR', '#00ff88', 400],
        ['', undefined, 200],
        ['  WELCOME TO THE UNDERGROUND.', '#ff0000', 200],
        ['  Redirecting to secure portal...', '#888', 500],
      ]);
      setStage('granted');
      setTimeout(() => { window.location.href = '/auth/signin'; }, 2000);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      await addLines([
        ['', undefined, 300],
        ['  ✗ ACCESS DENIED', '#ff0000', 200],
        ['  ✗ INTRUSION ATTEMPT LOGGED', '#ff3300', 300],
        ['  ✗ YOUR IDENTITY HAS BEEN RECORDED', '#ff0000', 400],
        ['', undefined, 200],
      ]);

      if (newAttempts >= 3) {
        await addLines([
          ['  ⚠ WARNING: MAXIMUM ATTEMPTS REACHED', '#ff0000', 200],
          ['  ⚠ BREACH ALERT DISPATCHED TO ADMINS', '#cc0000', 300],
          ['  ⚠ YOUR SESSION IS BEING MONITORED', '#ff3300', 400],
          ['', undefined, 300],
          ['  Patience. Reboot this session and try again.', '#555', 200],
        ]);
        setStage('denied');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      } else {
        await addLines([
          [`  Attempts remaining: ${3 - newAttempts}`, '#ff4400', 200],
          ['  HINT: Think. What is this place called?', '#555', 400],
          ['', undefined, 200],
          ['  access_code: _', '#00cc66', 300],
        ]);
        setStage('prompt');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleReboot = () => {
    setLines([]);
    setStage('booting');
    setAttempts(0);
    setInputVal('');
  };

  return (
    <div
      className="rounded-lg overflow-hidden shadow-2xl"
      style={{
        background: '#0a0a0a',
        border: `1px solid ${stage === 'denied' ? 'rgba(255,0,0,0.6)' : stage === 'granted' ? 'rgba(0,200,100,0.5)' : 'rgba(180,0,0,0.3)'}`,
        boxShadow: shake
          ? '0 0 60px rgba(255,0,0,0.8)'
          : stage === 'granted'
            ? '0 0 60px rgba(0,200,100,0.4)'
            : '0 0 40px rgba(120,0,0,0.2)',
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}
    >
      {/* Title bar */}
      <div className="h-10 px-4 flex items-center justify-between" style={{ background: '#080808', borderBottom: '1px solid rgba(180,0,0,0.2)' }}>
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-700 opacity-70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-700 opacity-70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-700 opacity-70" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'rgba(180,0,0,0.7)' }}>
          underground_market — secure
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: stage === 'granted' ? '#00cc66' : stage === 'denied' ? '#ff3300' : '#333' }}>
          {stage === 'granted' ? 'AUTHENTICATED' : stage === 'denied' ? 'LOCKED' : stage === 'booting' ? 'BOOTING...' : stage === 'prompt' ? 'AWAITING INPUT' : stage === 'checking' ? 'VERIFYING' : stage === 'scanning' ? 'SCANNING' : 'WARNING'}
        </span>
      </div>

      {/* Output lines */}
      <div
        ref={scrollRef}
        className="p-6 font-mono text-[13px] space-y-1.5 overflow-y-auto"
        style={{ height: '380px', scrollbarWidth: 'none' }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{ color: line.color || '#ccc', whiteSpace: 'pre', letterSpacing: '0.02em' }}
          >
            {line.text}
          </div>
        ))}

        {/* Input row */}
        {stage === 'prompt' && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
            <span style={{ color: '#00cc66' }}>{'  access_code:'}</span>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#00ff88',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                letterSpacing: '0.15em',
                width: '180px',
                caretColor: '#00ff88',
              }}
            />
            <span style={{ color: '#555', animation: 'terminalBlink 1s step-end infinite' }}>█</span>
          </form>
        )}

        {stage === 'denied' && (
          <div className="pt-4">
            <button
              onClick={handleReboot}
              style={{ color: '#555', fontFamily: 'inherit', fontSize: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer' }}
              className="hover:text-red-500 transition-colors"
            >
              {'>'} session.restart() <span style={{ animation: 'terminalBlink 1s step-end infinite' }}>█</span>
            </button>
          </div>
        )}

        {(stage === 'booting' || stage === 'scanning' || stage === 'warning' || stage === 'checking') && (
          <div style={{ color: '#444' }} className="terminal-cursor">
            {'> '}
          </div>
        )}
      </div>
    </div>
  );
}
