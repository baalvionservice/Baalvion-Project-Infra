import Link from "next/link";
import { Users, Clock, Lock, ShieldCheck, ChevronRight } from "lucide-react";
import type { Community } from "@/lib/api/community";

const ACCESS_LABEL: Record<Community['accessModel'], { label: string; icon: typeof Lock; className: string }> = {
  free: { label: 'Open — join instantly', icon: Users, className: 'text-emerald-400' },
  request_approval: { label: 'Request to join', icon: Clock, className: 'text-amber-400' },
  invite_only: { label: 'Invite only', icon: Lock, className: 'text-cyan-400' },
  paid: { label: 'Membership', icon: ShieldCheck, className: 'text-fuchsia-400' },
};

export function CommunityCard({ community }: { community: Community }) {
  const access = ACCESS_LABEL[community.accessModel];
  const AccessIcon = access.icon;
  return (
    <Link href={`/forum/${community.slug}`}>
      <div className="mu-card group h-full flex flex-col p-10 relative overflow-hidden bg-[#111118] border border-white/5 hover:border-cyan-500/40 transition-all duration-500">
        <h2 className="text-3xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors">
          {community.name}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-10 flex-1 font-medium">
          {community.description}
        </p>
        <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-auto">
          <div className={`flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest ${access.className}`}>
            <AccessIcon className="w-4 h-4" /> {access.label}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
