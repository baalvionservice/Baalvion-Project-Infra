import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Zap, Award, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderBoard } from "@/components/elite/LeaderBoard";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TrendingThread {
  id: string;
  title: string;
  views: number;
  author?: { username?: string } | null;
  category?: { name?: string; icon?: string } | null;
}
interface CategoryRow { id: string; name: string; icon: string | null; threadCount: number; }

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ points: number; streak: number; rank: number | null; badge: string | null }>({ points: 0, streak: 0, rank: null, badge: null });
  const [trending, setTrending] = useState<TrendingThread[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [{ data: profile }, { data: lb }, { data: threads }, { data: cats }] = await Promise.all([
          supabase.from("profiles").select("points, streak_days").eq("id", user.id).maybeSingle(),
          supabase.from("elite_leaderboard" as any).select("rank, badge").eq("user_id", user.id).maybeSingle(),
          supabase
            .from("forum_threads")
            .select(`id, title, views,
              author:profiles!forum_threads_author_id_fkey(username),
              category:forum_categories!forum_threads_category_id_fkey(name, icon)`)
            .order("views", { ascending: false })
            .limit(5),
          supabase.from("forum_categories").select("id, name, icon").order("order_index", { ascending: true }),
        ]);

        setStatus({
          points: (profile as any)?.points ?? 0,
          streak: (profile as any)?.streak_days ?? 0,
          rank: (lb as any)?.rank ?? null,
          badge: (lb as any)?.badge ?? null,
        });
        setTrending((threads as any) || []);

        const catRows = (cats as any[]) || [];
        const withCounts = await Promise.all(
          catRows.map(async (c) => {
            const { count } = await supabase
              .from("forum_threads")
              .select("id", { count: "exact", head: true })
              .eq("category_id", c.id);
            return { id: c.id, name: c.name, icon: c.icon, threadCount: count || 0 };
          })
        );
        setCategories(withCounts);
      } catch (e) {
        console.error("Dashboard load failed:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border shadow-[var(--shadow-elevated)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Your Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Points</span>
                      <span className="text-lg font-bold text-primary">{status.points.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2 items-center">
                      <span className="text-sm text-muted-foreground">Rank</span>
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        {status.rank ? `#${status.rank}${status.badge ? ` · ${status.badge}` : ""}` : "Unranked"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Streak</span>
                      <span className="text-lg font-bold">{status.streak} days</span>
                    </div>
                  </div>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/profile">View Profile</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Forums
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  categories.map((c) => (
                    <Link key={c.id} to="/forums" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{c.icon ? `${c.icon} ` : ""}{c.name}</span>
                        <Badge variant="secondary">{c.threadCount} {c.threadCount === 1 ? "thread" : "threads"}</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Trending Discussions</h1>
              <Button asChild variant="default">
                <Link to="/forums/new"><Zap className="w-4 h-4 mr-2" />Create Post</Link>
              </Button>
            </div>

            {loading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : trending.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-10 text-center text-muted-foreground">
                  No discussions yet. <Link to="/forums/new" className="text-primary underline-offset-2 hover:underline">Start the first one →</Link>
                </CardContent>
              </Card>
            ) : (
              trending.map((post) => (
                <Link key={post.id} to={`/forums/thread/${post.id}`}>
                  <Card className="bg-gradient-to-br from-card to-card/80 border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
                    <CardHeader>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <Badge variant="secondary">{post.category?.icon ? `${post.category.icon} ` : ""}{post.category?.name || "General"}</Badge>
                        </div>
                        <CardTitle className="text-xl hover:text-primary transition-colors">{post.title}</CardTitle>
                        <CardDescription>by {post.author?.username || "member"}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.views} views</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />Discuss</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mt-12">
          <LeaderBoard />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
