"use client"

import { useState } from "react"
import { Bell, Search, X, ShieldAlert, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"

export const AdminNavbar = () => {
  const [showAlert, setShowAlert] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-0 left-72 right-0 z-[60]">
      <AnimatePresence>
        {showAlert && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 flex items-center justify-between px-8"
          >
            <div className="flex items-center gap-3 text-white text-[11px] font-bold uppercase tracking-widest">
              <ShieldAlert className="w-4 h-4" />
              SECURE OPERATIONAL ACCESS — All activity is audited by the central protocol.
            </div>
            <button onClick={() => setShowAlert(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="h-20 bg-[#070710]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-10">
        <div className="flex items-center gap-8 flex-1">
          <div className="relative max-w-md w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-brand-green transition-colors" />
            <input 
              type="text" 
              placeholder="Search platform assets, nodes, hashes..." 
              className="bg-white/5 border border-white/10 h-11 rounded-xl pl-11 pr-4 text-sm text-white w-full outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/20 transition-all"
            />
          </div>

        </div>

        <div className="flex items-center gap-6">
          <button className="relative p-2.5 text-gray-500 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#070710]" />
          </button>
          <div className="h-10 w-px bg-white/5 mx-2" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white leading-none mb-1 max-w-[12rem] truncate">{user?.email ?? "Signed in"}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Signed in</div>
            </div>
            <button onClick={async () => { await logout(); window.location.href = "/" }} title="Sign out" aria-label="Sign out" className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-red-500/10 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
