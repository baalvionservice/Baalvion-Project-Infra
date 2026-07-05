"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { themeMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-news-600 dark:hover:text-news-500 transition-colors"
      aria-label={themeMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={themeMode === "light" ? "Enable dark mode" : "Enable light mode"}
    >
      {themeMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
