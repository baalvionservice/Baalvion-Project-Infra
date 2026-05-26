import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Trophy, Medal, Crown, TrendingUp, Zap, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'alltime' | 'monthly' | 'weekly'>('alltime');

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('elite_leaderboard' as any)
        .select('*')
        .order('rank', { ascending: true })
        .limit(100);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error: any) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-[hsl(45,93%,58%)]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[hsl(0,0%,75%)]" />;
      case 3:
        return <Medal className="w-6 h-6 text-[hsl(30,60%,50%)]" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getLevelProgress = (xp: number, level: number) => {
    const xpForNextLevel = level * 100;
    const currentLevelXp = (level - 1) * 100;
    const progress = ((xp - currentLevelXp) / (xpForNextLevel - currentLevelXp)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Global Rankings</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Elite <span className="bg-gradient-to-r from-primary to-[hsl(38,92%,50%)] bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete with the best minds and climb the ranks through contributions, engagement, and achievements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-card to-card/80 border-border">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary mb-1">
                {leaderboard.length.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border">
            <CardContent className="pt-6 text-center">
              <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary mb-1">
                {leaderboard.reduce((sum, u) => sum + (u.xp_points || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total XP Earned</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border">
            <CardContent className="pt-6 text-center">
              <Target className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary mb-1">
                {leaderboard.reduce((sum, u) => sum + (u.posts_count || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary mb-1">
                {leaderboard.reduce((sum, u) => sum + (u.threads_count || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Threads</div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Top Contributors</CardTitle>
            <CardDescription>
              Rankings based on XP, contributions, and community engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="alltime" className="w-full" onValueChange={(v) => setTimeframe(v as any)}>
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="alltime">All Time</TabsTrigger>
                <TabsTrigger value="monthly">This Month</TabsTrigger>
                <TabsTrigger value="weekly">This Week</TabsTrigger>
              </TabsList>

              <TabsContent value="alltime" className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading leaderboard...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No data available yet
                  </div>
                ) : (
                  leaderboard.map((user, index) => (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        index < 3 
                          ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/20' 
                          : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-16">
                        {getRankIcon(user.rank || index + 1)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {user.username?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg truncate">
                            {user.username || 'Unknown User'}
                          </h3>
                          {index < 3 && (
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                              Elite
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Level {user.level || 1}</span>
                          <span>•</span>
                          <span>{user.posts_count || 0} posts</span>
                          <span>•</span>
                          <span>{user.upvotes_received || 0} upvotes</span>
                        </div>
                        {/* Level Progress */}
                        <div className="mt-2">
                          <Progress 
                            value={getLevelProgress(user.xp_points || 0, user.level || 1)} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      {/* XP Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {(user.xp_points || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">XP</div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="monthly" className="space-y-3">
                <div className="text-center py-12 text-muted-foreground">
                  Monthly rankings coming soon
                </div>
              </TabsContent>

              <TabsContent value="weekly" className="space-y-3">
                <div className="text-center py-12 text-muted-foreground">
                  Weekly rankings coming soon
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
