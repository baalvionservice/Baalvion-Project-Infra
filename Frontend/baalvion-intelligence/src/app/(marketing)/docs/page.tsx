import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { docsNav } from "@/lib/docs-nav";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Everything you need to integrate the Baalvion Intelligence News API into your product or agent.",
};

export default function DocsIndexPage() {
  return (
    <div>
      <span className="eyebrow">Documentation</span>
      <h1>Build with Baalvion Intelligence</h1>
      <p>
        Start with authentication and your first request, then explore endpoints, SDKs, and
        webhooks as your integration grows.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {docsNav
          .filter((item) => item.available)
          .map((item) => (
            <Link
              key={item.slug}
              href={`/docs/${item.slug}`}
              className="glow-card flex items-center justify-between rounded-lg p-5"
            >
              <span className="font-medium text-foreground">{item.title}</span>
              <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
            </Link>
          ))}
      </div>
    </div>
  );
}
