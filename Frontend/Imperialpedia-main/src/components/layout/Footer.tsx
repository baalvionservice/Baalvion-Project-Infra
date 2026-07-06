import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Explore', href: '/explore' },
      { label: 'Research AI', href: '/research-ai' },
      { label: 'Datasets', href: '/datasets' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Knowledge',
    links: [
      { label: 'Countries', href: '#' },
      { label: 'Companies', href: '#' },
      { label: 'Industries', href: '#' },
      { label: 'Technologies', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'API', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'Developers', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Transparency', href: '/transparency' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

// Kept as a separate mega-footer band (not folded into `footerSections`) because
// at 19 links it would otherwise tower over the 4-item sections it sits beside.
const legalSections = [
  {
    title: 'Editorial Integrity',
    links: [
      { label: 'Editorial Policy', href: '/editorial-policy' },
      { label: 'Corrections Policy', href: '/corrections' },
      { label: 'Fact-Checking Policy', href: '/fact-checking' },
      { label: 'Ethics Policy', href: '/ethics-policy' },
      { label: 'Conflict of Interest Policy', href: '/conflict-of-interest-policy' },
      { label: 'Diversity Policy', href: '/diversity-policy' },
    ],
  },
  {
    title: 'Content & AI',
    links: [
      { label: 'AI Usage Policy', href: '/ai-usage-policy' },
      { label: 'Comment & Community Policy', href: '/comment-policy' },
      { label: 'Source Attribution Policy', href: '/source-attribution-policy' },
    ],
  },
  {
    title: 'Ads & Disclosures',
    links: [
      { label: 'Advertising Policy', href: '/advertising-policy' },
      { label: 'Sponsored Content Policy', href: '/sponsored-content-policy' },
      { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
      { label: 'Ownership Disclosure', href: '/ownership-disclosure' },
    ],
  },
  {
    title: 'Legal & Access',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'DMCA Policy', href: '/dmca-policy' },
      { label: 'Copyright Policy', href: '/copyright-policy' },
      { label: 'Accessibility Statement', href: '/accessibility' },
    ],
  },
];

const Footer = () => {
  const alphabet = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
  return (
    <footer className="border-t bg-card/30 pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-14">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <Text variant="bodySmall" weight="bold" className="uppercase tracking-widest text-foreground">
                {section.title}
              </Text>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-10 mb-16">
          <Text variant="bodySmall" weight="bold" className="uppercase tracking-widest text-foreground mb-6">
            Legal, Trust &amp; Editorial Standards
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
            {legalSections.map((section) => (
              <div key={section.title} className="space-y-3">
                <Text variant="caption" weight="bold" className="uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </Text>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className='flex'>
          {alphabet.map((letter) => (
            <Link
              key={letter}
              href={`/glossary/${letter === "#" ? "num" : letter.toLowerCase()}`}
              className="hover:underline text-3xl p-5"
            >
              {letter}
            </Link>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <Text variant="caption" className="text-muted-foreground">
            © {new Date().getFullYear()} Imperialpedia. AI Knowledge Infrastructure.
          </Text>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">Twitter</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">LinkedIn</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">GitHub</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
