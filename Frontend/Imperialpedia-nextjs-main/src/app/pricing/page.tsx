import { notFound } from 'next/navigation';

// No real pricing content — the live, working subscription flow is at
// /premium/subscribe. This route was a skeleton placeholder ("Free/Pro/
// Enterprise" cards with no real copy) that was only excluded via noindex +
// robots.ts DISALLOW, which doesn't stop a human (or a manual AdSense
// reviewer) from opening the URL directly and finding unfinished content.
// Hard 404 so there's nothing live to find. Remove once real pricing tiers
// ship here, or delete this route entirely in favor of /premium/subscribe.
export default function PricingPage() {
  notFound();
}
