"use client"

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { JsonLd } from "./JsonLd";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * @fileOverview SEO-optimized Breadcrumb component.
 * Includes JSON-LD structured data for search engine visibility.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mining.baalvion.com"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": `https://mining.baalvion.com${item.href}`
      }))
    ]
  };

  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-col gap-2", className)}>
      <JsonLd data={breadcrumbSchema} />
      <ol className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <li className="flex items-center gap-2">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
            <Home className="h-3 w-3 group-hover:scale-110 transition-transform" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Link 
              href={item.href} 
              className={cn(
                "hover:text-primary transition-colors",
                index === items.length - 1 ? "text-primary cursor-default" : ""
              )}
              aria-current={index === items.length - 1 ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
