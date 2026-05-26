"use client";

import React from "react";
import { useLanguageStore } from "@/store/languageStore";
import { Languages, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * @fileOverview LanguageSwitcher
 * Executive component for real-time linguistic synchronization.
 */
export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguageStore();

  const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिंदी" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border-white/5 hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white">
          <Languages className="w-3.5 h-3.5 text-accent" />
          <span>{currentLang.native}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 glass-panel border-white/10 p-1 mt-2">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`cursor-pointer rounded-lg m-0.5 text-[10px] font-bold uppercase tracking-widest ${
              lang === l.code ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            {l.native}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
