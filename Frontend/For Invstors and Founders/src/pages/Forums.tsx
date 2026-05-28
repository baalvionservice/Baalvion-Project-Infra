import { Link } from "react-router-dom";
import { MessageSquare, TrendingUp, Users, Lock, Zap, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SubscriptionBanner } from "@/components/elite/SubscriptionBanner";
import MainLayout from "@/components/layout/MainLayout";

const Forums = () => {
  const forumCategories = [
    {
      id: 1,
      name: "Market Strategy Hub",
      description: "Discuss market trends, investment strategies, and financial insights",
      members: 2847,
      threads: 1243,
      icon: TrendingUp,
      color: "text-primary",
      elite: true
    },
    {
      id: 2,
      name: "System Cracking & Innovation",
      description: "Break down systems, explore innovative solutions, and share breakthrough ideas",
      members: 1956,
      threads: 892,
      icon: Zap,
      color: "text-primary",
      elite: true
    },
    {
      id: 3,
      name: "Startup & Entrepreneurship",
      description: "Build, scale, and succeed with insights from elite founders",
      members: 3421,
      threads: 2103,
      icon: Users,
      color: "text-primary",
      elite: false
    },
    {
      id: 4,
      name: "Top 10 Hackers United",
      description: "Exclusive forum for verified elite security experts and hackers",
      members: 247,
      threads: 156,
      icon: Lock,
      color: "text-destructive",
      elite: true
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Premium Upgrade Banner */}
          <SubscriptionBanner />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Elite Forums</h1>
              <p className="text-muted-foreground text-lg">
                Exclusive discussions for verified members
              </p>
            </div>
            <Button variant="premium">
              <MessageSquare className="w-4 h-4 mr-2" />
              New Thread
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {forumCategories.map((forum) => {
              const Icon = forum.icon;
              return (
                <Card 
                  key={forum.id} 
                  className="bg-gradient-to-br from-card to-card/80 border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300 cursor-pointer group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors`}>
                          <Icon className={`w-6 h-6 ${forum.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                              {forum.name}
                            </CardTitle>
                            {forum.elite && (
                              <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                                Elite
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-muted-foreground">
                            {forum.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{forum.members.toLocaleString()}</span>
                        <span className="text-muted-foreground">members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{forum.threads.toLocaleString()}</span>
                        <span className="text-muted-foreground">threads</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gradient-to-br from-card to-card/80 border-border hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">John Mitchell</span>
                          <span className="text-muted-foreground text-sm">posted in</span>
                          <Badge variant="secondary" className="text-xs">Market Strategy</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          New insights on Q4 market predictions and investment opportunities...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>2 hours ago</span>
                          <span>•</span>
                          <span>23 replies</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Forums;
