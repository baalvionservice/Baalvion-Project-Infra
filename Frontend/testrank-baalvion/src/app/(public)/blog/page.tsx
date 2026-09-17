"use client";

import { useState, useMemo } from "react";
import { POSTS } from "@/components/blog/data";
import BlogNavbar from "@/components/blog/BlogNavbar";
import BlogHero from "@/components/blog/BlogHero";
import FilterBar from "@/components/blog/FilterBar";
import BlogListing from "@/components/blog/BlogListing";
import ArticleView from "@/components/blog/ArticleView";

export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    let result = POSTS;
    if (activeFilter !== "all") {
      result = result.filter((p) => p.cat === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeFilter]);

  const featuredPost = filteredPosts.find((p) => p.featured);

  const handleOpenArticle = (id: string) => {
    setOpenArticleId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseArticle = () => {
    setOpenArticleId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,96%)]">

      {openArticleId ? (
        <ArticleView
          articleId={openArticleId}
          onClose={handleCloseArticle}
          onOpenArticle={handleOpenArticle}
        />
      ) : (
        <>
          <BlogHero search={search} onSearch={setSearch} />
          <FilterBar active={activeFilter} onFilter={setActiveFilter} />
          <BlogListing
            posts={filteredPosts}
            featuredPost={featuredPost}
            onOpenArticle={handleOpenArticle}
          />
        </>
      )}
    </div>
  );
}
