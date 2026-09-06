import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Radio, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NetworkEntry } from "@/lib/network";
import { getNetworkDetail } from "@/lib/network-detail";

interface NetworkPageServerProps {
  entries: NetworkEntry[];
}

/**
 * Server-rendered "Network" page — a real, verified registry of Baalvion
 * properties (see src/lib/network.ts for the sourcing rules). Ships as plain
 * HTML on first paint: no client fetch gates the content, so it is fully
 * crawlable and indexable.
 */
export default function NetworkPageServer({ entries }: NetworkPageServerProps) {
  return (
    <main className="flex-1 pt-40 pb-24">
      <div className="section-container">
        <div className="max-w-4xl mb-24 space-y-8 animate-fade-in">
          <span className="section-label">The Baalvion Network</span>
          <h1 className="text-gray-900 mb-8 font-bold leading-tight tracking-tight">
            Every property, <br />
            verified and live.
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl font-medium">
            A real registry of what the Baalvion platform has actually shipped
            — the corporate foundation, the operating platforms, and the
            independent brands built on top of it. Every domain below is
            checked live before it appears here.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {entries.map((entry, i) => (
            <article
              key={entry.slug}
              id={entry.slug}
              className="group animate-fade-in bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden flex flex-col"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {entry.screenshot && (
                <Link
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-[16/10] overflow-hidden bg-gray-50 border-b border-gray-100"
                >
                  <Image
                    src={entry.screenshot.src}
                    alt={entry.screenshot.alt}
                    width={entry.screenshot.width}
                    height={entry.screenshot.height}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={i === 0}
                  />
                </Link>
              )}

              <div className="p-8 md:p-10 flex flex-col gap-6 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-0 group-hover:text-primary transition-colors">
                    {entry.name}
                  </h2>
                  <span
                    className={
                      entry.status === "Live"
                        ? "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-600 shrink-0 pt-1.5"
                        : "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-600 shrink-0 pt-1.5"
                    }
                  >
                    <Radio className="w-3 h-3" />
                    {entry.status}
                  </span>
                </div>

                <p className="text-base text-gray-600 leading-relaxed">
                  {entry.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {entry.stack.map((tech) => (
                    <Badge
                      key={tech}
                      variant="outline"
                      className="font-mono text-[10px] tracking-wide text-gray-500 border-gray-200"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>

                <div className="pt-6 mt-auto flex items-center justify-between border-t border-gray-50">
                  <span className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">
                    {entry.domain}
                  </span>
                  <div className="flex items-center gap-5">
                    {getNetworkDetail(entry.slug) && (
                      <Link
                        href={`/network/${entry.slug}`}
                        className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Full profile
                      </Link>
                    )}
                    <Link
                      href={entry.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-widest hover:text-gray-900 transition-all"
                    >
                      Visit
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
