"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Post, CAT_LABELS, CAT_STYLES, getArticleBySlug } from "./data";

interface PostCardProps {
  post: Post;
  index: number;
  onClick: () => void;
}

export default function PostCard({ post, index, onClick }: PostCardProps) {
  // Posts with a full article body get a real, crawlable link to /blog/<slug>;
  // placeholder posts keep the in-page modal behaviour.
  const hasPage = getArticleBySlug(post.id) !== null;

  const cardClass =
    "block bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all";

  const inner = (
    <>
      {/* Thumbnail */}
      <div
        className="h-[140px] flex items-center justify-center text-[36px] relative"
        style={{
          background: `linear-gradient(135deg,${post.color} 0%,${post.color.replace(")", ",0.7)")} 100%)`,
        }}
      >
        {post.icon}
      </div>

      {/* Body */}
      <div className="p-[18px]">
        <span className={`inline-block text-[10px] font-black uppercase tracking-[1px] px-2.5 py-[3px] rounded-full mb-2 ${CAT_STYLES[post.cat]}`}>
          {CAT_LABELS[post.cat]}
        </span>
        <h3 className="text-[15px] font-bold tracking-[-0.3px] leading-[1.35] mb-1.5 text-gray-900">
          {post.title}
        </h3>
        <p className="text-xs text-gray-500 leading-[1.6] mb-3">{post.excerpt}</p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1.5 flex-wrap">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-[2px] rounded-full text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">{post.read}</span>
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
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
