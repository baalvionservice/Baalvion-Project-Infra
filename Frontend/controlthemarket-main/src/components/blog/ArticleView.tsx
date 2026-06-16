"use client";

import { sanitizeRichHtml } from "@/lib/sanitize";
import { motion } from "framer-motion";
import { ARTICLES, POSTS, CAT_STYLES, CAT_LABELS } from "./data";

interface ArticleViewProps {
  articleId: string;
  onClose: () => void;
  onOpenArticle: (id: string) => void;
}

export default function ArticleView({ articleId, onClose, onOpenArticle }: ArticleViewProps) {
  const article = ARTICLES[articleId];

  // fallback for articles without full content
  if (!article) {
    const post = POSTS.find((p) => p.id === articleId);
    if (!post) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-[820px] mx-auto px-6 py-10"
      >
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-green-600 text-[13px] font-semibold bg-none border-none cursor-pointer font-[inherit] p-0 mb-7 hover:gap-2.5 transition-all"
        >
          ← Back to blog
        </button>
        <span className={`inline-block text-[10px] font-black uppercase tracking-[1px] px-2.5 py-[3px] rounded-full mb-3 ${CAT_STYLES[post.cat]}`}>
          {CAT_LABELS[post.cat]}
        </span>
        <h1 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-3.5 text-gray-900">
          {post.title}
        </h1>
        <p className="text-base text-gray-500 leading-[1.7] mb-4">{post.excerpt}</p>
        <div className="h-[280px] rounded-2xl flex items-center justify-center text-[64px] mb-9"
          style={{ background: `linear-gradient(135deg,${post.color} 0%,${post.color.replace(")", ",0.7)")} 100%)` }}>
          {post.icon}
        </div>
        <p className="text-[15px] leading-[1.85] text-gray-700">Full article content coming soon.</p>
      </motion.div>
    );
  }

  const related = (article.related || []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[820px] mx-auto px-4 sm:px-6 py-10"
    >
      {/* Back button */}
      <button
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-green-600 text-[13px] font-semibold bg-none border-none cursor-pointer font-[inherit] p-0 mb-7 hover:gap-2.5 transition-all"
      >
        ← Back to blog
      </button>

      {/* Article header */}
      <div className="mb-9">
        <span className={`inline-block text-[10px] font-black uppercase tracking-[1px] px-2.5 py-[3px] rounded-full mb-3 ${CAT_STYLES[article.cat]}`}>
          {article.catLabel}
        </span>
        <h1 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-3.5 text-gray-900">
          {article.title}
        </h1>
        <p className="text-base text-gray-500 leading-[1.7] mb-4">{article.excerpt}</p>
        <div className="flex items-center gap-3.5 text-[13px] text-gray-400 flex-wrap">
          <span>📅 {article.date}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-gray-200" />
          <span>⏱ {article.read} read</span>
          <span className="w-[3px] h-[3px] rounded-full bg-gray-200" />
          <span>✍️ SkillMatch Pro Editorial Team</span>
        </div>
      </div>

      {/* Banner */}
      <div
        className="h-[200px] sm:h-[280px] rounded-2xl flex items-center justify-center text-[64px] mb-9 overflow-hidden"
        style={{ background: article.color }}
      />

      {/* Article body */}
      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(article.body) }}
      />

      {/* Related articles */}
      {related.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-base font-black mb-5 text-gray-900">Related articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {related.map((rid) => {
              const rp = POSTS.find((p) => p.id === rid);
              if (!rp) return null;
              return (
                <div
                  key={rid}
                  onClick={() => onOpenArticle(rid)}
                  className="bg-white border border-gray-200 rounded-xl p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <h4 className="text-[13px] font-bold mb-1.5 leading-[1.35] text-gray-900">{rp.title}</h4>
                  <p className="text-[11px] text-gray-400">
                    {rp.read} read · {CAT_LABELS[rp.cat]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Article body styles injected globally */}
      <style>{`
        .article-body h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.4px; margin: 32px 0 12px; color: #1c2333; }
        .article-body h3 { font-size: 17px; font-weight: 700; margin: 24px 0 10px; color: #1c2333; }
        .article-body p { font-size: 15px; line-height: 1.85; color: #1c2333; margin-bottom: 16px; }
        .article-body ul, .article-body ol { margin: 0 0 18px 20px; }
        .article-body li { font-size: 15px; line-height: 1.8; margin-bottom: 5px; color: #1c2333; }
        .article-body blockquote { border-left: 3px solid hsl(142,76%,36%); padding: 14px 18px; background: hsl(142,76%,94%); border-radius: 0 8px 8px 0; margin: 24px 0; font-size: 15px; line-height: 1.7; color: hsl(142,76%,22%); }
        .article-body table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .article-body th { background: hsl(220,15%,20%); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; }
        .article-body td { padding: 9px 14px; border-bottom: 1px solid hsl(220,15%,88%); }
        .article-body tr:nth-child(even) td { background: hsl(220,20%,96%); }
        .article-body .highlight-box { background: hsl(142,76%,94%); border: 1px solid hsl(142,76%,80%); border-radius: 10px; padding: 16px 18px; margin: 20px 0; }
        .article-body .highlight-box strong { color: hsl(142,76%,28%); }
        .art-stat-box { background: hsl(220,15%,90%); border-radius: 16px; padding: 24px; margin: 24px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; text-align: center; }
        .asb-num { font-size: 32px; font-weight: 900; color: hsl(142,76%,36%); letter-spacing: -1px; }
        .asb-lbl { font-size: 12px; color: hsl(220,10%,45%); margin-top: 3px; }
        .art-cta { background: hsl(220,15%,20%); border-radius: 16px; padding: 28px; text-align: center; margin: 36px 0; }
        .art-cta h3 { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px; }
        .art-cta p { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 18px; }
        .read-btn { display: inline-flex; align-items: center; gap: 5px; background: hsl(142,76%,36%); color: #fff; font-size: 15px; font-weight: 600; padding: 11px 24px; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; font-family: inherit; }
        .read-btn:hover { background: hsl(142,76%,28%); }
      `}</style>
    </motion.div>
  );
}
