'use client';

import { useState, useMemo } from "react";
import { useFilter } from "@/hooks/useFilter";
import { FilterSheet } from "@/components/category/FilterSheet";
import { CategorySidebar } from "@/components/category/CatergorySidebar";
import { CollectionToolbar } from "@/components/category/CollectionToolbar";
import { useProducts } from "@/lib/useCatalog";
import { ProductGrid } from "@/components/category/ProductGrid";
import { ShopByCategory } from "@/components/category/ShopByCategory";
import { getCategorySidebar } from "@/lib/mock-category-data";
import type { Product } from "@/lib/types";
import type { FilterState } from "@/lib/mock-category-data";

/**
 * Apply the active sidebar/price filters to a list of products.
 *
 * - Price: keep products whose USD `basePrice` is within [priceMin, priceMax].
 * - Color / Size: case-insensitive intersection against the product's own arrays.
 * - Hardware / Style: best-effort substring match against the product `name`
 *   (no dedicated field exists for these dimensions).
 *
 * A dimension with nothing selected never excludes a product.
 */
function applyFilters(products: Product[], state: FilterState): Product[] {
  const lower = (arr: string[]) => arr.map((v) => v.toLowerCase());

  const selectedColors = lower(state.color);
  const selectedSizes = lower(state.size);
  const nameTerms = lower([...state.hardware, ...state.style]);

  return products.filter((p) => {
    // Price (USD base)
    if (p.basePrice < state.priceMin || p.basePrice > state.priceMax) {
      return false;
    }

    // Color — intersect product colors (case-insensitive)
    if (selectedColors.length > 0) {
      const productColors = lower(p.colors ?? []);
      const hit = productColors.some((c) =>
        selectedColors.some((sel) => c === sel || c.includes(sel) || sel.includes(c))
      );
      if (!hit) return false;
    }

    // Size — intersect product sizes (case-insensitive)
    if (selectedSizes.length > 0) {
      const productSizes = lower(p.sizes ?? []);
      const hit = productSizes.some((s) =>
        selectedSizes.some((sel) => s === sel || s.includes(sel) || sel.includes(s))
      );
      if (!hit) return false;
    }

    // Hardware + Style — best-effort match against the product name
    if (nameTerms.length > 0) {
      const name = p.name.toLowerCase();
      const hit = nameTerms.some((term) => name.includes(term));
      if (!hit) return false;
    }

    return true;
  });
}

interface CategoryPageClientProps {
    id: string;
    country: string;
    pageTitle: string;
    brandName: string;
    sidebarSections: any;
}

export default function CategoryPageClient({
    id,
    country,
    pageTitle,
    brandName,
    sidebarSections
}: CategoryPageClientProps) {
    const [filterOpen, setFilterOpen] = useState(false);
    const filter = useFilter();
    const { products } = useProducts({ categoryId: id, limit: 50 });

    // Apply the active filters to the products before rendering the grid.
    const filteredProducts = useMemo(
        () => applyFilters(products, filter.state),
        [products, filter.state]
    );

    // Real color/size options present on this page's products (for accurate filter lists).
    const availableColors = useMemo(() => {
        const set = new Set<string>();
        products.forEach((p) => (p.colors ?? []).forEach((c) => set.add(c)));
        return set;
    }, [products]);

    const availableSizes = useMemo(() => {
        const set = new Set<string>();
        products.forEach((p) => (p.sizes ?? []).forEach((s) => set.add(s)));
        return set;
    }, [products]);

    // Find if the current ID matches a section/item/subItem in the resolved sidebar
    const findMatchingData = () => {
        if (!sidebarSections) return null;
        for (const section of sidebarSections) {
            if (section.id === id) {
                return { type: "section" as const, data: section };
            }
            for (const item of section.items) {
                if (item.id === id) {
                    return { type: "item" as const, data: item };
                }
                if (item.subItems) {
                    for (const subItem of item.subItems) {
                        if (subItem.id === id) {
                            return { type: "subItem" as const, data: subItem, parent: item };
                        }
                    }
                }
            }
        }
        return null;
    };

    const matchingData = findMatchingData();

    return (
        <div className="bg-white min-h-screen font-sans antialiased">
            {/* ── Filter slide-over panel ── */}
            <FilterSheet
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                filter={filter}
                availableColors={availableColors}
                availableSizes={availableSizes}
                resultCount={filteredProducts.length}
            />

            {/* ── Page body ── */}
            <div className="max-w-[1200px] mx-auto px-1 lg:px-12 pt-10 lg:pt-14 pb-28">
                <div className="flex flex-col lg:flex-row ">
                    <h1 className=" md:hidden text-[24px] font-medium text-[#1a1a1a] tracking-tight leading-none mb-[18px]">
                        {pageTitle}
                    </h1>

                    {/* ── Left: Sidebar navigation ── */}
                    {sidebarSections && (
                        <CategorySidebar
                            categoryName={brandName}
                            sections={sidebarSections}
                            countryCode={country}
                        />
                    )}

                    {/* ── Right: Main content area ── */}
                    <main className="flex-1 min-w-0 space-y-10 md:px-4">
                        {/* Page heading */}
                        <header>
                            <h1 className="hidden md:flex text-[34px] font-medium text-[#1a1a1a] tracking-tight leading-none mb-[18px]">
                                {pageTitle}
                            </h1>

                            {/* Shop by Category Components based on matching data */}
                            {matchingData?.type === "section" && (
                                <ShopByCategory
                                    title="Shop by Style"
                                    items={matchingData.data.items}
                                    countryCode={country}
                                    variant="style"
                                />
                            )}

                            {matchingData?.type === "item" && matchingData.data.subItems && (
                                <ShopByCategory
                                    title="Shop by Size"
                                    items={matchingData.data.subItems}
                                    countryCode={country}
                                    variant="size"
                                />
                            )}

                            {/* Toolbar: product count + filter + sort + chips */}
                            <CollectionToolbar
                                totalProducts={filteredProducts.length}
                                filter={filter}
                                onFilterOpen={() => setFilterOpen(true)}
                            />
                        </header>

                        {/* Product grid — filtered. The grid renders its own
                            "no products" empty state when the list is empty. */}
                        <ProductGrid
                            products={filteredProducts}
                            countryCode={country}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}