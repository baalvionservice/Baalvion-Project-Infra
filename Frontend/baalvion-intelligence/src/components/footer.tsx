import Link from "next/link";
import { Radar } from "lucide-react";

const columns = [
  {
    title: "Products",
    links: [
      { href: "/pricing", label: "News API" },
      { href: "/pricing", label: "Intelligence API" },
      { href: "/dashboard/alerts", label: "Alerts" },
      { href: "/company/contact", label: "Enterprise" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/blog", label: "Blog" },
      { href: "/pricing", label: "Pricing" },
      { href: "/company/about", label: "Customers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/company/about", label: "About" },
      { href: "/company/contact", label: "Contact" },
      { href: "/company/careers", label: "Careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/refund-policy", label: "Refund & Cancellation" },
      { href: "/legal/shipping-policy", label: "Shipping & Delivery" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="section-container grid gap-10 py-16 md:grid-cols-6">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Radar className="h-5 w-5 text-primary" aria-hidden />
            Baalvion Intelligence
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            The real-time intelligence infrastructure for AI and business. Turn global news into
            structured signal.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Available worldwide. Payments in USD via Razorpay, all major cards accepted.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-semibold text-foreground">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6">
        <div className="section-container flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Baalvion Intelligence. All rights reserved.</p>
          <a href="mailto:support@baalvion.com" className="hover:text-foreground">
            support@baalvion.com
          </a>
        </div>
      </div>
    </footer>
  );
}
