import Link from "next/link";
import {
  Presentation,
  BookText,
  FileSpreadsheet,
  Newspaper,
  Megaphone,
  ImageIcon,
  FileText,
  Download,
  Lock,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Investor Resources — dark, server-rendered download center. Resource items
// are illustrative placeholders (href="#"); the real data room is provided to
// qualified and accredited investors on request via the contact-ir route.

interface ResourceItem {
  title: string;
  fileType: string;
}

interface ResourceCategory {
  icon: LucideIcon;
  category: string;
  description: string;
  items: ResourceItem[];
}

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    icon: Presentation,
    category: "Investor Presentations",
    description: "The current strategy and platform overview deck.",
    items: [
      { title: "Baalvion Investor Overview", fileType: "PDF · 4.1 MB" },
      { title: "AI-Native Trade Platform Deep Dive", fileType: "PDF · 3.6 MB" },
      { title: "Corridor Strategy Briefing", fileType: "PDF · 2.2 MB" },
    ],
  },
  {
    icon: BookText,
    category: "Annual Reports",
    description: "Annual review of strategy, progress and governance.",
    items: [
      { title: "Annual Report (Latest)", fileType: "PDF · 6.8 MB" },
      { title: "Governance & Risk Supplement", fileType: "PDF · 1.9 MB" },
    ],
  },
  {
    icon: FileSpreadsheet,
    category: "Financial Statements",
    description: "Provided to qualified investors under NDA.",
    items: [
      { title: "Financial Summary", fileType: "PDF · 1.2 MB" },
      { title: "Capital Allocation Framework", fileType: "PDF · 0.9 MB" },
      { title: "Data Room Index", fileType: "XLSX · 0.4 MB" },
    ],
  },
  {
    icon: Newspaper,
    category: "News Releases",
    description: "Official company announcements and updates.",
    items: [
      { title: "Platform Milestone Release", fileType: "PDF · 0.3 MB" },
      { title: "Corridor Expansion Announcement", fileType: "PDF · 0.3 MB" },
    ],
  },
  {
    icon: Megaphone,
    category: "Press Coverage",
    description: "Selected third-party coverage of Baalvion.",
    items: [
      { title: "Coverage Highlights", fileType: "PDF · 1.1 MB" },
      { title: "Industry Commentary Digest", fileType: "PDF · 0.8 MB" },
    ],
  },
  {
    icon: ImageIcon,
    category: "Media Kit",
    description: "Logos, brand assets and company fact sheet.",
    items: [
      { title: "Brand & Logo Pack", fileType: "ZIP · 12.4 MB" },
      { title: "Company Fact Sheet", fileType: "PDF · 0.5 MB" },
      { title: "Executive Photography", fileType: "ZIP · 8.7 MB" },
    ],
  },
];

export default function InvestorResourcesSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Investor Resources
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            The investor download center.
          </h2>
          <p className="mt-6 text-lg text-white/70">
            Key investor materials in one place. Documents listed here are
            illustrative; complete and current materials, including financial
            detail, are provided to qualified and accredited investors under
            appropriate confidentiality arrangements.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/resources/contact-ir">Request full data room</Link>
            </Button>
            <p className="flex items-center gap-2 text-xs text-white/50">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Full data room available to qualified &amp; accredited investors.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_CATEGORIES.map((cat) => (
            <div
              key={cat.category}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-white/20"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <cat.icon className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white">
                    {cat.category}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {cat.description}
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-1.5 border-t border-white/10 pt-4">
                {cat.items.map((item) => (
                  <li key={item.title}>
                    <Link
                      href="#"
                      className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white/90">
                          {item.title}
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-white/15 text-[0.65rem] font-medium text-white/50"
                      >
                        {item.fileType}
                      </Badge>
                      <Download className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold tracking-tight text-white">
              Need something specific?
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Request access to the full data room or ask our investor relations
              team for a particular document.
            </p>
          </div>
          <Link
            href="/resources/contact-ir"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Contact investor relations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
