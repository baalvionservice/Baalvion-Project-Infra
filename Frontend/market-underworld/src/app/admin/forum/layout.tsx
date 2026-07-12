
"use client"

import { ForumSidebar } from "@/components/admin/forum-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"

export default function ForumAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#070710] text-[#e5e7eb]">
      <ForumSidebar />
      <div className="relative z-10 pl-72">
        <AdminNavbar />
        <main className="pt-24 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
