"use client"

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050508] flex overflow-x-hidden">
      {/* Sidebar - Desktop (Static) */}
      <aside className="hidden lg:block w-72 shrink-0">
        <AdminSidebar />
      </aside>

      {/* Sidebar - Mobile/Tablet (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-[101] bg-[#050508] border-r border-white/5 lg:hidden"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <AdminSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="fixed top-0 right-0 left-0 lg:left-72 z-50">
          <AdminNavbar />
          {/* Mobile Menu Toggle (Overlaying Navbar) */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden absolute top-1/2 -translate-y-1/2 left-6 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10 z-[60]"
            aria-label="Open Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>
        
        <main className="flex-1 pt-24 lg:pt-32 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
