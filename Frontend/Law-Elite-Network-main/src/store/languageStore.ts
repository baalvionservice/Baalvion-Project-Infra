import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * @fileOverview LanguageStore
 * Manages the platform's linguistic state with persistent storage.
 */

interface LanguageState {
  lang: string;
  setLang: (lang: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang: string) => set({ lang }),
    }),
    {
      name: "law-elite-language-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
