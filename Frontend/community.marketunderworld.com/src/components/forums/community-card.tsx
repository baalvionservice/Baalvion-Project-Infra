"use client";

import Link from "next/link";
import { MessageSquare, Lock, Users, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { Community, CommunityDetail } from "@/lib/api/community";

// CommunityCard accepts either a Community or CommunityDetail (with membership)
type Props = {
  community: Community | CommunityDetail;
};

const isCommunityDetail = (c: Community | CommunityDetail): c is CommunityDetail =>
  "membership" in c;

const ACCESS_BADGE: Record<Community["accessModel"], { label: string; cls: string }> = {
  free:             { label: "Open",    cls: "forum-badge forum-badge--open" },
  request_approval: { label: "Apply",   cls: "forum-badge forum-badge--apply" },
  invite_only:      { label: "Invite",  cls: "forum-badge forum-badge--invite" },
  paid:             { label: "Premium", cls: "forum-badge forum-badge--paid" },
};

const ACCESS_ICON: Record<Community["accessModel"], typeof Lock> = {
  free:             Users,
  request_approval: Clock,
  invite_only:      Lock,
  paid:             ShieldCheck,
};

export function CommunityCard({ community }: Props) {
  const badge = ACCESS_BADGE[community.accessModel];
  const Icon  = ACCESS_ICON[community.accessModel];

  // Get membership info if available
  const membership = isCommunityDetail(community) ? community.membership : null;
  const isApproved = membership?.status === "approved" || membership?.status === "paid";
  const isPending  = membership?.status === "requested" || membership?.status === "invited";

  return (
    <Link href={`/forum/${community.slug}`} className="forum-category-row group relative">
      {/* Icon */}
      <div className="forum-category-icon-wrap">
        <MessageSquare className="forum-category-icon" />
      </div>

      {/* Name + description */}
      <div className="forum-category-info">
        <div className="forum-category-name">
          {community.name}
          <span className={badge.cls}>{badge.label}</span>
          {isApproved && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 rounded font-bold ml-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Member
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-900/40 border border-amber-700/40 text-amber-400 rounded font-bold ml-1">
              <Clock className="w-2.5 h-2.5" /> Pending
            </span>
          )}
        </div>
        {community.description && (
          <div className="forum-category-desc">{community.description}</div>
        )}
        <div className="forum-category-access">
          <Icon className="forum-category-access-icon" />
          <span>
            {isApproved  ? "You are a member — click to enter" :
             isPending   ? "Your request is under review" :
             badge.label === "Open"    ? "Anyone can join" :
             badge.label === "Apply"   ? "Request to join — admin must approve" :
             badge.label === "Invite"  ? "Invite only" :
             "Paid membership required"}
          </span>
        </div>
      </div>

      {/* Stats placeholder */}
      <div className="forum-category-stats">
        <div className="forum-stat">
          <span className="forum-stat-num">—</span>
          <span className="forum-stat-label">Threads</span>
        </div>
        <div className="forum-stat">
          <span className="forum-stat-num">—</span>
          <span className="forum-stat-label">Posts</span>
        </div>
      </div>

      {/* Last post */}
      <div className="forum-category-last">
        <span className="forum-last-none">
          {isApproved ? "Enter forum →" : isPending ? "Awaiting approval" : "No posts yet"}
        </span>
      </div>
    </Link>
  );
}
