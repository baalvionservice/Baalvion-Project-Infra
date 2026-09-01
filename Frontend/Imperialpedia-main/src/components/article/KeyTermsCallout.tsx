"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { getKeyTermsForTopic } from "@/lib/topic-key-terms";

interface KeyTermsCalloutProps {
  categorySlug?: string;
  className?: string;
}

export function KeyTermsCallout({ categorySlug = "savings", className = "" }: KeyTermsCalloutProps) {
  const terms = getKeyTermsForTopic(categorySlug).slice(0, 3);
  if (!terms || terms.length === 0) return null;

  return (
    <div className={`my-10 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-4 w-4 text-[#1d4fc4]" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 font-sans">
          Key Terms Used in This Guide
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {terms.map((item) => (
          <div
            key={item.term}
            className="flex flex-col justify-between rounded-xl bg-gray-50/70 p-4 border border-gray-100"
          >
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1.5">{item.term}</h4>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {item.definition}
              </p>
            </div>
            {item.href && (
              <Link
                href={item.href}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#1d4fc4] hover:underline"
              >
                Learn more
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
