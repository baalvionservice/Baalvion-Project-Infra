"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Banknote,
  MessageSquare,
  Bitcoin,
  UserCheck,
  MousePointer,
  Youtube,
  GraduationCap,
  Server,
  Shield,
  Gamepad2,
  ArrowLeftRight,
  Crosshair,
  Lock,
  EyeOff,
  Globe,
  KeyRound,
  Minus,
  Plus,
  Megaphone,
  Newspaper,
  Users,
  Smile,
} from "lucide-react";
import type { Community } from "@/lib/api/community";

export interface BoardGroup { slug: string; title: string; boards: Community[] }
type IconType = "cash" | "chat" | "ebay" | "bitcoin" | "freelancer" | "cursor" | "youtube" | "udemy" | "server" | "shield" | "gamepad" | "exchange" | "crosshair" | "lock" | "eye-off" | "globe" | "key" | "megaphone" | "newspaper" | "users" | "smile";

const ACCESS_NOTE: Record<string, string> = { request_approval: "Approval needed", invite_only: "Invite only", paid: "Paid" };

function ago(ms: number) {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function NodeIcon({ type }: { type: IconType }) {
  const iconProps = { className: "w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" };

  switch (type) {
    case "cash":
      return <Banknote {...iconProps} />;
    case "chat":
      return <MessageSquare {...iconProps} />;
    case "ebay":
      return <span className="font-extrabold text-sm tracking-tighter text-red-500 font-sans">ebay</span>;
    case "bitcoin":
      return <Bitcoin {...iconProps} />;
    case "freelancer":
      return <UserCheck {...iconProps} />;
    case "cursor":
      return <MousePointer {...iconProps} />;
    case "youtube":
      return <Youtube {...iconProps} />;
    case "udemy":
      return <GraduationCap {...iconProps} />;
    case "server":
      return <Server {...iconProps} />;
    case "shield":
      return <Shield {...iconProps} />;
    case "gamepad":
      return <Gamepad2 {...iconProps} />;
    case "exchange":
      return <ArrowLeftRight {...iconProps} />;
    case "crosshair":
      return <Crosshair {...iconProps} />;
    case "lock":
      return <Lock {...iconProps} />;
    case "eye-off":
      return <EyeOff {...iconProps} />;
    case "globe":
      return <Globe {...iconProps} />;
    case "key":
      return <KeyRound {...iconProps} />;
    case "megaphone":
      return <Megaphone {...iconProps} />;
    case "newspaper":
      return <Newspaper {...iconProps} />;
    case "users":
      return <Users {...iconProps} />;
    case "smile":
      return <Smile {...iconProps} />;
    default:
      return <MessageSquare {...iconProps} />;
  }
}

export function XenCategoryTable({ category }: { category: BoardGroup }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div id={category.slug} className="xen-category-block mb-8 rounded-lg overflow-hidden border border-[#2b2b36] bg-[#121217] shadow-xl">
      {/* Category Header Bar */}
      <div className="xen-cat-header flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#1c1824] via-[#221c2e] to-[#1a1622] border-b border-[#2e293a]">
        <Link
          href={`/forum/category/${category.slug}`}
          className="text-base md:text-lg font-bold text-[#e6d8c8] hover:text-[#d4af7a] transition-colors tracking-wide flex items-center gap-2"
        >
          <span>{category.title}</span>
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded bg-black/40 hover:bg-black/70 text-gray-400 hover:text-white transition-colors"
          title={collapsed ? "Expand category" : "Collapse category"}
        >
          {collapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        </button>
      </div>

      {/* Forum Subnodes */}
      {!collapsed && (
        <div className="divide-y divide-[#202029]">
          {category.boards.map((node) => (
            <div
              key={node.slug}
              className="xen-node-row group flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-[#14141a] hover:bg-[#191922] transition-colors gap-4"
            >
              {/* Left Column: Icon + Title + Description */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <Link
                  href={`/forum/${node.slug}`}
                  className="w-11 h-11 shrink-0 rounded-md bg-[#24171d] border border-red-900/40 flex items-center justify-center shadow-inner group-hover:border-red-600/60 transition-colors"
                >
                  <NodeIcon type={(node.icon ?? "chat") as IconType} />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/forum/${node.slug}`}
                      className="text-base font-bold text-[#f0f0f5] group-hover:text-red-400 transition-colors hover:underline"
                    >
                      {node.name}
                    </Link>
                    {ACCESS_NOTE[node.accessModel] && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/50 border border-amber-800/50 text-amber-300">{ACCESS_NOTE[node.accessModel]}</span>}
                  </div>

                  <p className="text-xs text-[#8c8c9e] mt-1 leading-relaxed line-clamp-2">
                    {node.description}
                  </p>

                </div>
              </div>

              {/* Middle Column: Threads & Messages Stats */}
              <div className="flex items-center gap-6 lg:w-44 shrink-0 px-2 lg:px-4 py-1.5 lg:py-0 border-t lg:border-t-0 border-[#242430]">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    Threads
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#21212b] text-[#d6d6e2] border border-[#2f2f3d]">
                    {node.topicCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    Messages
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#21212b] text-[#d6d6e2] border border-[#2f2f3d]">
                    {node.postCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Right Column: Latest Activity */}
              <div className="lg:w-72 shrink-0 flex items-center gap-3 border-t lg:border-t-0 border-[#242430] pt-2 lg:pt-0">
                {node.latest ? (
                  <>
                    <div className="w-9 h-9 shrink-0 rounded flex items-center justify-center text-white font-bold text-sm shadow bg-[#c0392b]">{node.latest.by[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/forum/thread/${node.latest.tid}?c=${node.slug}`} className="block text-xs font-semibold text-[#cfcfdc] hover:text-red-400 transition-colors truncate" title={node.latest.title}>{node.latest.title}</Link>
                      <div className="text-[11px] text-gray-400 mt-0.5 truncate"><span>{ago(node.latest.at)}</span><span className="mx-1.5 opacity-60">·</span><span className="text-gray-300">{node.latest.by}</span></div>
                    </div>
                  </>
                ) : (
                  <Link href={`/forum/${node.slug}`} className="text-xs text-gray-400 hover:text-red-300">No threads yet. Start the first one.</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
