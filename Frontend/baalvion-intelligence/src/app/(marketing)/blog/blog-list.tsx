"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { blogPosts, type BlogPost } from "@/lib/mock-data";

const categories: Array<BlogPost["category"] | "All"> = [
  "All",
  "AI",
  "Business",
  "News Intelligence",
  "Product Updates",
  "Engineering",
];

export function BlogList() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");

  const visiblePosts = useMemo(
    () => (activeCategory === "All" ? blogPosts : blogPosts.filter((post) => post.category === activeCategory)),
    [activeCategory]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by category">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeCategory === category
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visiblePosts.map((post) => (
          <Card key={post.id} className="glow-card">
            <CardHeader className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                {post.category}
              </Badge>
              <h2 className="text-lg font-semibold leading-snug text-foreground">{post.title}</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span>{post.readTime} read</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {visiblePosts.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">No posts in this category yet.</p>
        )}
      </div>
    </div>
  );
}
