import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Award, TrendingUp, MessageSquare, Zap, Bell, Search, Star, Target, Flame, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVerified } from "@/hooks/useVerified";
import { VerifiedBadge } from "@/components/auth/VerifiedBadge";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PremiumBadges } from "@/components/elite/PremiumBadges";
import MainLayout from "@/components/layout/MainLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { verified } = useVerified();
  const [bookmarkedThreads, setBookmarkedThreads] = useState<any[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [profileStats, setProfileStats] = useState({
    totalThreads: 0,
    totalPosts: 0,
    totalLikesReceived: 0,
    totalBookmarks: 0,
    points: 0,
    streakDays: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarkedThreads();
      fetchProfileStats();
      fetchRecentActivity();
    }
  }, [user]);

  const fetchBookmarkedThreads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("thread_bookmarks" as any)
        .select(`
          created_at,
          thread:forum_threads(
            id,
            title,
            views,
            created_at,
            author:profiles!forum_threads_author_id_fkey(username),
            category:forum_categories!forum_threads_category_id_fkey(name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setBookmarkedThreads(data || []);
    } catch (error) {
      console.error("Failed to fetch bookmarked threads:", error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const fetchProfileStats = async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("points, streak_days")
        .eq("id", user.id)
        .single();

      // Fetch threads count
      const { count: threadsCount } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true })
        .eq("author_id", user.id);

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", user.id);

      // Fetch bookmarks count
      const { count: bookmarksCount } = await supabase
        .from("thread_bookmarks" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch likes received (count likes on user's posts)
      const { data: userPosts } = await supabase
        .from("forum_posts")
        .select("id")
        .eq("author_id", user.id);

      let likesReceived = 0;
      if (userPosts && userPosts.length > 0) {
        const { count: likesCount } = await supabase
          .from("post_likes" as any)
          .select("*", { count: "exact", head: true })
          .in("post_id", userPosts.map(p => p.id));
        likesReceived = likesCount || 0;
      }

      setProfileStats({
        totalThreads: threadsCount || 0,
        totalPosts: postsCount || 0,
        totalLikesReceived: likesReceived,
        totalBookmarks: bookmarksCount || 0,
        points: profile?.points || 0,
        streakDays: profile?.streak_days || 0,
      });
    } catch (error) {
      console.error("Failed to fetch profile stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_activities" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedActivity = (data || []).map((activity: any) => ({
        id: activity.id,
        type: activity.activity_type,
        title: formatActivityTitle(activity.activity_type, activity.metadata),
        time: getTimeAgo(activity.created_at),
        points: getActivityPoints(activity.activity_type),
      }));

      setRecentActivity(formattedActivity);
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    }
  };

  const formatActivityTitle = (type: string, metadata: any) => {
    switch (type) {
      case "thread_created":
        return `Created thread: ${metadata?.title || "Untitled"}`;
      case "post_created":
        return "Posted a reply";
      case "thread_view":
        return `Viewed: ${metadata?.title || "a thread"}`;
      case "page_view":
        return `Visited ${metadata?.page || "a page"}`;
      default:
        return type;
    }
  };

  const getActivityPoints = (type: string) => {
    switch (type) {
      case "thread_created":
        return 50;
      case "post_created":
        return 10;
      case "thread_view":
        return 1;
      default:
        return 0;
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  const achievements = [
    { id: 1, name: "Market Maven", description: "100+ upvotes in Markets", icon: TrendingUp, earned: true },
    { id: 2, name: "Discussion Leader", description: "50 threads created", icon: MessageSquare, earned: true },
    { id: 3, name: "Elite Contributor", description: "1000+ points earned", icon: Star, earned: true },
    { id: 4, name: "Streak Master", description: "30 day streak", icon: Flame, earned: false },
  ];

  const userBadges = [
    { name: "Founder", color: "gold", tier: "Founder Tier" },
    { name: "Elite Contributor", color: "emerald", tier: "Verified Member" }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border shadow-[var(--shadow-elevated)]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[hsl(38,92%,50%)] mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-primary-foreground">
                    JD
                  </div>
                  <h2 className="text-2xl font-bold mb-1">John Doe</h2>
                  <p className="text-muted-foreground mb-1">@johndoe</p>
                  <div className="flex justify-center mb-4">
                    <VerifiedBadge verified={verified} />
                  </div>
                  <div className="mb-4">
                    <PremiumBadges badges={userBadges} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Investor, entrepreneur, and market strategist focused on emerging technologies and wealth creation.
                  </p>
                  {!verified && (
                    <Alert className="mb-4 text-left">
                      <AlertDescription className="text-xs">
                        Your email isn't verified yet. Some actions are disabled until you confirm.{" "}
                        <Link to="/auth/verify-email" className="underline text-primary">Verify now</Link>
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button variant="outline" className="w-full mb-2" disabled={!verified} title={!verified ? "Verify your email to edit your profile" : undefined}>
                    Edit Profile
                  </Button>
                  <Button variant="ghost" className="w-full" disabled={!verified} title={!verified ? "Verify your email to access settings" : undefined}>
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Next Milestone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progress to Master</span>
                    <span className="text-sm font-medium">{profileStats.points.toLocaleString()} / 5,000</span>
                  </div>
                  <Progress value={(profileStats.points / 5000) * 100} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.max(0, 5000 - profileStats.points).toLocaleString()} more points needed for Master rank
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            {loadingStats ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{profileStats.points.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{profileStats.streakDays}</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{profileStats.totalThreads}</div>
                    <div className="text-sm text-muted-foreground">Threads</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{profileStats.totalPosts}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{profileStats.totalLikesReceived}</div>
                  <div className="text-sm text-muted-foreground">Likes Received</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{profileStats.totalBookmarks}</div>
                  <div className="text-sm text-muted-foreground">Bookmarks</div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Achievements
                  </CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <CardDescription>Your earned badges and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {achievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg text-center transition-all ${
                          achievement.earned
                            ? 'bg-primary/20 border-2 border-primary/30'
                            : 'bg-secondary/50 opacity-50 grayscale'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${achievement.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-xs font-medium mb-1">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bookmarked Threads */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-primary" />
                    Bookmarked Threads
                  </CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <CardDescription>Your saved discussions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBookmarks ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : bookmarkedThreads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No bookmarked threads yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookmarkedThreads.map((bookmark: any) => (
                      <div
                        key={bookmark.thread.id}
                        className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => navigate(`/forums/thread/${bookmark.thread.id}`)}
                      >
                        <div className="font-medium mb-1 line-clamp-1">{bookmark.thread.title}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{bookmark.thread.category.name}</span>
                          <span>•</span>
                          <span>by {bookmark.thread.author.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest contributions and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">{activity.time}</div>
                        </div>
                        {activity.points > 0 && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            +{activity.points}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
