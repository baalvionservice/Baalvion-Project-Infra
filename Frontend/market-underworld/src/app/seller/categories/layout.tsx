"use client"

import { StoreAccessGuard } from "@/components/auth/StoreAccessGuard";
import { SellerNav } from "@/components/seller/SellerNav";

// Scoped to /seller/categories only — NOT the whole /seller tree, since /seller/onboarding must
// stay reachable for sellers who don't have a store yet (StoreAccessGuard redirects there on
// denial; wrapping onboarding itself would be a pointless redirect-to-self).
export default function SellerCategoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreAccessGuard>
      <SellerNav />
      {children}
    </StoreAccessGuard>
  );
}
