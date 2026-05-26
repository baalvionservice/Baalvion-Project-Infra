"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const categories = [
  { value: "All", label: "All", href: "/latest" },
  { value: "Markets", label: "Markets", href: "/category/markets" },
  { value: "Economy", label: "Economy", href: "/category/economy" },
  { value: "Crypto", label: "Crypto", href: "/category/crypto" },
  { value: "Banking", label: "Banking", href: "/category/banking" },
  { value: "Startups", label: "Startups", href: "/category/startups" },
  {
    value: "GlobalMarkets",
    label: "Global Markets",
    href: "/category/globalmarkets",
  },
  { value: "RealEstate", label: "Real Estate", href: "/category/realestate" },
  {
    value: "PersonalFinance",
    label: "Personal Finance",
    href: "/category/personalfinance",
  },
];

interface CategoryFilterProps {
  currentCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function CategoryFilter({
  currentCategory = "All",
  onCategoryChange,
}: CategoryFilterProps) {
  const pathname = usePathname();

  const isActive = (category: string) => {
    if (onCategoryChange) {
      return currentCategory === category;
    }

    if (category === "All") {
      return pathname === "/latest";
    }

    return pathname.includes(category.toLowerCase());
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav
        className="flex space-x-8 overflow-x-auto scrollbar-hide"
        aria-label="Categories"
      >
        {categories.map((category) => {
          const active = isActive(category.value);

          if (onCategoryChange) {
            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  active
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {category.label}
              </button>
            );
          }

          return (
            <Link
              key={category.value}
              href={category.href}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                active
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {category.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
