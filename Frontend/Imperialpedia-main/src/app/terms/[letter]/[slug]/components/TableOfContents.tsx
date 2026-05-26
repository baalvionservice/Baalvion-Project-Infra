"use client";

import { useState } from "react";
import TableContent from "./TableContent";

interface TableOfContentsProps {
  headings: Array<{ id: string; text: string }>;
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="w-64 flex-shrink-0 hidden md:flex">
      <div className="sticky top-20">
        <h3 className="text-foreground text-2xl font-semibold mb-4">
          Table of Contents
        </h3>
        <nav>
          <ul className=" pl-4">
            {headings.map((heading) => (
              <TableContent
                key={heading.id}
                id={heading.id}
                text={heading.text}
                isActive={activeId === heading.id}
                onActivate={() => setActiveId(heading.id)}
              />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
