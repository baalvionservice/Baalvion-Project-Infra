"use client"

import React from 'react';
import { SellerSidebar } from '@/components/admin/seller-sidebar';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import { StoreAccessGuard } from '@/components/auth/StoreAccessGuard';

// NOTE: today these pages actually render gift-card-catalog admin tooling (getMerchantStats,
// getAdminOrders, getAdminCatalog — documented platform-admin-only in lib/api/giftcards.ts), not
// seller product-listing management. This guard only fixes "renders for anyone" — it doesn't fix
// that pre-existing mislabeling; Phase 2 builds the real seller listing UI.
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreAccessGuard>
    <div className="min-h-screen bg-[#050508] flex">
      <SellerSidebar />
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <AdminNavbar />
        <main className="flex-1 pt-24">
          {children}
        </main>
      </div>
    </div>
    </StoreAccessGuard>
  );
}
