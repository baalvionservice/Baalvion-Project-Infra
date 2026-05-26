'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redundant Deep Nested Route: Consolidated into flat /product/[id] route.
 * Redirecting to maintain institutional path authority.
 */
export default function RedirectToFlatProduct() {
  const router = useRouter();
  const { country, productId } = useParams();

  useEffect(() => {
    router.replace(`/${country}/product/${productId}`);
  }, [router, country, productId]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-headline italic text-gray-400 uppercase tracking-widest">
      Synchronizing Archive Path...
    </div>
  );
}