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
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-8 text-xs text-muted-foreground">
      {TRUST_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex items-center gap-1.5 font-semibold hover:text-foreground"
        >
          <link.icon className="h-3.5 w-3.5" />
          {link.label}
        </Link>
      ))}
    </div>
  );
}
