"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { articlesPublicApi } from '@/lib/api/client';
import SearchSuggestions from './SearchSuggestions';

interface SearchBarProps {
  initialValue?: string;
  variant?: 'hero' | 'navbar';
}

export default function SearchBar({ initialValue = "", variant = 'hero' }: SearchBarProps) {
  const [queryText, setQueryText] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (queryText.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      articlesPublicApi.list({ search: queryText, limit: 6, status: 'published' })
        .then(res => {
          const items = res.data?.data?.items || res.data?.data || [];
          setSuggestions(items);
          setShowSuggestions(items.length > 0);
        })
        .catch(() => setSuggestions([]));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [queryText]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (queryText.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(queryText.trim())}`);
    }
  };

  if (variant === 'navbar') {
    return (
      <div ref={containerRef} className="relative w-full">
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onFocus={() => queryText.length > 1 && setShowSuggestions(true)}
            placeholder="Search topics..."
            className="w-full h-10 pl-9 pr-8 bg-gray-50 border border-gray-100 rounded-full text-[13px] font-medium placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-[#111827]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <SearchSuggestions
            suggestions={suggestions}
            query={queryText}
            onSelect={(slug) => {
              setShowSuggestions(false);
              router.push(`/article/${slug}`);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative group">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onFocus={() => queryText.length > 1 && setShowSuggestions(true)}
            placeholder="Search legal topics, guides, or tactical terms..."
            className="w-full bg-white border border-gray-100 rounded-[2.5rem] h-20 pl-16 pr-8 text-xl font-medium shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] focus:outline-none focus:border-blue-400 focus:ring-8 focus:ring-blue-50/30 transition-all placeholder:text-gray-300"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <SearchSuggestions
          suggestions={suggestions}
          query={queryText}
          onSelect={(slug) => {
            setShowSuggestions(false);
            router.push(`/article/${slug}`);
          }}
        />
      )}
    </div>
  );
}
