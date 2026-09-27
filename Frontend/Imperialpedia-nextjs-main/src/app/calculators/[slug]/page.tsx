import { notFound } from 'next/navigation';

// This route duplicated /financial-tools/[slug] (the real, working
// calculator for the same slug) behind a "Calculator Interface Coming Soon"
// placeholder over mock data. It was only excluded via noindex +
// robots.ts DISALLOW, which doesn't stop a human (or a manual AdSense
// reviewer) from opening the URL directly and finding the placeholder.
// Hard 404 so there's nothing live to find — the working tool stays at
// /financial-tools/[slug].
export default function CalculatorPage() {
  notFound();
}
