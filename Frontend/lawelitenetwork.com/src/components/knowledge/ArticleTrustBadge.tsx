import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

// General policy, not a per-article claim -- the byline covers that.
export function ArticleTrustBadge() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
      <span className="flex items-center gap-1 font-bold text-slate-700">
        <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
        Editorially independent
      </span>
      <Link href="/editorial-standards" className="hover:text-blue-600 hover:underline">
        Our editorial standards
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/editorial-process" className="hover:text-blue-600 hover:underline">
        How we review
      </Link>
    </div>
  );
}
