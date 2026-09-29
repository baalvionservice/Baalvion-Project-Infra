"use client"

import React from 'react';
import { TeacherSidebar } from '@/components/admin/teacher-sidebar';
import { AdminNavbar } from '@/components/admin/admin-navbar';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] flex">
      <TeacherSidebar />
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <AdminNavbar />
        <main className="flex-1 pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}
