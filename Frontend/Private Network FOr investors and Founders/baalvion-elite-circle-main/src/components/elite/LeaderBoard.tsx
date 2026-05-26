import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  id: string;
  username: string;
  total_points: number;
  threads_created: number;
  upvotes_received: number;
  engagement_score: number;
  badge: string | null;
  rank: number | null;
}

interface LeaderBoardProps {
  metrics?: string[];
  display?: string;
  refreshInterval?: string;
}

export const LeaderBoard = ({
  metrics = ["Top Contributors", "Most Upvoted Threads", "Highest Engagement"],
  display = "top10",
}: LeaderBoardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("elite_leaderboard" as any)
        .select("*")
        .order("total_points", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaderboard((data || []) as unknown as LeaderboardEntry[]);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Trophy className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  if (loading) {
    return <Card className="p-6">Loading leaderboard...</Card>;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Elite Leaderboard</h2>
      </div>

      <div className="space-y-4">
        {leaderboard.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No leaderboard data yet. Be the first to contribute!
          </p>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-background/50 hover:bg-background transition-colors"
            >
              <div className="w-12 flex justify-center">
                {getRankIcon(index + 1)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{entry.username}</span>
                  {entry.badge && (
                    <Badge variant="secondary">{entry.badge}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {entry.total_points} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {entry.threads_created} threads
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {entry.total_points}
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
