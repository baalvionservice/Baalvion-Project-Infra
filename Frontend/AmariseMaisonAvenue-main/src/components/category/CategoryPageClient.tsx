'use client';

import { useState, useMemo, useEffect } from "react";
import { useFilter } from "@/hooks/useFilter";
import { FilterSheet } from "@/components/category/FilterSheet";
import { CategorySidebar } from "@/components/category/CatergorySidebar";
import { CollectionToolbar } from "@/components/category/CollectionToolbar";
import { useProducts, useCategories, useDepartments } from "@/lib/useCatalog";
import { ProductGrid } from "@/components/category/ProductGrid";
import { ShopByCategory } from "@/components/category/ShopByCategory";
import { getCategorySidebar } from "@/lib/mock-category-data";
import { buildLiveCategorySidebar } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import type { FilterState } from "@/lib/mock-category-data";

/**
 * Apply the "hardware"/"style" sidebar filters to a list of products.
 *
 * Color, size and price are now enforced server-side (commerce-service real faceted
 * search — see storefrontFilters.js), so pagination totals stay correct. Hardware/style
 * have no dedicated backend column, so they stay a best-effort client-side substring
 * match against the product name, applied on top of the already-server-filtered page.
 *
 * A dimension with nothing selected never excludes a product.
 */
function applyFilters(products: Product[], state: FilterState): Product[] {
  const lower = (arr: string[]) => arr.map((v) => v.toLowerCase());
  const nameTerms = lower([...state.hardware, ...state.style]);
  if (nameTerms.length === 0) return products;

  return products.filter((p) => {
    const name = p.name.toLowerCase();
    return nameTerms.some((term) => name.includes(term));
  });
}

const PAGE_SIZE = 24;

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
    const [page, setPage] = useState(1);
    const filter = useFilter();

    // Real server-side facets (color/size/price — see storefrontFilters.js) + real
    // pagination, so results beyond the first page are actually reachable and the
    // "N results" / page count reflect the full filtered catalog, not just one batch.
    const filterKey = JSON.stringify([filter.state.color, filter.state.size, filter.state.priceMin, filter.state.priceMax]);
    useEffect(() => {
        setPage(1);
    }, [id, filterKey]);

    const { products, total, totalPages } = useProducts({
        categoryId: id,
        limit: PAGE_SIZE,
        page,
        color: filter.state.color.length ? filter.state.color.join(",") : undefined,
        size: filter.state.size.length ? filter.state.size.join(",") : undefined,
        minPrice: filter.state.priceMin,
        maxPrice: filter.state.priceMax,
    });

    // Prefer the LIVE backend category name (matched by id or slug) so the heading reflects the
    // real taxonomy and there's no hardcoded slug→label drift; fall back to the static label prop
    // for categories that have no backend record yet.
    const { categories } = useCategories();
    const { departments } = useDepartments();
    const liveCategoryName = useMemo(() => {
        const match = categories.find(
            (c) => c.id === id || (c as { slug?: string }).slug === id
        );
        return match?.name;
    }, [categories, id]);
    const resolvedTitle = liveCategoryName ?? pageTitle;

    // Prefer a sidebar built from real, admin-managed taxonomy (Commerce → Departments/
    // Categories) over the hardcoded Hermès/Chanel/Goyard/Jewelry sidebar map — falls back to
    // the static mock only for legacy/virtual slugs not yet represented as real categories.
    const liveSidebarSections = useMemo(
        () => buildLiveCategorySidebar(id, categories, departments),
        [id, categories, departments]
    );
    const resolvedSidebarSections = liveSidebarSections ?? sidebarSections;

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
        if (!resolvedSidebarSections) return null;
        for (const section of resolvedSidebarSections) {
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
                resultCount={total}
            />

            {/* ── Page body ── */}
            <div className="max-w-[1200px] mx-auto px-1 lg:px-12 pt-10 lg:pt-14 pb-28">
                <div className="flex flex-col lg:flex-row ">
                    <h1 className=" md:hidden text-[24px] font-medium text-[#1a1a1a] tracking-tight leading-none mb-[18px]">
                        {resolvedTitle}
                    </h1>

                    {/* ── Left: Sidebar navigation ── */}
                    {resolvedSidebarSections && (
                        <CategorySidebar
                            categoryName={brandName}
                            sections={resolvedSidebarSections}
                            countryCode={country}
                        />
                    )}

                    {/* ── Right: Main content area ── */}
                    <main className="flex-1 min-w-0 space-y-10 md:px-4">
                        {/* Page heading */}
                        <header>
                            <h1 className="hidden md:flex text-[34px] font-medium text-[#1a1a1a] tracking-tight leading-none mb-[18px]">
                                {resolvedTitle}
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
                                totalProducts={total}
                                filter={filter}
                                onFilterOpen={() => setFilterOpen(true)}
                            />
                        </header>

                        {/* Product grid — filtered. The grid renders its own
                            "no products" empty state when the list is empty. */}
                        <ProductGrid
                            products={filteredProducts}
                            countryCode={country}
                            filtersActive={filter.totalActive > 0}
                        />

                        {/* Pagination — real, server-backed (was capped at a single
                            50-item batch with no way to reach anything beyond it). */}
                        {totalPages > 1 && (
                            <nav
                                aria-label="Category pagination"
                                className="flex items-center justify-center gap-6 pt-6"
                            >
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="text-[11px] font-bold uppercase tracking-widest text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors hover:text-black"
                                >
                                    Previous
                                </button>
                                <span className="text-[11px] uppercase tracking-widest text-gray-400">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="text-[11px] font-bold uppercase tracking-widest text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors hover:text-black"
                                >
                                    Next
                                </button>
                            </nav>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}