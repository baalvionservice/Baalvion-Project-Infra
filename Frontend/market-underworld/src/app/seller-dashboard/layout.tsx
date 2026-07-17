"use client"

import React from 'react';
import { SellerSidebar } from '@/components/admin/seller-sidebar';
import { AdminNavbar } from '@/components/admin/admin-navbar';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] flex">
      <SellerSidebar />
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <AdminNavbar />
        <main className="flex-1 pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}
