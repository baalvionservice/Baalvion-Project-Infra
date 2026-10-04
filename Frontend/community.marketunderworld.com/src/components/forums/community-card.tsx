import Link from "next/link";
import { MessageSquare, Lock, Users, Clock, ShieldCheck } from "lucide-react";
import type { Community } from "@/lib/api/community";

const ACCESS_BADGE: Record<Community['accessModel'], { label: string; cls: string }> = {
  free:             { label: 'Open',       cls: 'forum-badge forum-badge--open' },
  request_approval: { label: 'Apply',      cls: 'forum-badge forum-badge--apply' },
  invite_only:      { label: 'Invite',     cls: 'forum-badge forum-badge--invite' },
  paid:             { label: 'Premium',    cls: 'forum-badge forum-badge--paid' },
};

const ACCESS_ICON: Record<Community['accessModel'], typeof Lock> = {
  free:             Users,
  request_approval: Clock,
  invite_only:      Lock,
  paid:             ShieldCheck,
};

export function CommunityCard({ community }: { community: Community }) {
  const badge = ACCESS_BADGE[community.accessModel];
  const Icon = ACCESS_ICON[community.accessModel];

  return (
    <Link href={`/forum/${community.slug}`} className="forum-category-row">
      {/* Icon */}
      <div className="forum-category-icon-wrap">
        <MessageSquare className="forum-category-icon" />
      </div>

      {/* Name + description */}
      <div className="forum-category-info">
        <div className="forum-category-name">
          {community.name}
          <span className={badge.cls}>{badge.label}</span>
        </div>
        {community.description && (
          <div className="forum-category-desc">{community.description}</div>
        )}
        <div className="forum-category-access">
          <Icon className="forum-category-access-icon" />
          <span>{badge.label === 'Open' ? 'Anyone can join' :
                 badge.label === 'Apply' ? 'Request to join' :
                 badge.label === 'Invite' ? 'Invite only' : 'Paid membership'}</span>
        </div>
      </div>

      {/* Stats */}
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
        <span className="forum-last-none">No posts yet</span>
      </div>
    </Link>
  );
}
