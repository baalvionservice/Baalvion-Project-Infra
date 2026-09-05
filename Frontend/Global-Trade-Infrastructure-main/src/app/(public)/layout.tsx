import { InstitutionalHeader } from '@/components/institutional-header';
import { InstitutionalFooter } from '@/components/institutional-footer';
import { organizationJsonLd, webSiteJsonLd, jsonLdScriptProps } from '@/lib/seo';

/**
 * @file layout.tsx
 * @description The layout for the public/institutional part of the application.
 * It wraps all public pages with the institutional header and footer.
 */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Site-wide structured data: brand entity + searchable website. Scoped to this
          route group rather than the root layout, because the root also wraps the World
          Shipping Directory — a separate property on its own subdomain that declares its
          own WebSite and Organization. */}
      <script {...jsonLdScriptProps(organizationJsonLd())} />
      <script {...jsonLdScriptProps(webSiteJsonLd())} />
      <InstitutionalHeader />
      <main className="flex-1">
        {children}
      </main>
      <InstitutionalFooter />
    </div>
  );
}
