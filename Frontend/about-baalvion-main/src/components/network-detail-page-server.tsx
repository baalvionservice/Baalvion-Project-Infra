import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageFaq } from "@/components/page-faq";
import { NetworkArchitectureDiagram } from "@/components/network-architecture-diagram";
import type { NetworkEntry } from "@/lib/network";
import type { NetworkDetail } from "@/lib/network-detail";

interface NetworkDetailPageServerProps {
  entry: NetworkEntry;
  detail: NetworkDetail;
}

export default function NetworkDetailPageServer({ entry, detail }: NetworkDetailPageServerProps) {
  return (
    <main className="flex-1 pt-40 pb-24">
      <div className="section-container max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1 text-xs font-bold uppercase tracking-widest text-gray-400">
            <li className="flex items-center gap-1">
              <Link href="/network" className="hover:text-primary transition-colors">
                Network
              </Link>
              <ChevronRight className="w-3 h-3" />
            </li>
            <li>
              <span className="text-gray-700">{entry.name}</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="max-w-3xl mb-16 space-y-6 animate-fade-in">
          <span className="section-label">{detail.eyebrow}</span>
          <h1 className="text-gray-900 font-bold leading-tight tracking-tight">{detail.headline}</h1>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-600">
              ● {entry.status}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">{entry.domain}</span>
            <Link
              href={entry.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest hover:text-gray-900 transition-all"
            >
              Visit live site <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Hero screenshot */}
        <div className="mb-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-fade-in">
          <Image
            src={entry.screenshot.src}
            alt={entry.screenshot.alt}
            width={entry.screenshot.width}
            height={entry.screenshot.height}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* Problem / Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">{detail.problemLabel}</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{detail.problem}</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">{detail.solutionLabel}</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{detail.solution}</p>
          </div>
        </div>

        {/* Architecture */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{detail.architecture.heading}</h2>
          <p className="text-gray-500 mb-10 max-w-2xl">{detail.architecture.intro}</p>
          <NetworkArchitectureDiagram diagram={detail.architecture} />
        </section>

        {/* Capabilities */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">What's inside</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {detail.capabilities.map((c) => (
              <div key={c.name} className="border-l-2 border-primary/30 pl-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{c.name}</h3>
                <p className="text-gray-600 leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        {detail.gallery.length > 0 && (
          <section className="mb-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-10">In the product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {detail.gallery.map((g) => (
                <figure key={g.src} className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <Image src={g.src} alt={g.alt} width={g.width} height={g.height} className="w-full h-auto" />
                  </div>
                  <figcaption className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">
                    {g.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Stack */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Built with</h2>
          <div className="flex flex-wrap gap-2">
            {detail.stack.map((tech) => (
              <Badge key={tech} variant="outline" className="font-mono text-xs text-gray-600 border-gray-200 px-3 py-1">
                {tech}
              </Badge>
            ))}
          </div>
        </section>

        <PageFaq faqs={detail.faqs} heading="Frequently asked questions" />

        <p className="mt-16 text-xs text-gray-400 border-t border-gray-100 pt-6">{detail.sourceNote}</p>
      </div>
    </main>
  );
}
