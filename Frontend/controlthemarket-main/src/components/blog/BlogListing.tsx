"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Post } from "./data";
import FeaturedCard from "./FeaturedCard";
import PostCard from "./PostCard";
import Sidebar from "./Sidebar";

interface BlogListingProps {
  posts: Post[];
  featuredPost: Post | undefined;
  onOpenArticle: (id: string) => void;
}

export default function BlogListing({ posts, featuredPost, onOpenArticle }: BlogListingProps) {
  const gridPosts = posts.filter((p) => !p.featured);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
      {/* Main column */}
      <div>
        {/* Featured article label */}
        {featuredPost && (
          <>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[1.5px] text-gray-400 mb-3.5">
              Featured article
              <span className="flex-1 h-px bg-gray-200" />
            </div>
            <FeaturedCard post={featuredPost} onClick={() => onOpenArticle(featuredPost.id)} />
          </>
        )}

        {/* No results */}
        {gridPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-gray-400"
          >
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">No articles found. Try a different search.</p>
          </motion.div>
        )}

        {/* Posts grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={gridPosts.map((p) => p.id).join(",")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {gridPosts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
                onClick={() => onOpenArticle(post.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sidebar — hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block">
        <Sidebar onOpenArticle={onOpenArticle} />
      </div>
    </div>
  );
}
