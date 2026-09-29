"use client"

import Link from "next/link";
import { Globe, MapPin, Phone, ShieldCheck, Mail, Linkedin, Twitter } from "lucide-react";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Corporate",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Leadership", href: "/leadership" },
      { label: "Investor Relations", href: "/investors" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Operations",
    links: [
      { label: "Mining Operations", href: "/operations" },
      { label: "Quarry Operations", href: "/quarry" },
      { label: "Products & Minerals", href: "/products" },
      { label: "Logistics", href: "/logistics" },
      { label: "Tenders & Procurement", href: "/tenders" },
    ],
  },
  {
    heading: "Compliance",
    links: [
      { label: "Licenses", href: "/licenses" },
      { label: "Certifications", href: "/certifications" },
      { label: "Sustainability (ESG)", href: "/esg" },
      { label: "Health, Safety & Environment", href: "/hse" },
      { label: "Responsible Sourcing", href: "/responsible-sourcing" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "AML / KYC", href: "/aml-kyc" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16 border-t border-white/5 overflow-hidden">
      <div className="container px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand + contact + social */}
          <div className="space-y-6 lg:col-span-4">
            <div className="flex items-center gap-2 text-white">
              <Globe className="h-8 w-8 text-secondary" />
              <span className="font-headline text-2xl font-bold tracking-tight">Baalvion <span className="text-secondary">Mining Inc.</span></span>
            </div>
            <p className="text-primary-foreground/60 max-w-sm leading-relaxed text-sm">
              Mining, quarry operations, mineral trading, logistics and industrial supply —
              operated by Baalvion Industries Private Limited.
            </p>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <p className="text-[10px] uppercase font-bold text-primary-foreground/40 leading-tight">
                Corporate Identification Number (CIN):<br />
                <span className="text-primary-foreground/80">U43121OD2025PTC048479</span>
              </p>
            </div>

            <div className="space-y-4 text-xs text-primary-foreground/60 leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                <span><span className="font-bold text-primary-foreground/80">Headquarters:</span> Altamount Road, Lodha Altamount, Mumbai, Maharashtra – 400026, India</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                <span><span className="font-bold text-primary-foreground/80">Registered Office:</span> C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha – 764036, India</span>
              </div>
              <p className="flex items-center gap-2 font-bold text-white"><Phone className="h-4 w-4 text-secondary" /> +91 89512 84770</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-secondary" /> trade@baalvion.com</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <a href="https://www.linkedin.com/company/baalvion" target="_blank" rel="noopener noreferrer" aria-label="Baalvion on LinkedIn" className="rounded-lg border border-white/10 p-2 hover:border-secondary hover:text-secondary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://twitter.com/baalvion" target="_blank" rel="noopener noreferrer" aria-label="Baalvion on X" className="rounded-lg border border-white/10 p-2 hover:border-secondary hover:text-secondary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.heading} className="space-y-5">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest border-b border-white/10 pb-4">{col.heading}</h4>
                <ul className="space-y-3 text-primary-foreground/60 text-sm font-medium">
                  {col.links.map((l) => (
                    <li key={l.href}><Link href={l.href} className="hover:text-secondary transition-colors">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-primary-foreground/40">
            © 2026 Baalvion Mining Inc. All rights reserved. Operated by Baalvion Industries Private Limited.
          </p>
          <div className="flex flex-wrap gap-6 opacity-60">
            <Link href="/data-processing" className="text-[10px] font-black italic tracking-tighter uppercase hover:text-secondary transition-colors">Data Protection</Link>
            <Link href="/corporate-documents" className="text-[10px] font-black italic tracking-tighter uppercase hover:text-secondary transition-colors">Corporate Documents</Link>
            <Link href="/licenses" className="text-[10px] font-black italic tracking-tighter uppercase hover:text-secondary transition-colors">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
