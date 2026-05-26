'use client';

import React from 'react';
import Link from 'next/link';
import FooterLink from './FooterLink';
import SocialIcon from './SocialIcon';
import { Linkedin, Twitter, Facebook, Globe, ShieldCheck } from 'lucide-react';
import { NewsletterForm } from '@/components/landing/NewsletterForm';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';

/**
 * Global Platform Footer Hub.
 * Orchestrates navigation, social discovery, and newsletter synchronization.
 */
export default function FooterSection() {
  return (
    <footer className="bg-card/30 border-t border-white/5 py-16 relative overflow-hidden" role="contentinfo">
      {/* Background Architectural Element */}
      <div className="absolute -bottom-24 -left-24 opacity-[0.02] pointer-events-none" aria-hidden="true">
        <Globe size={480} />
      </div>

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-24 mb-16">
          {/* Quick Links Node */}
          <div className="lg:col-span-3 space-y-6">
            <Text variant="label" className="text-[10px] font-bold text-foreground/60 tracking-[0.2em] uppercase">Navigation Hub</Text>
            <nav className="flex flex-col space-y-3" aria-label="Footer quick links">
              <FooterLink href="/about" text="About The Hub" />
              <FooterLink href="/explore" text="Knowledge Index" />
              <FooterLink href="/contact" text="Contact Governance" />
              <FooterLink href="/privacy-policy" text="Privacy Protocol" />
              <FooterLink href="/terms-of-service" text="Terms of Traversal" />
            </nav>
          </div>

          {/* Social Discovery Node */}
          <div className="lg:col-span-4 space-y-6">
            <Text variant="label" className="text-[10px] font-bold text-foreground/60 tracking-[0.2em] uppercase">Social Discovery</Text>
            <div className="flex items-center gap-2">
              <SocialIcon href="https://linkedin.com/company/imperialpedia" icon={Linkedin} label="LinkedIn" />
              <SocialIcon href="https://twitter.com/imperialpedia" icon={Twitter} label="Twitter" />
              <SocialIcon href="https://facebook.com/imperialpedia" icon={Facebook} label="Facebook" />
            </div>
            <div className="pt-4 flex items-center gap-3 text-emerald-500/40 text-[9px] font-bold uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5" /> Identity Matrix Secured
            </div>
          </div>

          {/* Newsletter Ingestion Node */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <Text variant="label" className="text-[10px] font-bold text-foreground/60 tracking-[0.2em] uppercase">Intelligence Sync</Text>
              <Text variant="caption" className="text-muted-foreground leading-relaxed block max-w-sm">
                Subscribe to the Intelligence Wire for real-time market audits and pSEO alerts.
              </Text>
            </div>
            <NewsletterForm />
          </div>
        </div>

        {/* Legal & Copyright Ledger */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <Text variant="caption" className="text-muted-foreground font-medium">
            &copy; {new Date().getFullYear()} Imperialpedia. AI Knowledge Infrastructure.
          </Text>
          <div className="flex items-center gap-8">
            <Link href="/privacy-policy" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:text-foreground">Privacy</Link>
            <Link href="/terms-of-service" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:text-foreground">Terms</Link>
            <Link href="/contact" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:text-foreground">Contact</Link>
          </div>
        </div>
      </Container>

      {/* TODO: AI-driven personalized footer links based on visitor behavior */}
      {/* TODO: Dynamic social icons or partner logos per segment */}
      {/* TODO: Analytics tracking for clicks on links and social icons */}
    </footer>
  );
}
