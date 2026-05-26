"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FilterState,
  PRICE_DEFAULT_MAX,
  PRICE_DEFAULT_MIN,
} from "@/lib/mock-category-data";

export type FilterKey = "color" | "hardware" | "size" | "style";

export interface UseFilterReturn {
  state: FilterState;
  toggle: (key: FilterKey, val: string) => void;
  setPrice: (min: number, max: number) => void;
  clearAll: () => void;
  removeChip: (key: FilterKey | "price", val?: string) => void;
  chips: Array<{ key: FilterKey; val: string }>;
  hasPriceChip: boolean;
  totalActive: number;
  sort: string;
  setSort: (sort: string) => void;
}

export function useFilter(): UseFilterReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getArr = (key: string): string[] => {
    const val = searchParams.get(key);
    return val ? val.split(",").filter(Boolean) : [];
  };

  const state: FilterState = {
    color: getArr("color"),
    hardware: getArr("hardware"),
    size: getArr("size"),
    style: getArr("style"),
    priceMin: Number(searchParams.get("price_min") ?? PRICE_DEFAULT_MIN),
    priceMax: Number(searchParams.get("price_max") ?? PRICE_DEFAULT_MAX),
  };

  const sort = searchParams.get("sort") ?? "featured";

  const push = useCallback(
    (next: FilterState, sortValue?: string) => {
      const p = new URLSearchParams();
      if (next.color.length) p.set("color", next.color.join(","));
      if (next.hardware.length) p.set("hardware", next.hardware.join(","));
      if (next.size.length) p.set("size", next.size.join(","));
      if (next.style.length) p.set("style", next.style.join(","));
      if (next.priceMin !== PRICE_DEFAULT_MIN)
        p.set("price_min", String(next.priceMin));
      if (next.priceMax !== PRICE_DEFAULT_MAX)
        p.set("price_max", String(next.priceMax));

      // Handle sort parameter
      const currentSort = sortValue ?? sort;
      if (currentSort && currentSort !== "featured") {
        p.set("sort", currentSort);
      }

      router.push(`?${p.toString()}`, { scroll: false });
    },
    [router, sort]
  );

  const toggle = useCallback(
    (key: FilterKey, val: string) => {
      const arr = state[key];
      const next = arr.includes(val)
        ? arr.filter((x) => x !== val)
        : [...arr, val];
      push({ ...state, [key]: next });
    },
    [state, push]
  );

  const setPrice = useCallback(
    (min: number, max: number) =>
      push({ ...state, priceMin: min, priceMax: max }),
    [state, push]
  );

  const clearAll = useCallback(
    () =>
      push({
        color: [],
        hardware: [],
        size: [],
        style: [],
        priceMin: PRICE_DEFAULT_MIN,
        priceMax: PRICE_DEFAULT_MAX,
      }),
    [push]
  );

  const removeChip = useCallback(
    (key: FilterKey | "price", val?: string) => {
      if (key === "price") {
        push({
          ...state,
          priceMin: PRICE_DEFAULT_MIN,
          priceMax: PRICE_DEFAULT_MAX,
        });
      } else if (val) {
        toggle(key, val);
      }
    },
    [state, push, toggle]
  );

  const setSort = useCallback(
    (sortValue: string) => {
      push(state, sortValue);
    },
    [state, push]
  );

  const hasPriceChip =
    state.priceMin !== PRICE_DEFAULT_MIN ||
    state.priceMax !== PRICE_DEFAULT_MAX;

  const chipKeys: FilterKey[] = ["color", "hardware", "size", "style"];
  const chips = chipKeys.flatMap((k) =>
    state[k].map((v) => ({ key: k, val: v }))
  );

  const totalActive = chips.length + (hasPriceChip ? 1 : 0);

  return {
    state,
    toggle,
    setPrice,
    clearAll,
    removeChip,
    chips,
    hasPriceChip,
    totalActive,
    sort,
    setSort,
  };
}
