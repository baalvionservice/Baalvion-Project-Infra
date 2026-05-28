import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/components/layout/MainLayout";
import { MessageSquare, Search, Users, Plus, Eye, Clock, Flame, ChevronRight, ArrowLeft, Pin, MessagesSquare, Layers, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useActivityTracking } from "@/hooks/useActivityTracking";

type Author = { username: string; avatar_url: string | null };
type Thread = {
  id: string;
  title: string;
  created_at: string;
  views: number;
  is_pinned: boolean;
  status: string;
  author: Author;
  category: { name: string; icon: string | null };
  post_count: number;
  tags?: Array<{ id: string; name: string; color: string }>;
};
type Category = { id: string; name: string; slug: string; icon: string | null; description: string | null };
type CatStat = { threadCount: number; latest: { id: string; title: string; created_at: string; author: Author } | null };

// Per-category visual accent (cycled by order).
const ACCENTS = [
  { tile: "from-amber-500/25 to-yellow-500/5", text: "text-amber-500", glow: "group-hover:shadow-[0_0_0_1px_hsl(45_90%_55%/0.4)]" },
  { tile: "from-sky-500/25 to-cyan-500/5", text: "text-sky-400", glow: "group-hover:shadow-[0_0_0_1px_hsl(200_90%_55%/0.4)]" },
  { tile: "from-emerald-500/25 to-green-500/5", text: "text-emerald-400", glow: "group-hover:shadow-[0_0_0_1px_hsl(150_80%_45%/0.4)]" },
  { tile: "from-violet-500/25 to-fuchsia-500/5", text: "text-violet-400", glow: "group-hover:shadow-[0_0_0_1px_hsl(270_80%_60%/0.4)]" },
  { tile: "from-rose-500/25 to-pink-500/5", text: "text-rose-400", glow: "group-hover:shadow-[0_0_0_1px_hsl(340_80%_60%/0.4)]" },
];

const AVATAR_COLORS = ["bg-amber-500/20 text-amber-600", "bg-sky-500/20 text-sky-600", "bg-emerald-500/20 text-emerald-600", "bg-violet-500/20 text-violet-600", "bg-rose-500/20 text-rose-600"];
const initials = (name = "?") => name.trim().slice(0, 2).toUpperCase();
const colorFor = (name = "") => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const timeAgo = (date: string) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const u: [number, string][] = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [secs, label] of u) { const v = Math.floor(s / secs); if (v >= 1) return `${v}${label} ago`; }
  return "just now";
};

const Avatar = ({ name }: { name: string }) => (
  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold ${colorFor(name)}`}>{initials(name)}</div>
);

const ForumThreads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [catStats, setCatStats] = useState<Record<string, CatStat>>({});
  const [forumStats, setForumStats] = useState({ discussions: 0, posts: 0, members: 0, categories: 0 });
  const [threads, setThreads] = useState<Thread[]>([]);
  const [trending, setTrending] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "viewed" | "active">("recent");
  const { trackPageView } = useActivityTracking();

  const selected = categorySlug || "all";
  const activeCategory = categories.find((c) => c.slug === selected) || null;

  const selectCategory = (slug: string | null) => {
    if (slug) setSearchParams({ category: slug });
    else setSearchParams({});
    setSearchQuery("");
  };

  // ── Initial load: categories, forum-wide stats, per-category stats, trending ──
  useEffect(() => { trackPageView("Forums"); }, [trackPageView]);

  useEffect(() => {
    (async () => {
      try {
        const { data: cats } = await supabase.from("forum_categories").select("*").order("order_index", { ascending: true });
        const categoryList = (cats as Category[]) || [];
        setCategories(categoryList);

        const [{ count: discussions }, { count: posts }, { count: members }] = await Promise.all([
          supabase.from("forum_threads").select("id", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("forum_posts").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
        ]);
        setForumStats({ discussions: discussions || 0, posts: posts || 0, members: members || 0, categories: categoryList.length });

        const stats: Record<string, CatStat> = {};
        await Promise.all(categoryList.map(async (c) => {
          const { count } = await supabase.from("forum_threads").select("id", { count: "exact", head: true }).eq("status", "open").eq("category_id", c.id);
          const { data: latest } = await supabase
            .from("forum_threads")
            .select("id, title, created_at, author:profiles!forum_threads_author_id_fkey(username, avatar_url)")
            .eq("status", "open").eq("category_id", c.id)
            .order("created_at", { ascending: false }).limit(1);
          stats[c.slug] = { threadCount: count || 0, latest: (latest as any)?.[0] || null };
        }));
        setCatStats(stats);

        const { data: trend } = await supabase
          .from("forum_threads")
          .select("id, title, views, author:profiles!forum_threads_author_id_fkey(username, avatar_url), category:forum_categories!forum_threads_category_id_fkey(name, icon)")
          .eq("status", "open").order("views", { ascending: false }).limit(5);
        setTrending((trend as Thread[]) || []);
      } catch (e) {
        console.error("Forum load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Thread list for the current view (all / a category / search) ──────────────
  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      let q = supabase
        .from("forum_threads")
        .select(`id, title, created_at, views, is_pinned, status,
          author:profiles!forum_threads_author_id_fkey(username, avatar_url),
          category:forum_categories!forum_threads_category_id_fkey(name, icon)`)
        .eq("status", "open");

      if (activeCategory) q = q.eq("category_id", activeCategory.id);
      if (searchQuery) q = q.ilike("title", `%${searchQuery}%`);
      q = q.order("is_pinned", { ascending: false });
      q = sortBy === "viewed" ? q.order("views", { ascending: false }) : q.order("created_at", { ascending: false });

      const { data } = await q.limit(selected === "all" && !searchQuery ? 8 : 50);
      const withMeta = await Promise.all(((data as Thread[]) || []).map(async (t) => {
        const { count } = await supabase.from("forum_posts").select("id", { count: "exact", head: true }).eq("thread_id", t.id);
        const { data: tt } = await supabase.from("thread_tags" as any).select("tags:tags(id, name, color)").eq("thread_id", t.id);
        return { ...t, post_count: count || 0, tags: ((tt as any[]) || []).map((x) => x.tags).filter(Boolean) };
      }));
      if (sortBy === "active") withMeta.sort((a, b) => (a.is_pinned !== b.is_pinned ? (a.is_pinned ? -1 : 1) : b.post_count - a.post_count));
      setThreads(withMeta);
    } catch (e) {
      console.error("Failed to load threads:", e);
      toast.error("Failed to load discussions");
    } finally {
      setThreadsLoading(false);
    }
  }, [activeCategory, searchQuery, sortBy, selected]);

  useEffect(() => { if (categories.length || selected === "all") fetchThreads(); }, [fetchThreads, categories.length]);

  const StatChip = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
      <div>
        <div className="text-xl font-bold leading-none">{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  const ThreadRow = ({ t }: { t: Thread }) => (
    <Card className="group cursor-pointer border-border transition-all hover:border-primary/40 hover:shadow-lg" onClick={() => navigate(`/forums/thread/${t.id}`)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={t.author?.username || "?"} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {t.is_pinned && <Badge className="bg-primary/20 text-primary hover:bg-primary/20"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>}
              <Badge variant="secondary">{t.category?.icon ? `${t.category.icon} ` : ""}{t.category?.name}</Badge>
              {t.tags?.map((tag) => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
              ))}
            </div>
            <h3 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors">{t.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{t.author?.username}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{t.post_count} {t.post_count === 1 ? "reply" : "replies"}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{t.views} views</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{timeAgo(t.created_at)}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 self-center group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Elite Forums</h1>
              <p className="text-muted-foreground text-lg mt-1">Find your circle. Pick a category and join the conversation.</p>
            </div>
            {user && (
              <Button variant="premium" size="lg" onClick={() => navigate("/forums/new")}>
                <Plus className="w-5 h-5 mr-2" /> New Discussion
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatChip icon={MessagesSquare} label="Discussions" value={forumStats.discussions} />
            <StatChip icon={MessageSquare} label="Posts" value={forumStats.posts} />
            <StatChip icon={Users} label="Members" value={forumStats.members} />
            <StatChip icon={Layers} label="Categories" value={forumStats.categories} />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search discussions…" className="pl-12 h-12 text-base" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {selected === "all" && !searchQuery ? (
          <>
            {/* Category grid — purpose-based entry points */}
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />Browse by purpose</h2>
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-10">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {categories.map((c, i) => {
                  const a = ACCENTS[i % ACCENTS.length];
                  const st = catStats[c.slug];
                  return (
                    <Card key={c.id} className={`group cursor-pointer border-border transition-all hover:border-primary/40 ${a.glow}`} onClick={() => selectCategory(c.slug)}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${a.tile} flex items-center justify-center text-2xl shrink-0`}>{c.icon || "💬"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
                              <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{c.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><MessagesSquare className="w-3.5 h-3.5" />{st?.threadCount ?? 0} threads</span>
                              {st?.latest && (
                                <span className="truncate flex items-center gap-1">
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${a.text.replace("text", "bg")}`} />
                                  {st.latest.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Trending + Latest */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Latest discussions</h2>
                <div className="space-y-3">
                  {threadsLoading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                    : threads.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No discussions yet. Be the first!</CardContent></Card>
                    : threads.map((t) => <ThreadRow key={t.id} t={t} />)}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Flame className="w-5 h-5 text-primary" />Trending</h2>
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
                  <CardContent className="p-3 space-y-1">
                    {trending.length === 0 ? <p className="text-sm text-muted-foreground p-3">Nothing trending yet.</p> : trending.map((t, i) => (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background/60 cursor-pointer transition-colors" onClick={() => navigate(`/forums/thread/${t.id}`)}>
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{t.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{t.views} · {t.category?.name}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Category / search view */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => selectCategory(null)}><ArrowLeft className="w-4 h-4 mr-1" />All categories</Button>
                {activeCategory && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeCategory.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold leading-none">{activeCategory.name}</h2>
                      <p className="text-xs text-muted-foreground">{activeCategory.description}</p>
                    </div>
                  </div>
                )}
                {searchQuery && <h2 className="text-xl font-bold">Results for “{searchQuery}”</h2>}
              </div>
              <div className="flex gap-1 rounded-lg border border-border p-1">
                {([["recent", "Latest", Clock], ["viewed", "Top", TrendingUp], ["active", "Active", MessageSquare]] as const).map(([key, label, Icon]) => (
                  <button key={key} onClick={() => setSortBy(key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${sortBy === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {threadsLoading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                : threads.length === 0 ? (
                  <Card className="text-center py-12"><CardContent>
                    <MessageSquare className="w-14 h-14 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-1">No discussions here yet</h3>
                    <p className="text-muted-foreground mb-4">{searchQuery ? "Try a different search." : "Start the first discussion in this category."}</p>
                    {user && <Button variant="premium" onClick={() => navigate("/forums/new")}><Plus className="w-4 h-4 mr-2" />New Discussion</Button>}
                  </CardContent></Card>
                ) : threads.map((t) => <ThreadRow key={t.id} t={t} />)}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ForumThreads;
