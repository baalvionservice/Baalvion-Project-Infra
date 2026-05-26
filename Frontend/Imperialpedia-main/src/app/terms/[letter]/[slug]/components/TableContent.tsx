"use client";

import { slugify } from "@/modules/content-engine/utils/slugify";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface TableContentProps {
  id: string;
  text: string;
  isActive: boolean;
  onActivate: () => void;
}

export default function TableContent({
  id,
  text,
  isActive,
  onActivate,
}: TableContentProps) {
  // const slug = slugify(id);

  if (!id) return null;

  return (
    <li key={id} className={cn(!isActive && "border-l-2 border-border pl-4",)}>
      <a
        href={`#${id}`}
        className={cn(
          "text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm leading-relaxed block py-1",
          isActive && "text-foreground font-medium"
        )}
        onClick={(e) => {
          onActivate();
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }}
      >
        <span className="flex gap-2">
          {isActive && (
            <ChevronRight fill="blue" className="shrink-0 h-5 w-5 mt-0.5 -ml-[6px] text-blue-900" />
          )}
          {text}
        </span>
      </a>
    </li>
  );
}
