"use client"

import { StoreAccessGuard } from "@/components/auth/StoreAccessGuard";
import { SellerNav } from "@/components/seller/SellerNav";

export default function SellerListingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreAccessGuard>
      <SellerNav />
      {children}
    </StoreAccessGuard>
  );
}
