import Link from 'next/link';
import { Wordmark } from '@/components/wordmark';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <Wordmark className="text-foreground" />
      <div className="space-y-3">
        <p className="mono-label text-accent">404</p>
        <h1 className="running-head">This page does not exist.</h1>
        <p className="body">The corporate index lives on the homepage.</p>
      </div>
      <Link href="/" className="btn-primary">
        Return to baalvion.com
        <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}
