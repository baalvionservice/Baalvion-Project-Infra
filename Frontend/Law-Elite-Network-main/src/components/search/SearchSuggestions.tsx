"use client";

import React from 'react';
import { FileText, Loader2, ChevronRight } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: any[];
  query: string;
  isSearching?: boolean;
  onSelect: (slug: string) => void;
}

export default function SearchSuggestions({ suggestions, query, isSearching, onSelect }: SearchSuggestionsProps) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-4 bg-white border border-slate-100 rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-top-2 duration-300">
      <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Related Guides</span>
        {isSearching && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
      </div>

      {isSearching && suggestions.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-slate-400">Searching…</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="py-10 text-center px-6">
          <p className="text-sm font-medium text-slate-500">No guides found for "{query}"</p>
        </div>
      ) : (
      <div className="py-2">
        {suggestions.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.slug)}
            className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-blue-50/50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                {highlightText(item.title, query)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Guide
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
          </button>
        ))}
      </div>
      )}

      {suggestions.length > 0 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Press <span className="text-slate-900">Enter</span> to see all results
          </p>
        </div>
      )}
    </div>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="text-blue-600 underline decoration-blue-200 decoration-2 underline-offset-2">{part}</span>
      : part
  );
}
