"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Post, CAT_LABELS, CAT_STYLES, getArticleBySlug } from "./data";

interface FeaturedCardProps {
  post: Post;
  onClick: () => void;
}

export default function FeaturedCard({ post, onClick }: FeaturedCardProps) {
  // Featured post links to its real page when full content exists, else modal.
  const hasPage = getArticleBySlug(post.id) !== null;

  const cardClass =
    "block bg-white border border-gray-200 rounded-2xl overflow-hidden mb-9 cursor-pointer hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-shadow grid grid-cols-1 md:grid-cols-2";

  const inner = (
    <>
      {/* Image panel */}
      <div
        className="flex flex-col justify-between p-10 min-h-[220px] md:min-h-[280px]"
        style={{
          background: "linear-gradient(135deg,hsl(142,76%,28%) 0%,hsl(142,76%,42%) 100%)",
        }}
      >
        <div className="text-5xl">{post.icon}</div>
        <div className="bg-white/15 rounded-xl p-3.5 backdrop-blur-md text-white">
          <div className="text-[28px] font-black tracking-[-1px] leading-none">$11,000</div>
          <div className="text-[11px] opacity-80 mt-0.5">
            Average cost of a bad hire — discover how to avoid it
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8">
        <span className={`inline-block text-[10px] font-black uppercase tracking-[1px] px-2.5 py-[3px] rounded-full mb-3 ${CAT_STYLES[post.cat]}`}>
          {CAT_LABELS[post.cat]}
        </span>
        <h2 className="text-[clamp(20px,2.5vw,26px)] font-black tracking-[-0.5px] leading-[1.25] mb-2.5 text-gray-900">
          {post.title}
        </h2>
        <p className="text-sm text-gray-500 leading-[1.7] mb-4">
          Hiring decisions based on resumes alone cost companies billions every year. Discover the science behind skill verification and how objective performance data transforms your hiring pipeline.
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-5 flex-wrap">
          <span>8 min read</span>
          <span className="w-[3px] h-[3px] rounded-full bg-gray-300" />
          <span>Hiring Strategy</span>
          <span className="w-[3px] h-[3px] rounded-full bg-gray-300" />
          <span>March 2026</span>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-green-600 text-white text-[13px] font-semibold px-[18px] py-2 rounded-lg hover:bg-green-700 transition-colors border-none cursor-pointer font-[inherit]">
          Read article →
        </span>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {hasPage ? (
        <Link href={`/blog/${post.id}`} className={cardClass}>
          {inner}
        </Link>
      ) : (
        <div onClick={onClick} className={cardClass}>
          {inner}
        </div>
      )}
    </motion.div>
  );
}
