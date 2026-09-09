import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { counts, productsByCategory, PRODUCTS } from '@/lib/products';
import { Nav, type Menu } from '@/components/Nav';

// Weight 300 carries the display type; 400/500 carry body and labels.
const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://baalvionstack.com'),
  title: {
    default: 'Baalvion Stack — every product Baalvion builds and operates',
    template: '%s — Baalvion Stack',
  },
  description:
    'The complete index of products built and operated by Baalvion Industries — trade infrastructure, commerce, markets, knowledge and platform services, with the operating status of each.',
  openGraph: { type: 'website', siteName: 'Baalvion Stack', url: 'https://baalvionstack.com' },
  robots: { index: true, follow: true },
};

/**
 * Menus are derived from the registry, so a new product appears in the navigation the same way it
 * appears everywhere else — by being registered. There is no menu list to maintain.
 */
function buildMenus(): Menu[] {
  const slug = (c: string) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const products: Menu = {
    id: 'products',
    label: 'Products',
    rail: true,
    cta: { label: 'Explore all products', href: '/' },
    panes: productsByCategory().map((section) => ({
      key: slug(section.category),
      heading: section.category,
      headingHref: `/#${slug(section.category)}`,
      items: section.products.map((p) => ({
        name: p.name,
        // The product's own headline where it has one, else the factual description trimmed —
        // never a line written just to fill the menu.
        desc: p.tagline ?? p.description?.split(' — ')[0],
        href: `/products/${p.id}`,
      })),
    })),
  };

  // Flat menu, like Carbon's Support: no rail, just the grid.
  const live = (id: string) => PRODUCTS.find((p) => p.id === id && p.href);
  const company: Menu = {
    id: 'company',
    label: 'Company',
    rail: false,
    panes: [
      {
        key: 'company',
        heading: 'Company',
        headingHref: '/',
        items: [
          ...['baalvion', 'about', 'ir', 'jobs', 'help']
            .map(live)
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .map((p) => ({ name: p.name, desc: p.tagline ?? p.description, href: p.href!, external: true })),
        ],
      },
    ],
  };

  return [products, company];
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { total } = counts();
  const menus = buildMenus();
  return (
    <html lang="en" className={`${plex.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">
        <Nav menus={menus} productCount={total} />

        <main>{children}</main>

        <footer className="mt-32 border-t border-[hsl(var(--line))] bg-[hsl(var(--paper-alt))]">
          <div className="mx-auto max-w-[1584px] px-6 py-16">
            <p className="max-w-xl text-[14px] leading-relaxed text-[hsl(var(--muted-ink))]">
              Baalvion Stack is generated from the platform’s own service registry, so every product
              listed here is one the platform actually knows about, with the operating status it
              actually has.
            </p>
            <p className="mt-10 font-mono text-[12px] text-[hsl(var(--muted-ink))]">
              © {new Date().getFullYear()} Baalvion Industries Private Limited
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
