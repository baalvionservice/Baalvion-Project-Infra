import { Link } from "react-router-dom";
import { TrendingUp, Users, Zap, Award, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LeaderBoard } from "@/components/elite/LeaderBoard";
import MainLayout from "@/components/layout/MainLayout";

const Dashboard = () => {
  const trendingPosts = [
    {
      id: 1,
      title: "Market Strategy: Q4 2025 Predictions",
      author: "Marcus Chen",
      category: "Markets",
      points: 156,
      comments: 42,
      trending: true
    },
    {
      id: 2,
      title: "Breaking: New AI Framework for Trading",
      author: "Sarah Williams",
      category: "Technology",
      points: 203,
      comments: 87,
      trending: true
    },
    {
      id: 3,
      title: "Insider: Elite Real Estate Investment Strategies",
      author: "James Patterson",
      category: "Real Estate",
      points: 178,
      comments: 56,
      trending: false
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border shadow-[var(--shadow-elevated)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Your Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Points</span>
                    <span className="text-lg font-bold text-primary">2,847</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Rank</span>
                    <Badge variant="default" className="bg-primary text-primary-foreground">Elite</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Streak</span>
                    <span className="text-lg font-bold">47 days</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View Achievements
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Active Forums
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/forums" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Market Strategy</span>
                    <Badge variant="secondary">124 online</Badge>
                  </div>
                </Link>
                <Link to="/forums" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">System Cracking</span>
                    <Badge variant="secondary">89 online</Badge>
                  </div>
                </Link>
                <Link to="/forums" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Startup Insights</span>
                    <Badge variant="secondary">156 online</Badge>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Personalized Feed</h1>
              <Button variant="premium">
                <Zap className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>

            {trendingPosts.map((post) => (
              <Card key={post.id} className="bg-gradient-to-br from-card to-card/80 border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {post.trending && (
                          <TrendingUp className="w-4 h-4 text-primary" />
                        )}
                        <Badge variant="secondary">{post.category}</Badge>
                      </div>
                      <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        by {post.author}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-medium text-primary">{post.points}</span>
                      <span>points</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{post.comments} comments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
