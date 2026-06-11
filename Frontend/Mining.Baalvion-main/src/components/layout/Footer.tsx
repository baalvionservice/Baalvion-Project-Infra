"use client"

import Link from "next/link";
import { Globe, MapPin, Phone, ShieldCheck, Mail, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16 border-t border-white/5 overflow-hidden">
      <div className="container px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand & Legal Info */}
          <div className="space-y-6 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <Globe className="h-8 w-8 text-secondary" />
              <span className="font-headline text-2xl font-bold tracking-tight">Baalvion <span className="text-secondary">Mining Inc.</span></span>
            </div>
            <p className="text-primary-foreground/60 max-w-sm leading-relaxed text-sm">
              Baalvion Mining Inc. is a global mining brand operated by Baalvion Industries Private Limited. Empowering the world&apos;s mineral trade with security and innovation.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <p className="text-[10px] uppercase font-bold text-primary-foreground/40 leading-tight">
                  Corporate Identification Number (CIN): <br />
                  <span className="text-primary-foreground/80">U43121OD2025PTC048479</span>
                </p>
              </div>
            </div>
          </div>

          {/* Global Offices */}
          <div className="space-y-6">
            <h4 className="font-bold text-white uppercase text-xs tracking-widest border-b border-white/10 pb-4">Global Offices</h4>
            <div className="space-y-6 text-primary-foreground/60 text-xs leading-relaxed">
              <div className="space-y-2">
                <p className="font-bold text-primary-foreground/80 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-secondary" /> Registered Office
                </p>
                <p>C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha – 764036, India</p>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="font-bold text-primary-foreground/80 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-secondary" /> Headquarters
                </p>
                <p>Altamount Road, Lodha Altamount, Mumbai, Maharashtra – 400026, India</p>
              </div>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-6">
            <h4 className="font-bold text-white uppercase text-xs tracking-widest border-b border-white/10 pb-4">Company</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm font-medium">
              <li><Link href="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link href="/leadership" className="hover:text-secondary transition-colors">Leadership</Link></li>
              <li><Link href="/certifications" className="hover:text-secondary transition-colors">Certifications &amp; Licenses</Link></li>
              <li><Link href="/investors" className="hover:text-secondary transition-colors">Investor Relations</Link></li>
              <li><Link href="/esg" className="hover:text-secondary transition-colors">Sustainability &amp; ESG</Link></li>
              <li><Link href="/careers" className="hover:text-secondary transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-secondary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div className="space-y-6">
            <h4 className="font-bold text-white uppercase text-xs tracking-widest border-b border-white/10 pb-4">Ecosystem</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm font-medium">
              <li><Link href="/marketplace" className="hover:text-secondary transition-colors flex items-center gap-2">Marketplace <ArrowRight className="h-3 w-3" /></Link></li>
              <li><Link href="/directory" className="hover:text-secondary transition-colors flex items-center gap-2">Verified Suppliers <ArrowRight className="h-3 w-3" /></Link></li>
              <li><Link href="/solutions" className="hover:text-secondary transition-colors flex items-center gap-2">Trade Solutions <ArrowRight className="h-3 w-3" /></Link></li>
              <li><Link href="/logistics" className="hover:text-secondary transition-colors flex items-center gap-2">Logistics Network <ArrowRight className="h-3 w-3" /></Link></li>
              <li><Link href="/tenders" className="hover:text-secondary transition-colors flex items-center gap-2">Tenders &amp; Procurement <ArrowRight className="h-3 w-3" /></Link></li>
              <li><Link href="/guides" className="hover:text-secondary transition-colors flex items-center gap-2">Knowledge Hub <ArrowRight className="h-3 w-3" /></Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-6">
            <h4 className="font-bold text-white uppercase text-xs tracking-widest border-b border-white/10 pb-4">Contact &amp; Legal</h4>
            <div className="space-y-4 text-primary-foreground/60 text-sm">
              <p className="flex items-center gap-3 font-bold text-white group cursor-pointer hover:text-secondary transition-colors">
                <Phone className="h-4 w-4 text-secondary" /> +91 89512 84770
              </p>
              <p className="flex items-center gap-3 font-medium hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-secondary" /> trade@baalvion.com
              </p>
              <ul className="grid grid-cols-1 gap-2 pt-4 border-t border-white/5 text-xs font-bold uppercase tracking-tighter opacity-60">
                <li><Link href="/terms" className="hover:text-secondary">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-secondary">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-secondary">Cookie Policy</Link></li>
                <li><Link href="/aml-kyc" className="hover:text-secondary">AML / KYC Policy</Link></li>
                <li><Link href="/responsible-sourcing" className="hover:text-secondary">Responsible Sourcing</Link></li>
                <li><Link href="/disclaimer" className="hover:text-secondary">Legal Disclaimer</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-primary-foreground/40">
            © 2026 Baalvion Mining Inc. All rights reserved. Operated by Baalvion Industries Private Limited.
          </p>
          <div className="flex gap-6 opacity-60">
            <Link href="/aml-kyc" className="text-[10px] font-black italic tracking-tighter uppercase hover:text-secondary transition-colors">Compliance-First</Link>
            <Link href="/responsible-sourcing" className="text-[10px] font-black italic tracking-tighter uppercase hover:text-secondary transition-colors">Responsible Sourcing</Link>
            <Link href="/data-processing" className="text-[10px] font-black italic tracking-tighter uppercase hover:text-secondary transition-colors">Data Protection</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
