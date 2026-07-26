"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  country: string;
  timeZone: string;
}

/**
 * Auto-appears the moment an article is tagged with a country that has a
 * known timezone (see lib/data/countryTimezones.ts) — no per-article or
 * per-country admin config. Starts blank and fills in only after mount, the
 * same pattern as the masthead clock (TopNav.tsx): computing `new Date()`
 * during SSR would render in the server's timezone, then mismatch the
 * instant the client recomputes it in the visitor's — this avoids that
 * hydration warning entirely.
 */
export function CountryLocalClock({ country, timeZone }: Props) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const format = () => {
      try {
        return new Date().toLocaleString("en-US", {
          timeZone,
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        });
      } catch {
        return "";
      }
    };
    setTime(format());
    const id = setInterval(() => setTime(format()), 60_000);
    return () => clearInterval(id);
  }, [timeZone]);

  if (!time) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" suppressHydrationWarning>
      <Clock className="h-3.5 w-3.5" />
      Local time in {country}: <span className="font-medium text-foreground">{time}</span>
    </span>
  );
}
