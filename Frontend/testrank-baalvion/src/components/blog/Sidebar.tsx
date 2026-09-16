"use client";

import { useState } from "react";
import { MOST_READ, TOPICS } from "./data";

interface SidebarProps {
  onOpenArticle: (id: string) => void;
}

export default function Sidebar({ onOpenArticle }: SidebarProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <aside className="flex flex-col gap-5">
      {/* Most Read */}
      <div className="bg-white border border-gray-200 rounded-2xl p-[18px]">
        <h4 className="text-xs font-black uppercase tracking-[1px] text-gray-400 mb-3.5 pb-2 border-b border-gray-100">
          Most read
        </h4>
        {MOST_READ.map((item, i) => (
          <div
            key={item.id}
            onClick={() => onOpenArticle(item.id)}
            className="flex gap-2.5 py-2 border-b border-gray-100 last:border-0 last:pb-0 cursor-pointer group"
          >
            <div className="font-mono text-[11px] text-gray-400 w-5 flex-shrink-0 pt-0.5">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div>
              <div className="text-xs font-medium leading-[1.4] group-hover:text-green-600 transition-colors text-gray-900">
                {item.title}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.meta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Topics */}
      <div className="bg-white border border-gray-200 rounded-2xl p-[18px]">
        <h4 className="text-xs font-black uppercase tracking-[1px] text-gray-400 mb-3.5 pb-2 border-b border-gray-100">
          Topics
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((tag) => (
            <span
              key={tag}
              className="text-[11px] bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full cursor-pointer text-gray-500 hover:bg-green-50 hover:border-green-600 hover:text-green-800 transition-all"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-white border border-gray-200 rounded-2xl p-[18px]">
        <h4 className="text-xs font-black uppercase tracking-[1px] text-gray-400 mb-3.5 pb-2 border-b border-gray-100">
          Newsletter
        </h4>
        <p className="text-xs text-gray-500 mb-3 leading-[1.6]">
          Get weekly hiring insights delivered to your inbox. Join 4,200+ HR leaders.
        </p>
        {subscribed ? (
          <div className="text-sm text-green-600 font-semibold text-center py-2">
            ✓ You're subscribed!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-3 py-[9px] border border-gray-200 rounded-lg text-[13px] font-[inherit] outline-none focus:border-green-600 transition-colors bg-gray-50"
            />
            <button
              onClick={() => email && setSubscribed(true)}
              className="bg-green-600 text-white border-none rounded-lg py-[9px] text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-green-700 transition-colors"
            >
              Subscribe free →
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
