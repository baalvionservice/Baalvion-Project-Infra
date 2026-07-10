import Link from 'next/link';
import { LogoMark } from '@/components/logo-mark';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-hero px-6 text-center">
      <LogoMark />
      <div className="space-y-3">
        <p className="eyebrow justify-center text-center">404</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">This page does not exist.</h1>
        <p className="text-muted">The page you're looking for may have moved or never existed.</p>
      </div>
      <Link href="/" className="btn-primary focus-ring">
        Return to baalvion.com
      </Link>
    </main>
  );
}
