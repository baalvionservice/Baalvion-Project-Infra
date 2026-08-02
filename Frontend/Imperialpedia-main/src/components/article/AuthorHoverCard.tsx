"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowRight, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Investopedia-style byline hover card: hovering (or focusing, for keyboard users)
// the author name surfaces photo + credentials + bio inline, so the trust signal
// is visible without leaving the article. Built on the existing Popover primitive
// with a controlled `open` state driven by hover/focus instead of click — there's
// no dedicated @radix-ui/react-hover-card dependency in this codebase, and this
// avoids adding one for what Popover's controlled-open API already covers.
const CLOSE_DELAY_MS = 150;

interface HoverCardAuthor {
  slug: string;
  name: string;
  title?: string;
  bio?: string;
  credentials?: string;
  avatarUrl?: string;
}

export function AuthorHoverCard({
  author,
  children,
}: {
  author: HoverCardAuthor;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          onFocus={() => setOpen(true)}
          onBlur={scheduleClose}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-5"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="flex items-start gap-3">
          {author.avatarUrl && (
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
              <Image src={author.avatarUrl} alt={author.name} fill className="object-cover" sizes="56px" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground leading-tight">{author.name}</p>
            {author.title && <p className="text-xs text-muted-foreground">{author.title}</p>}
            {author.credentials && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                <BadgeCheck className="h-3.5 w-3.5" /> {author.credentials}
              </p>
            )}
          </div>
        </div>

        {author.bio && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-4">{author.bio}</p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs font-semibold">
          <Link href={`/authors/${author.slug}`} className="flex items-center gap-1 text-primary hover:underline">
            Full Bio <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/editorial-policy" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ShieldCheck className="h-3 w-3" /> Editorial Policy
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
