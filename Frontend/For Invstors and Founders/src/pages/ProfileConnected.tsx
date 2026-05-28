import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Award, TrendingUp, MessageSquare, Zap, Bell, Search, Star, Target, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PremiumBadges } from "@/components/elite/PremiumBadges";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVerified } from "@/hooks/useVerified";
import { VerifiedBadge } from "@/components/auth/VerifiedBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const ProfileConnected = () => {
  const { user } = useAuth();
  const { verified } = useVerified();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Static badges for demo - will be fetched from DB once types are regenerated
  const badges = [
    { badge_name: "Founder", badge_color: "gold", tier: "Founder Tier" },
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const achievements = [
    { id: 1, name: "Market Maven", description: "100+ upvotes in Markets", icon: TrendingUp, earned: true },
    { id: 2, name: "Discussion Leader", description: "50 threads created", icon: MessageSquare, earned: true },
    { id: 3, name: "Elite Contributor", description: "1000+ points earned", icon: Star, earned: profile?.points >= 1000 },
    { id: 4, name: "Streak Master", description: "30 day streak", icon: Flame, earned: profile?.streak_days >= 30 },
  ];

  const recentActivity = [
    { id: 1, type: "post", title: "New market analysis posted", time: "2 hours ago", points: 45 },
    { id: 2, type: "comment", title: "Commented on startup strategies", time: "5 hours ago", points: 12 },
    { id: 3, type: "achievement", title: "Earned achievement", time: "1 day ago", points: 100 },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const userBadges = badges.map(b => ({
    name: b.badge_name,
    color: b.badge_color,
    tier: b.tier
  }));

  const initials = profile?.username?.slice(0, 2).toUpperCase() || "U";
  const nextMilestone = 5000;
  const progressPercent = ((profile?.points || 0) / nextMilestone) * 100;

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
                    {initials}
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{profile?.full_name || "User"}</h2>
                  <p className="text-muted-foreground mb-1">@{profile?.username}</p>
                  <div className="flex justify-center mb-4">
                    <VerifiedBadge verified={verified} />
                  </div>
                  {userBadges.length > 0 && (
                    <div className="mb-4">
                      <PremiumBadges badges={userBadges} />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-6">
                    {profile?.bio || "No bio yet"}
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
                    <span className="text-sm font-medium">{profile?.points || 0} / {nextMilestone}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {nextMilestone - (profile?.points || 0)} more points needed for Master rank
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{profile?.points || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{profile?.streak_days || 0}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">0</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">-</div>
                  <div className="text-sm text-muted-foreground">Leaderboard</div>
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
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        +{activity.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfileConnected;
