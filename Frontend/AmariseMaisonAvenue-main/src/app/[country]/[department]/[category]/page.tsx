'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redundant Nested Category Route: Consolidated into /category/[id] route.
 */
export default function RedirectToFlatCategory() {
  const router = useRouter();
  const { country, category } = useParams();

  useEffect(() => {
    router.replace(`/${country}/category/${category}`);
  }, [router, country, category]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-headline italic text-gray-400 uppercase tracking-widest">
      Synchronizing Registry Node...
    </div>
  );
}