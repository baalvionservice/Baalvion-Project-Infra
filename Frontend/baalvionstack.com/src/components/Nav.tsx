'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/**
 * Header with Carbon-style mega menus.
 *
 * Two shapes, both taken from IBM's: a two-pane menu with a category rail on the left driving a
 * three-column product grid on the right, and a flat menu that is just the grid.
 *
 * Every link is rendered into the HTML whether or not its panel is open — panels are hidden with
 * `hidden`, not unmounted — so the whole catalogue remains crawlable and the menu costs nothing
 * to open.
 */

export interface MenuItem {
  name: string;
  desc?: string;
  href: string;
  /** Marks an outbound property so the menu can show it leaves the site. */
  external?: boolean;
}

export interface MenuPane {
  key: string;
  /** Heading above the grid, which is itself a link to that section. */
  heading: string;
  headingHref: string;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  label: string;
  /** Two-pane: a rail of panes. Flat menus supply a single pane and no rail. */
  panes: MenuPane[];
  rail: boolean;
  cta?: { label: string; href: string };
}

export function Nav({ menus, productCount }: { menus: Menu[]; productCount: number }) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Which rail row the pointer is on, per menu. Reset when the menu closes so it always
  // reopens on its first category rather than wherever the pointer happened to leave it.
  const [activePane, setActivePane] = useState<Record<string, string>>({});
  const headerRef = useRef<HTMLElement>(null);

  const open = menus.find((m) => m.id === openId) ?? null;

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenId(null);
        // Return focus to the trigger, or Escape strands keyboard users at the top of the page.
        document.getElementById(`menu-trigger-${openId}`)?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [openId]);

  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
    setActivePane((cur) => ({ ...cur, [id]: menus.find((m) => m.id === id)!.panes[0].key }));
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-[hsl(var(--paper))]">
      <div className="border-b border-[hsl(var(--line))]">
        <div className="mx-auto flex h-12 max-w-[1584px] items-stretch">
          <Link
            href="/"
            className="flex items-center gap-2 border-r border-[hsl(var(--line))] px-6 text-[14px]"
            onClick={() => setOpenId(null)}
          >
            <span className="font-semibold tracking-tight">Baalvion</span>
            <span className="font-light text-[hsl(var(--muted-ink))]">Stack</span>
          </Link>

          <nav aria-label="Main" className="flex items-stretch">
            {menus.map((menu) => (
              <button
                key={menu.id}
                id={`menu-trigger-${menu.id}`}
                type="button"
                aria-expanded={openId === menu.id}
                aria-controls={`menu-panel-${menu.id}`}
                onClick={() => toggle(menu.id)}
                className={`flex items-center gap-2 px-5 text-[14px] transition-colors ${
                  openId === menu.id
                    ? 'bg-[hsl(var(--paper))] text-[hsl(var(--ink))] shadow-[inset_0_0_0_1px_hsl(var(--accent))]'
                    : 'text-[hsl(var(--muted-ink))] hover:bg-[hsl(var(--paper-alt))] hover:text-[hsl(var(--ink))]'
                }`}
              >
                {menu.label}
                <span
                  aria-hidden
                  className={`text-[10px] transition-transform ${openId === menu.id ? 'rotate-180' : ''}`}
                >
                  ▾
                </span>
              </button>
            ))}
          </nav>

          <a
            href="https://baalvion.com"
            className="ml-auto hidden items-center gap-2 border-l border-[hsl(var(--line))] px-6 text-[14px] transition-colors hover:bg-[hsl(var(--paper-alt))] sm:flex"
          >
            baalvion.com
            <span aria-hidden className="text-[hsl(var(--accent))]">
              →
            </span>
          </a>
        </div>
      </div>

      {/* ── Panels ─────────────────────────────────────────────────────────── */}
      {menus.map((menu) => {
        const isOpen = openId === menu.id;
        const current = activePane[menu.id] ?? menu.panes[0].key;
        const pane = menu.panes.find((p) => p.key === current) ?? menu.panes[0];
        return (
          <div
            key={menu.id}
            id={`menu-panel-${menu.id}`}
            hidden={!isOpen}
            className="absolute inset-x-0 top-12 border-b border-[hsl(var(--line))] bg-[hsl(var(--paper))] shadow-[0_16px_32px_-16px_rgba(0,0,0,0.18)]"
          >
            <div className="mx-auto flex max-w-[1584px]">
              {menu.rail ? (
                <div className="flex w-[340px] shrink-0 flex-col border-r border-[hsl(var(--line))]">
                  <ul className="flex-1 py-4">
                    {menu.panes.map((p) => (
                      <li key={p.key}>
                        <button
                          type="button"
                          onMouseEnter={() =>
                            setActivePane((cur) => ({ ...cur, [menu.id]: p.key }))
                          }
                          onFocus={() => setActivePane((cur) => ({ ...cur, [menu.id]: p.key }))}
                          onClick={() => setActivePane((cur) => ({ ...cur, [menu.id]: p.key }))}
                          aria-current={p.key === current}
                          className={`flex w-full items-center justify-between px-6 py-3 text-left text-[15px] transition-colors ${
                            p.key === current
                              ? 'bg-[hsl(var(--paper-alt))] text-[hsl(var(--ink))]'
                              : 'text-[hsl(var(--muted-ink))] hover:bg-[hsl(var(--paper-alt))] hover:text-[hsl(var(--ink))]'
                          }`}
                        >
                          {p.heading}
                          <span className="font-mono text-[12px] tabular-nums opacity-50">
                            {p.items.length}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {menu.cta && (
                    <Link
                      href={menu.cta.href}
                      onClick={() => setOpenId(null)}
                      className="group flex items-center justify-between bg-[hsl(var(--accent))] px-6 py-4 text-[15px] text-white transition-colors hover:brightness-90"
                    >
                      {menu.cta.label}
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  )}
                </div>
              ) : null}

              <div className="min-w-0 flex-1 px-8 py-8">
                <Link
                  href={pane.headingHref}
                  onClick={() => setOpenId(null)}
                  className="group inline-flex items-center gap-3 text-[26px] font-light text-[hsl(var(--accent))]"
                >
                  {pane.heading}
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <ul className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
                  {pane.items.map((item) => (
                    <li key={item.href}>
                      <MenuLink item={item} onNavigate={() => setOpenId(null)} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}

      {/* Dim the page behind an open panel so the menu reads as a layer, not as page content. */}
      {open && (
        <div
          aria-hidden
          onClick={() => setOpenId(null)}
          className="fixed inset-0 top-12 -z-10 bg-black/20"
        />
      )}

      <span className="sr-only">{productCount} products</span>
    </header>
  );
}

function MenuLink({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
  const inner = (
    <>
      <span className="block text-[15px] font-medium group-hover:text-[hsl(var(--accent))]">
        {item.name}
        {item.external && (
          <span aria-hidden className="ml-1.5 text-[hsl(var(--muted-ink))]">
            ↗
          </span>
        )}
      </span>
      {item.desc && (
        <span className="mt-1 block text-[13px] leading-relaxed text-[hsl(var(--muted-ink))]">
          {item.desc}
        </span>
      )}
    </>
  );

  return item.external ? (
    <a href={item.href} className="group block" onClick={onNavigate}>
      {inner}
    </a>
  ) : (
    <Link href={item.href} className="group block" onClick={onNavigate}>
      {inner}
    </Link>
  );
}
