import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { Teacher } from "@/lib/api/education";

export function Avatar({ name, url, size = 56 }: { name: string; url: string | null; size?: number }) {
  const style = { width: size, height: size };
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img src={url} alt={name} style={style} className="rounded-md object-cover border border-brand-border" />;
  return (
    <div style={style} className="rounded-md bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-text-muted">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function TeacherTile({ teacher }: { teacher: Teacher }) {
  return (
    <Link href={`/education/teacher/${teacher.id}`} className="block group">
      <div className="h-full p-6 rounded-lg bg-brand-surface border border-brand-border group-hover:border-brand-green transition-colors space-y-4">
        <div className="flex items-start gap-4">
          <Avatar name={teacher.name} url={teacher.avatarUrl} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white truncate">{teacher.name}</h3>
              {teacher.isLive && <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase">Live now</span>}
            </div>
            <p className="text-sm text-brand-green">{teacher.subject}</p>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {teacher.country}</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary line-clamp-3">{teacher.bio}</p>
        <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-brand-border">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            {teacher.rating !== null ? `${teacher.rating} (${teacher.reviewCount})` : "No reviews yet"}
          </span>
          <span>{teacher.priceNote ?? "Ask for pricing"}</span>
        </div>
      </div>
    </Link>
  );
}
