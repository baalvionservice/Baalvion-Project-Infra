"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FilterAccordionProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function FilterAccordion({
  label,
  children,
  defaultOpen = false,
}: FilterAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#e8e6e3]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-[18px] px-0 bg-transparent border-none cursor-pointer group"
        aria-expanded={open}
      >
        <span className="text-[11.5px] font-bold tracking-[0.12em] text-[#1a1a1a] uppercase">
          {label}
        </span>
        <ChevronDown
          className={`w-[14px] h-[14px] text-[#1a1a1a] transition-transform duration-[250ms] ease-in-out flex-shrink-0 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          strokeWidth={1.6}
        />
      </button>

      {/* Smooth expand with max-height animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pb-5 space-y-[13px]">{children}</div>
      </div>
    </div>
  );
}