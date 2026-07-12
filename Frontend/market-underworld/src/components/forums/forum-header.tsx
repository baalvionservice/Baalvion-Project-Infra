
"use client"

import React from 'react'
import Link from 'next/link'
import { 
  Home, 
  Users, 
  Book, 
  CircleHelp, 
  Shield, 
  ShieldCheck, 
  Megaphone, 
  Gem, 
  MessageSquare, 
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const ForumHeader = () => {
  return (
    <header className="bg-[#1a2634] border-b border-white/5 pt-10">
      <div className="container mx-auto px-6">
        {/* Brand/Mascot Area */}
        <div className="flex items-center gap-6 mb-10">
          <div className="flex flex-col items-center">
            {/* Mascot SVG */}
            <div className="w-16 h-16 text-[#3498db] mb-2">
              <svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 4C18.7 4 8 14.7 8 28c0 8.4 4.1 15.8 10.4 20.4L16 60l16-4 16 4-2.4-11.6C51.9 43.8 56 36.4 56 28 56 14.7 45.3 4 32 4zm0 44c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z" opacity="0.2"/>
                <circle cx="32" cy="28" r="20" fill="none" stroke="currentColor" strokeWidth="4"/>
                <path d="M22 24c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4zM34 24c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4z" />
                <path d="M24 38s2 4 8 4 8-4 8-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                <path d="M42 18l4-4M22 18l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-4xl font-black tracking-tighter flex flex-col items-center leading-none">
              <span className="text-white uppercase">Market</span>
              <span className="text-[#FF3D57] uppercase mt-1">Underworld</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="bg-[#111b26] border border-white/10 rounded-t-lg flex flex-wrap items-center overflow-hidden">
          <div className="flex flex-wrap flex-1">
            <NavItem href="/forum" icon={<Home className="w-4 h-4" />} label="Forums" hasChevron />
            <NavItem href="/forum/users" icon={<Users className="w-4 h-4" />} label="Users" hasChevron />
            <NavItem href="#" icon={<Book className="w-4 h-4" />} label="Rules" />
            <NavItem href="#" icon={<CircleHelp className="w-4 h-4" />} label="Arbitration" />
            <NavItem href="#" icon={<Shield className="w-4 h-4" />} label="AutoGarant" />
            <NavItem href="#" icon={<ShieldCheck className="w-4 h-4" />} label="Garant-Service" />
            <NavItem href="#" label="USA BANK/FULLZ" variant="danger" />
            <NavItem href="#" label="LOOKUP SSN" variant="danger" />
            <NavItem href="#" label="SKUP E-CODES" variant="danger" />
            <NavItem href="/forum/advertising" icon={<Megaphone className="w-4 h-4" />} label="Advertising" />
            <NavItem href="#" icon={<Gem className="w-4 h-4" />} label="Elevation of rights" />
            <NavItem href="#" icon={<MessageSquare className="w-4 h-4" />} label="Duty" />
          </div>

          <div className="flex items-center px-4 border-l border-white/5 gap-6 h-12">
            <Link href="/auth/signin" className="text-[11px] font-bold text-white uppercase hover:text-[#3498db] transition-colors">Entrance</Link>
            <Link href="/auth/registration" className="text-[11px] font-bold text-white uppercase hover:text-[#3498db] transition-colors">Registration</Link>
            <button className="flex items-center gap-2 text-[#3498db] hover:text-white transition-colors bg-[#1a2634] px-4 py-1.5 rounded-md border border-white/5">
              <Search className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase">Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="bg-[#2980b9] h-10 border-t border-white/10">
        <div className="container mx-auto px-6 h-full flex items-center gap-8">
          <Link href="#" className="text-[11px] font-bold text-white uppercase hover:opacity-80 transition-all">New messages</Link>
          <Link href="#" className="text-[11px] font-bold text-white uppercase hover:opacity-80 transition-all">Search messages</Link>
        </div>
      </div>
    </header>
  )
}

const NavItem = ({ href, icon, label, hasChevron, variant = 'default' }: any) => {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-2 px-4 h-12 border-r border-white/5 transition-all relative group hover:bg-white/5",
        variant === 'danger' ? "text-[#FF3D57]" : "text-gray-300 hover:text-white"
      )}
    >
      {icon}
      <span className="text-[11px] font-bold uppercase tracking-tight">{label}</span>
      {hasChevron && <ChevronDown className="w-3 h-3 text-gray-600 group-hover:text-white" />}
    </Link>
  )
}
