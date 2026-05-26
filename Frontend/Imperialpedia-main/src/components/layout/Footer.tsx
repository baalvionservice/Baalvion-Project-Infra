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
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms', href: '/terms-of-service' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

const Footer = () => {
  const alphabet = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
  return (
    <footer className="border-t bg-card/30 pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
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
