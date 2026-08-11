"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";

/**
 * Self-contained search bar for non-modal pages (404, etc.) that don't already
 * manage their own query state: submitting navigates straight to /search?q=...,
 * using the same input styling as the command-palette modal and the /search page.
 */
export function InlineSearchBar({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <SearchBar
      value={value}
      onChange={setValue}
      onSubmit={(v) => {
        const trimmed = v.trim();
        router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}
