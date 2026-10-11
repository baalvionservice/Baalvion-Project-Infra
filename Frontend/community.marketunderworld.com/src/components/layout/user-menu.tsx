"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, LayoutDashboard, LogOut, Settings, ShieldCheck, ShoppingBag, UserRound, Wallet } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getMyProfile, photoUrl, type MyProfile } from "@/lib/api/profile"

// One profile fetch per page load, shared by every menu instance.
let profileOnce: Promise<MyProfile | null> | null = null
const loadProfile = () => (profileOnce ??= getMyProfile().catch(() => null))

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard#profile", label: "My profile and photo", icon: UserRound },
  { href: "/kyc", label: "Identity verification (KYC)", icon: ShieldCheck },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/invoices", label: "My orders", icon: ShoppingBag },
  { href: "/settings/notifications", label: "Settings", icon: Settings },
]

// The signed-in member's button: their photo or initial, and a menu to everything that is theirs.
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { loadProfile().then(setProfile) }, [])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc) }
  }, [])

  const initial = (user?.email ?? "?").charAt(0).toUpperCase()
  const photo = photoUrl(profile?.photoPath ?? null)

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Your account"
        className="flex items-center gap-2 pl-1 pr-2 min-h-[40px] rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
        <span className="w-8 h-8 rounded-lg overflow-hidden bg-red-950 border border-red-800/60 flex items-center justify-center text-sm font-bold text-red-300">
          {photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photo} alt="" className="w-full h-full object-cover" />
            : initial}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#0B0C0F] shadow-2xl z-[1200] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm text-white truncate">{user?.email}</p>
          </div>
          <nav className="py-1">
            {ITEMS.map((i) => (
              <Link key={i.label} href={i.href} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                <i.icon className="w-4 h-4 text-gray-500" /> {i.label}
              </Link>
            ))}
          </nav>
          <button role="menuitem" onClick={() => { setOpen(false); logout() }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-white/5 border-t border-white/10">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
