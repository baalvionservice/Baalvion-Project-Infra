"use client";

import { useEffect, useMemo, useState } from "react";

import { ArticleCard } from "@/components/article-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaginatedArticles } from "@/lib/types";

const ALL = "all";
const CATEGORIES = ["AI", "Technology", "Business", "Finance", "Startups", "Cybersecurity", "World", "Science"];
const COUNTRIES = ["US", "UK", "DE", "AU", "CA", "IN"];
const SENTIMENTS = ["positive", "neutral", "negative"];

interface Filters {
  keyword: string;
  country: string;
  category: string;
  sentiment: string;
}

export function ExplorerView() {
  const [filters, setFilters] = useState<Filters>({ keyword: "", country: ALL, category: ALL, sentiment: ALL });
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [result, setResult] = useState<PaginatedArticles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedKeyword(filters.keyword), 350);
    return () => clearTimeout(id);
  }, [filters.keyword]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) params.set("keyword", debouncedKeyword.trim());
    if (filters.country !== ALL) params.set("country", filters.country);
    if (filters.category !== ALL) params.set("category", filters.category);
    if (filters.sentiment !== ALL) params.set("sentiment", filters.sentiment);
    params.set("limit", "20");

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch(`/api/news?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.success) throw new Error(body.error ?? "Failed to load articles");
        setResult(body.data as PaginatedArticles);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedKeyword, filters.country, filters.category, filters.sentiment]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const resultCountLabel = useMemo(() => {
    if (isLoading) return "Loading…";
    if (error) return error;
    return `${result?.total ?? 0} articles match your filters`;
  }, [isLoading, error, result]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="glow-card h-fit space-y-5 rounded-xl p-5">
        <div className="space-y-2">
          <Label htmlFor="explorer-keyword">Keyword</Label>
          <Input
            id="explorer-keyword"
            placeholder="Search title"
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
          />
        </div>

        <FilterSelect label="Country" value={filters.country} options={COUNTRIES} onChange={(v) => updateFilter("country", v)} />
        <FilterSelect label="Category" value={filters.category} options={CATEGORIES} onChange={(v) => updateFilter("category", v)} />
        <FilterSelect label="Sentiment" value={filters.sentiment} options={SENTIMENTS} onChange={(v) => updateFilter("sentiment", v)} />
      </aside>

      <div>
        <p className="mb-4 text-sm text-muted-foreground">{resultCountLabel}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {result?.items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {!isLoading && !error && result?.items.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              No articles yet. The ingestion pipeline hasn&apos;t pulled any real articles into this
              environment — see the note on the Overview page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
