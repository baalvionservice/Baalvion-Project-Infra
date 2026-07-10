'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DOCS_SECTIONS } from '@/lib/nav';
import { DocsTopbar } from '@/components/docs/docs-topbar';
import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { SearchDialog } from '@/components/docs/search-dialog';
import { SiteFooter } from '@/components/site/site-footer';

export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const slug = pathname.split('/').filter(Boolean)[0];
  const section = DOCS_SECTIONS.find((s) => s.slug === slug) ?? DOCS_SECTIONS[0];

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <DocsTopbar onOpenSearch={() => setSearchOpen(true)} onToggleMobileNav={() => setMobileNavOpen((v) => !v)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="container-site flex flex-1 gap-10">
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 shrink-0 overflow-y-auto border-r border-line bg-ground px-4 pb-10 pt-20 transition-transform lg:sticky lg:top-16 lg:z-0 lg:block lg:h-[calc(100vh-4rem)] lg:w-64 lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:pt-8 ${
            mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <DocsSidebar section={section} onNavigate={() => setMobileNavOpen(false)} />
        </aside>

        {mobileNavOpen && (
          <div
            role="presentation"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-20 bg-ground/60 backdrop-blur-sm lg:hidden"
          />
        )}

        <main className="min-w-0 flex-1 py-8">{children}</main>
      </div>

      <SiteFooter />
    </div>
  );
}
