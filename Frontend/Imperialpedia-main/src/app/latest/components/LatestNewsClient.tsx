"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { NewsLayout } from "./NewsLayout";
import {
  fmtDate,
  getCategoryStyle,
  LIVE_CATEGORIES,
  LiveArticle,
  LiveCategory,
  MAX_ARTICLES,
  MAX_POLL_DURATION,
  POLL_INTERVAL_MS,
  WEBHOOK_POLL,
  WEBHOOK_POST,
} from "../types";

function CategoryBadge({ category }: { category?: string }) {
  return (
    <span
      className={`inline-block text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getCategoryStyle(
        category
      )}`}
    >
      {category ?? "Finance"}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="inline-flex flex-col w-[260px] shrink-0 rounded-2xl border border-border bg-card p-4 gap-3 align-top">
      <div className="h-3 w-2/5 rounded-md bg-muted animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-4/5 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="h-3 w-3/5 rounded-md bg-muted animate-pulse" />
    </div>
  );
}

function ScrollCard({
  article,
  isActive,
  onClick,
}: {
  article: LiveArticle;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-col w-[260px] shrink-0 rounded-2xl border bg-card p-4 text-left cursor-pointer transition-all duration-200 align-top hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${
          isActive
            ? "border-l-4 border-primary bg-primary/5 shadow-md"
            : "border-border hover:border-primary/40"
        }`}
    >
      <CategoryBadge category={article.category} />
      <p className="mt-2 text-sm font-bold text-foreground leading-snug line-clamp-2">
        {article.title}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[0.6rem] text-muted-foreground">
        <span className="bg-muted px-1.5 py-0.5 rounded-md font-semibold">
          {article.sourceName}
        </span>
        <span>{fmtDate(article.publishedAt ?? article.fetchedAt)}</span>
      </div>
    </button>
  );
}

function DetailPanel({ article }: { article: LiveArticle | null }) {
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <span className="text-5xl mb-4">✨</span>
        <p className="text-sm leading-relaxed max-w-xs">
          Select any story from the carousel above to read the full analysis and
          key insights.
        </p>
      </div>
    );
  }
  return (
    <div className="p-5 md:p-7">
      {article.imageUrl && (
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-5">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw,720px"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <CategoryBadge category={article.category} />
      <h2 className="mt-3 text-2xl md:text-[1.7rem] font-extrabold text-foreground leading-tight">
        {article.title}
      </h2>
      <div className="mt-3 mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground pb-5 border-b border-border">
        <span className="bg-muted text-foreground font-semibold px-2 py-0.5 rounded-md">
          {article.sourceName}
        </span>
        <span>{fmtDate(article.publishedAt ?? article.fetchedAt)}</span>
      </div>
      {article.shortDescription && (
        <div className="mb-5 pl-4 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 py-3 pr-4 rounded-r-lg">
          <p className="text-[0.9375rem] font-medium text-foreground leading-relaxed">
            {article.shortDescription}
          </p>
        </div>
      )}
      {article.detailedExplanation && (
        <p className="mb-5 text-[0.9rem] text-muted-foreground leading-[1.8]">
          {article.detailedExplanation}
        </p>
      )}
      {Array.isArray(article.keyPoints) && article.keyPoints.length > 0 && (
        <div className="mb-6 bg-muted/50 rounded-xl p-5">
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-primary mb-3">
            Key Insights
          </p>
          <ul className="space-y-2 pl-4 list-disc">
            {article.keyPoints.map((p, i) => (
              <li key={i} className="text-sm text-foreground leading-relaxed">
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {article.articleUrl && article.articleUrl !== "#" && (
        <Link
          href={article.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
        >
          Read original article
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

type StatusMode = "idle" | "loading" | "success" | "error";

function StatusPill({ mode, text }: { mode: StatusMode; text: string }) {
  const styles: Record<StatusMode, string> = {
    idle: "bg-muted text-muted-foreground border-border",
    loading:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300",
    error:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300",
  };
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold font-mono min-w-[120px] justify-center ${styles[mode]}`}
    >
      <span
        className={`w-2 h-2 rounded-full bg-current flex-shrink-0 ${
          mode === "loading" ? "animate-pulse" : ""
        }`}
      />
      {text}
    </div>
  );
}

export function LatestNewsClient({
  initialCategory = "All",
}: {
  initialCategory?: LiveCategory;
}) {
  const [articles, setArticles] = useState<LiveArticle[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const c = sessionStorage.getItem("imp_live_arts");
      if (c) return JSON.parse(c) as LiveArticle[];
    } catch {
      return [];
    }
    return [];
  });
  const [category, setCategory] = useState<LiveCategory>(initialCategory);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [statusMode, setStatusMode] = useState<StatusMode>("idle");
  const [statusText, setStatusText] = useState("idle");
  const [isPolling, setIsPolling] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);

  const knownUrlsRef = useRef<Set<string>>(new Set());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastNewRef = useRef<number>(Date.now());

  useEffect(() => {
    articles.forEach((a) => knownUrlsRef.current.add(a.articleUrl));
    if (articles.length > 0) {
      const filtered = filterByCategory(articles, initialCategory);
      if (filtered.length) setSelectedUrl(filtered[0].articleUrl);
      setFetchCount(articles.length);
      setStatusMode("success");
      setStatusText(`${articles.length} cached`);
      setTimeout(() => {
        setStatusMode("idle");
        setStatusText("idle");
      }, 2500);
    }
  }, []);

  function filterByCategory(arts: LiveArticle[], cat: LiveCategory) {
    const list =
      cat === "All" ? [...arts] : arts.filter((a) => a.category === cat);
    return list.sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.fetchedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? a.fetchedAt ?? 0).getTime()
    );
  }

  function fmtElapsed(ms: number) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function saveCache(arts: LiveArticle[]) {
    try {
      sessionStorage.setItem(
        "imp_live_arts",
        JSON.stringify(arts.slice(0, MAX_ARTICLES))
      );
    } catch {
      // Ignore quota errors
    }
  }

  const doPoll = useCallback(async () => {
    try {
      const res = await fetch(`${WEBHOOK_POLL}?_=${Date.now()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.warn("Polling request failed", res.status, res.statusText);
        return;
      }
      const text = await res.text();
      if (!text.trim()) {
        console.warn("Polling returned empty response body");
        return;
      }
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.warn("Polling response was not valid JSON", parseError, text);
        return;
      }
      let incoming: LiveArticle[] = [];
      if (Array.isArray(data)) incoming = data;
      else if (
        data &&
        typeof data === "object" &&
        Array.isArray((data as any).articles)
      )
        incoming = (data as any).articles;
      else if (data && typeof data === "object" && (data as any).title)
        incoming = [data as LiveArticle];
      const newArts: LiveArticle[] = [];
      incoming.forEach((a) => {
        if (!a?.title || !a?.articleUrl) return;
        if (knownUrlsRef.current.has(a.articleUrl)) return;
        knownUrlsRef.current.add(a.articleUrl);
        newArts.push(a);
      });
      if (newArts.length > 0) {
        lastNewRef.current = Date.now();
        setArticles((prev) => {
          const updated = [...newArts, ...prev].slice(0, MAX_ARTICLES);
          saveCache(updated);
          setFetchCount(updated.length);
          return updated;
        });
      }
    } catch (err) {
      console.log("Polling error:", err);
    }
  }, []);

  const stopPolling = useCallback((auto = false) => {
    setIsPolling(false);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (uiTimerRef.current) {
      clearInterval(uiTimerRef.current);
      uiTimerRef.current = null;
    }
    const elapsed = startTimeRef.current
      ? fmtElapsed(Date.now() - startTimeRef.current)
      : "";
    startTimeRef.current = null;
    if (auto) {
      setArticles((prev) => {
        setStatusMode("success");
        setStatusText(`✓ ${prev.length} stories · ${elapsed}`);
        setTimeout(() => {
          setStatusMode("idle");
          setStatusText("idle");
        }, 3000);
        return prev;
      });
    } else {
      setStatusMode("idle");
      setStatusText("idle");
    }
  }, []);

  const fetchNews = useCallback(async () => {
    if (isPolling) stopPolling();
    setIsPolling(true);
    setStatusMode("loading");
    setStatusText("connecting…");
    startTimeRef.current = Date.now();
    lastNewRef.current = Date.now();
    await doPoll();
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      await doPoll();
      if (Date.now() - lastNewRef.current > MAX_POLL_DURATION)
        stopPolling(true);
    }, POLL_INTERVAL_MS);
    if (uiTimerRef.current) clearInterval(uiTimerRef.current);
    uiTimerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = fmtElapsed(Date.now() - startTimeRef.current);
      setArticles((prev) => {
        setStatusText(`${prev.length} ready · ${elapsed}`);
        return prev;
      });
    }, 1000);
    fetch(WEBHOOK_POST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "getNews", ts: Date.now() }),
    })
      .then(() => doPoll())
      .catch(() => {});
  }, [isPolling, stopPolling, doPoll]);

  useEffect(
    () => () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (uiTimerRef.current) clearInterval(uiTimerRef.current);
    },
    []
  );

  const filtered = filterByCategory(articles, category);
  const selectedArticle =
    articles.find((a) => a.articleUrl === selectedUrl) ?? filtered[0] ?? null;

  useEffect(() => {
    if (
      filtered.length > 0 &&
      (!selectedUrl || !filtered.find((a) => a.articleUrl === selectedUrl))
    ) {
      setSelectedUrl(filtered[0].articleUrl);
    }
  }, [category, articles]);

  return (
    <div className="min-h-screen bg-background mt-12">
      {/* ── TOP CONTROL BAR ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-extrabold text-foreground leading-none tracking-tight">
                Latest News
              </h1>
              <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider mt-0.5">
                Live financial intelligence
              </p>
            </div>
            {fetchCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[0.65rem] font-bold px-2 py-0.5 rounded-full">
                {fetchCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusPill mode={statusMode} text={statusText} />
            {isPolling ? (
              <button
                onClick={() => stopPolling(false)}
                className="flex items-center gap-1.5 bg-muted text-foreground text-xs font-semibold px-3 py-2 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <span className="w-2 h-2 rounded-sm bg-current" />
                Stop
              </button>
            ) : (
              <button
                onClick={fetchNews}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-.28-4.5" />
                </svg>
                Get News
              </button>
            )}
          </div>
        </div>

        {/* ── CATEGORY NAV ── */}
        <div className="max-w-screen-xl mx-auto px-4 pb-2">
          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {LIVE_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={
                  cat.value === "All"
                    ? "/latest"
                    : `/latest/${cat.value.toLowerCase()}`
                }
                onClick={() => setCategory(cat.value)}
                className={`whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all
                  ${
                    category === cat.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-screen-xl mx-auto px-4 py-5 space-y-6">
        {/* HORIZONTAL SCROLLER */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full bg-primary inline-block ${
                  isPolling ? "animate-pulse" : ""
                }`}
              />
              {category === "All" ? "Latest Stories" : category}
              {filtered.length > 0 && (
                <span className="bg-muted text-muted-foreground text-[0.6rem] px-2 py-0.5 rounded-full font-bold">
                  {filtered.length}
                </span>
              )}
            </h2>
          </div>

          <div
            className="overflow-x-auto overflow-y-hidden scroll-smooth pb-2"
            style={{ scrollbarWidth: "thin" }}
          >
            <div className="inline-flex gap-3 pb-1">
              {isPolling && articles.length === 0 && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
              {!isPolling && articles.length === 0 && (
                <div className="inline-flex items-center justify-center w-80 py-12 text-center text-muted-foreground text-sm rounded-2xl border border-dashed border-border px-6">
                  Click "Get News" to stream live financial stories.
                </div>
              )}
              {filtered.length === 0 && articles.length > 0 && (
                <div className="inline-flex items-center justify-center w-72 py-10 text-center text-muted-foreground text-sm rounded-2xl border border-dashed border-border">
                  No <strong className="mx-1">{category}</strong> stories yet.
                </div>
              )}
              {filtered.map((article) => (
                <ScrollCard
                  key={article.articleUrl}
                  article={article}
                  isActive={article.articleUrl === selectedArticle?.articleUrl}
                  onClick={() => setSelectedUrl(article.articleUrl)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* DETAIL PANEL */}
        <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Full Analysis
            </h3>
            {selectedArticle && (
              <span className="text-xs text-muted-foreground">
                {selectedArticle.sourceName}
              </span>
            )}
          </div>
          <DetailPanel article={selectedArticle} />
        </section>
      </div>
    </div>
  );
}
