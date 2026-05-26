'use client';

import { useState, useMemo } from "react";
import { useFilter } from "@/hooks/useFilter";
import { FilterSheet } from "@/components/category/FilterSheet";
import { CategorySidebar } from "@/components/category/CatergorySidebar";
import { CollectionToolbar } from "@/components/category/CollectionToolbar";
import { PRODUCTS } from "@/lib/mock-data";
import { ProductGrid } from "@/components/category/ProductGrid";
import { ShopByCategory } from "@/components/category/ShopByCategory";
import { getCategorySidebar } from "@/lib/mock-category-data";

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
                                totalProducts={PRODUCTS.length}
                                filter={filter}
                                onFilterOpen={() => setFilterOpen(true)}
                            />
                        </header>

                        {/* Product grid */}
                        <ProductGrid
                            products={PRODUCTS.slice(0, 50)}
                            countryCode={country}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}