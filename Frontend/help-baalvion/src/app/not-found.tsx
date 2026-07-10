import Link from 'next/link';
import { HomeHeroSearch } from '@/components/site/home-hero-search';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xl font-bold text-on-accent">
        B
      </span>
      <div className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-muted-2">404</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">This page doesn&rsquo;t exist.</h1>
        <p className="max-w-sm text-muted">
          The article you&rsquo;re looking for may have moved. Try searching the Help Center instead.
        </p>
      </div>
      <HomeHeroSearch />
      <Link href="/" className="btn-secondary">
        Back to Help Center home
      </Link>
    </main>
  );
}
