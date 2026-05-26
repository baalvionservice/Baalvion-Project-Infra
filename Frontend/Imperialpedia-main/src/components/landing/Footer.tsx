'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { NewsletterForm } from './NewsletterForm';
import { Twitter, Linkedin, Github, Globe, ShieldCheck, Zap } from 'lucide-react';

/**
 * Specialized Landing Page Footer.
 * Engineered for institutional credibility and navigation.
 */
export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    platform: [
      { label: 'Discovery Index', href: '/explore' },
      { icon: Zap, label: 'AI Analyst', href: '/ai-analyst' },
      { label: 'Market Pulse', href: '/community/sentiment' },
      { label: 'Financial Tools', href: '/financial-tools' },
    ],
    governance: [
      { label: 'Transparency Hub', href: '/transparency' },
      { label: 'Trust Framework', href: '/creators/trust' },
      { label: 'Verified Experts', href: '/creators' },
      { label: 'Leaderboard', href: '/community/leaderboard' },
    ],
    legal: [
      { label: 'Privacy Protocol', href: '#' },
      { label: 'Terms of Traversal', href: '#' },
      { label: 'Editorial Policy', href: '#' },
      { label: 'Security Audit', href: '#' },
    ]
  };

  return (
    <footer className="bg-card/30 border-t border-white/5 pt-20 pb-12 overflow-hidden relative">
      {/* Background Watermark */}
      <div className="absolute -bottom-20 -left-20 opacity-[0.02] pointer-events-none">
        <Globe size={400} />
      </div>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-20">
          {/* Brand & Subtext */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="text-2xl font-headline font-bold text-primary tracking-tight inline-block">
              Imperial<span className="text-foreground">pedia</span>
            </Link>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-sm">
              The world's most scalable financial intelligence engine. Providing institutional-grade structured research across 1,000,000+ programmatic nodes.
            </Text>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                <Github className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <Text variant="label" className="text-[10px] font-bold text-foreground tracking-[0.2em] uppercase">Intelligence</Text>
              <ul className="space-y-4">
                {links.platform.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      {link.icon && <link.icon size={12} className="text-primary" />}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <Text variant="label" className="text-[10px] font-bold text-foreground tracking-[0.2em] uppercase">Trust Node</Text>
              <ul className="space-y-4">
                {links.governance.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-3 space-y-6">
            <Text variant="label" className="text-[10px] font-bold text-foreground tracking-[0.2em] uppercase">Stay Synchronized</Text>
            <Text variant="caption" className="text-muted-foreground leading-relaxed block">
              Subscribe to the Intelligence Wire for real-time market audits and pSEO taxonomy alerts.
            </Text>
            <NewsletterForm />
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <Text variant="caption" className="text-muted-foreground font-medium">
              © {currentYear} Imperialpedia. AI Knowledge Infrastructure.
            </Text>
            <div className="hidden md:flex items-center gap-2 text-emerald-500/50 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" /> Data Traversal Encrypted
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            {links.legal.map((link) => (
              <Link key={link.label} href={link.href} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
};

import { Button } from '@/components/ui/button';
