import { notFound } from 'next/navigation';

// No real dataset content or listings exist yet. This route was a skeleton
// placeholder (grey placeholder tiles, no real copy) that was only excluded
// via noindex + robots.ts DISALLOW, which doesn't stop a human (or a manual
// AdSense reviewer) from opening the URL directly and finding unfinished
// content. Hard 404 so there's nothing live to find. Remove once real
// dataset listings ship.
export default function DatasetsPage() {
  notFound();
}
