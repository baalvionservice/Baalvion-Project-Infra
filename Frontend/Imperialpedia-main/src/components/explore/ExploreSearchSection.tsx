"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { Text } from "@/design-system/typography/text";

/**
 * Client-side search section for the Explore page
 */
export const ExploreSearchSection = () => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="max-w-2xl">
      <div className="p-4 bg-card/30 border border-white/5 rounded-3xl shadow-2xl backdrop-blur-sm">
        <SearchBar value={searchValue} onChange={setSearchValue} />
      </div>
      <Text
        variant="caption"
        className="mt-4 ml-2 text-muted-foreground italic"
      >
        "Try searching for 'NVIDIA', 'Japan', or 'Generative AI'"
      </Text>
    </div>
  );
};
