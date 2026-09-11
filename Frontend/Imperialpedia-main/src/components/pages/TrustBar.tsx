import Link from "next/link";
import { ShieldCheck, BadgeCheck, Users } from "lucide-react";

/** Real editorial-trust links (the site's own policy pages) — not a fabricated
 * "reviewed by N analysts" badge with no backing record. Shared across the
 * category hubs (Market News, Banking, ...). */
const TRUST_LINKS = [
  { href: "/editorial-policy", label: "Editorial Standards", icon: ShieldCheck },
  { href: "/fact-checking", label: "Fact-Checking Policy", icon: BadgeCheck },
  { href: "/authors", label: "Meet the Newsroom", icon: Users },
];

export function TrustBar() {
  return null;
}
