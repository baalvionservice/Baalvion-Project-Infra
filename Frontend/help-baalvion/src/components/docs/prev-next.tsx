import Link from 'next/link';
import { findAdjacent } from '@/lib/nav';

export function PrevNext({ pathname }: { pathname: string }) {
  const { prev, next } = findAdjacent(pathname);
  if (!prev && !next) return null;

  return (
    <div className="mt-12 grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2">
      {prev ? (
        <Link href={prev.href} className="doc-card flex flex-col items-start">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-2">Previous</span>
          <span className="mt-1 font-semibold text-foreground">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link href={next.href} className="doc-card flex flex-col items-end text-right">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-2">Next</span>
          <span className="mt-1 font-semibold text-foreground">{next.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
