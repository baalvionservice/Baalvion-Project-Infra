import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Trophy, Crown, Medal, MessageSquare, ThumbsUp, Zap, Users, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  user_id: string;
  username: string;
  total_points: number;
  threads_created: number;
  upvotes_received: number;
  engagement_score: number;
  rank: number;
  badge: string | null;
};

const initials = (n = "?") => n.slice(0, 2).toUpperCase();
const BADGE_STYLE: Record<string, string> = {
  Diamond: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Platinum: "bg-slate-300/20 text-slate-300 border-slate-300/30",
  Gold: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Silver: "bg-zinc-400/20 text-zinc-300 border-zinc-400/30",
  Bronze: "bg-orange-700/20 text-orange-400 border-orange-700/30",
};
const badgeClass = (b: string | null) => (b && BADGE_STYLE[b]) || "bg-primary/15 text-primary border-primary/30";

const StatChip = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
    <div><div className="text-xl font-bold leading-none">{value.toLocaleString()}</div><div className="text-xs text-muted-foreground">{label}</div></div>
  </div>
);

const PODIUM = [
  { ring: "ring-amber-400/60", grad: "from-amber-500/20", icon: <Crown className="w-6 h-6 text-amber-400" />, order: "sm:order-2", scale: "sm:-translate-y-4" },
  { ring: "ring-slate-300/50", grad: "from-slate-400/15", icon: <Medal className="w-6 h-6 text-slate-300" />, order: "sm:order-1", scale: "" },
  { ring: "ring-orange-500/50", grad: "from-orange-600/15", icon: <Medal className="w-6 h-6 text-orange-400" />, order: "sm:order-3", scale: "" },
];

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("elite_leaderboard" as any).select("*").order("rank", { ascending: true }).limit(100);
        setRows((data as Row[]) || []);
      } catch (e) { console.error("Failed to load leaderboard:", e); }
      finally { setLoading(false); }
    })();
  }, []);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const totals = rows.reduce((a, r) => ({
    points: a.points + (r.total_points || 0), threads: a.threads + (r.threads_created || 0), upvotes: a.upvotes + (r.upvotes_received || 0),
  }), { points: 0, threads: 0, upvotes: 0 });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Trophy className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-primary">Global Rankings</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Elite Leaderboard</h1>
          <p className="text-muted-foreground text-lg mt-1">The most valued contributors in the circle.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 text-left">
            <StatChip icon={Users} label="Members ranked" value={rows.length} />
            <StatChip icon={Zap} label="Total points" value={totals.points} />
            <StatChip icon={MessageSquare} label="Threads" value={totals.threads} />
            <StatChip icon={ThumbsUp} label="Upvotes" value={totals.upvotes} />
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No rankings yet.</CardContent></Card>
        ) : (
          <>
            {/* Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 items-end">
              {top3.map((u, i) => (
                <Card key={u.user_id} className={`border-border bg-gradient-to-b ${PODIUM[i].grad} to-card ${PODIUM[i].order} ${PODIUM[i].scale}`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-2">{PODIUM[i].icon}</div>
                    <div className={`mx-auto w-16 h-16 rounded-full bg-primary/15 text-primary text-xl font-bold flex items-center justify-center ring-2 ${PODIUM[i].ring}`}>{initials(u.username)}</div>
                    <h3 className="mt-3 font-bold text-lg truncate">{u.username}</h3>
                    <Badge variant="outline" className={`mt-1 ${badgeClass(u.badge)}`}>{u.badge || "Member"}</Badge>
                    <div className="mt-3 text-2xl font-bold text-primary">{(u.total_points || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Ranked list */}
            <Card className="border-border">
              <CardContent className="p-3 space-y-1">
                {rest.map((u) => (
                  <div key={u.user_id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/40 transition-colors">
                    <div className="w-8 text-center font-bold text-muted-foreground">#{u.rank}</div>
                    <div className="w-11 h-11 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0">{initials(u.username)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{u.username}</h3>
                        <Badge variant="outline" className={badgeClass(u.badge)}>{u.badge || "Member"}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{u.threads_created} threads</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{u.upvotes_received} upvotes</span>
                        <span className="flex items-center gap-1"><Award className="w-3 h-3" />{u.engagement_score} engagement</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{(u.total_points || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
