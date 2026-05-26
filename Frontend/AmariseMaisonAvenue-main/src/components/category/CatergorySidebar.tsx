"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronRight, X } from "lucide-react";
import {
  SidebarNavItem,
  SidebarSection,
} from "@/lib/mock-category-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "../ui/sheet";

// ─── Single sub-link ──────────────────────────────────────────────────────────
function SidebarSubLink({
  label,
  id,
  countryCode,
}: {
  label: string;
  id: string;
  countryCode: string;
}) {
  return (
    <Link
      href={`/${countryCode}/category/${id}`}
      className="block text-[11.5px] font-light text-[#7a7570] hover:text-[#1a1a1a] transition-colors duration-150 tracking-wide leading-relaxed"
    >
      {label}
    </Link>
  );
}

// ─── Single nav item (may have sub-items) ─────────────────────────────────────
function SidebarNavItemRow({
  item,
  countryCode,
}: {
  item: SidebarNavItem;
  countryCode: string;
}) {
  const hasChildren = Boolean(item.subItems?.length);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between py-1.5 text-[12.5px] tracking-wide text-[#5a5550] hover:text-[#1a1a1a] transition-colors duration-150 bg-transparent border-none text-left leading-snug ${
          hasChildren ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <Link href={`/${countryCode}/category/${item.id}`}>{item.label}</Link>
        {hasChildren &&
          (open ? (
            <ChevronUp className="w-3 h-3 text-[#ccc] flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[#ccc] flex-shrink-0" />
          ))}
      </button>

      {hasChildren && open && (
        <div className="pl-4 mt-1.5 mb-3 space-y-2.5">
          {item.subItems!.map((sub) => (
            <SidebarSubLink
              key={sub.id}
              label={sub.label}
              id={sub.id}
              countryCode={countryCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section accordion ────────────────────────────────────────────────────────
function SidebarSectionBlock({
  section,
  countryCode,
}: {
  section: SidebarSection;
  countryCode: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-[#ece9e4] pb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 text-[11px] font-bold tracking-[0.18em] uppercase text-[#1a1a1a] bg-transparent border-none cursor-pointer"
      >
        <Link href={`/${countryCode}/category/${section.id}`}>
          {section.label}
        </Link>
        {section.items.length  >  0 && (open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0" />
        ))}
      </button>

      {open && (
        <div className="pl-1 space-y-0.5 mb-2">
          {section.items.map((item) => (
            <SidebarNavItemRow
              key={item.id}
              item={item}
              countryCode={countryCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mobile Section accordion ─────────────────────────────────────────────────
function MobileSidebarSectionBlock({
  section,
  countryCode,
}: {
  section: SidebarSection;
  countryCode: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-[#ece9e4] pb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 text-[13px] font-bold tracking-[0.12em] uppercase text-[#1a1a1a] bg-transparent border-none cursor-pointer"
      >
        <SheetClose asChild>
          <Link href={`/${countryCode}/category/${section.id}`}>
            {section.label}
          </Link>
        </SheetClose>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#aaa] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#aaa] flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="pl-1 space-y-0.5 mb-2">
          {section.items.map((item) => (
            <MobileSidebarNavItemRow
              key={item.id}
              item={item}
              countryCode={countryCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mobile nav item (may have sub-items) ─────────────────────────────────────
function MobileSidebarNavItemRow({
  item,
  countryCode,
}: {
  item: SidebarNavItem;
  countryCode: string;
}) {
  const hasChildren = Boolean(item.subItems?.length);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="w-full flex items-center justify-between py-2 text-[13px] tracking-wide text-[#5a5550] hover:text-[#1a1a1a] transition-colors duration-150">
        <SheetClose asChild>
          <Link href={`/${countryCode}/category/${item.id}`} className="flex-1">
            {item.label}
          </Link>
        </SheetClose>
        {hasChildren && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-1 hover:bg-gray-50 rounded-sm transition-colors"
          >
            {open ? (
              <ChevronUp className="w-3 h-3 text-[#ccc] flex-shrink-0" />
            ) : (
              <ChevronDown className="w-3 h-3 text-[#ccc] flex-shrink-0" />
            )}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="pl-4 mt-1 mb-3 space-y-2">
          {item.subItems!.map((sub) => (
            <SheetClose asChild key={sub.id}>
              <Link
                href={`/${countryCode}/category/${sub.id}`}
                className="block text-[12px] font-light text-[#7a7570] hover:text-[#1a1a1a] transition-colors duration-150 tracking-wide leading-relaxed py-1"
              >
                {sub.label}
              </Link>
            </SheetClose>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Full Sidebar ─────────────────────────────────────────────────────────────
interface CategorySidebarProps {
  categoryName: string;
  sections: SidebarSection[];
  countryCode?: string;
}

export function CategorySidebar({
  categoryName,
  sections,
  countryCode = "us",
}: CategorySidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <button className="w-full inline-flex items-center justify-center text-center py-3 px-4 bg-white border border-black text-[13px] font-medium text-[#1a1a1a] hover:bg-gray-50 transition-colors">
              <span className="tracking-widest uppercase font-semibold">
                {categoryName} Collection
              </span>
              <ChevronRight className="w-4 h-4 mb-1 text-black" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[88%] gap-0 sm:max-w-[420px] p-0 bg-white border-none rounded-none flex flex-col h-full shadow-2xl"
          >
            {/* Close button row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#ece9e4]">
              <h2 className="text-[18px] font-medium text-[#6a6560] tracking-tight">
                {categoryName}
              </h2>
              <SheetClose asChild>
                <button className="p-1 hover:bg-gray-50 rounded-sm transition-colors">
                  <X className="w-5 h-5 stroke-1 text-[#aaa]" />
                </button>
              </SheetClose>
            </div>

            {/* Navigation content */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <nav className="space-y-0">
                {sections.map((section) => (
                  <MobileSidebarSectionBlock
                    key={section.id}
                    section={section}
                    countryCode={countryCode}
                  />
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <aside className="lg:w-48 xl:w-52 shrink-0">
      {/* Category heading */}
      <div className="pb-4 mb-1 border-b border-[#ece9e4]">
        <h2 className="text-[22px] font-medium text-[#6a6560] tracking-tight leading-tight">
          {categoryName}
        </h2>
      </div>

      {/* Nav sections */}
      <nav className="space-y-0 mt-2">
        {sections.map((section) => (
          <SidebarSectionBlock
            key={section.id}
            section={section}
            countryCode={countryCode}
          />
        ))}
      </nav>
    </aside>
  );
}
