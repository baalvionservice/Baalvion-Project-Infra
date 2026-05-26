import { Award, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
    progress?: number;
    progressRequired?: number;
    earned: boolean;
    earnedAt?: string;
  };
}

const rarityColors = {
  common: "bg-secondary",
  rare: "bg-blue-500/20 border-blue-500/30",
  epic: "bg-purple-500/20 border-purple-500/30",
  legendary: "bg-primary/20 border-primary/30",
};

const rarityBadges = {
  common: "secondary",
  rare: "default",
  epic: "default",
  legendary: "default",
};

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const progressPercent = achievement.progress && achievement.progressRequired
    ? (achievement.progress / achievement.progressRequired) * 100
    : 0;

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 ${
        achievement.earned
          ? `${rarityColors[achievement.rarity]} border-2`
          : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            achievement.earned ? 'bg-primary/20' : 'bg-secondary/50'
          }`}>
            {achievement.earned ? (
              <Award className="w-10 h-10 text-primary" />
            ) : (
              <Lock className="w-10 h-10 text-muted-foreground" />
            )}
          </div>

          {/* Name & Rarity */}
          <h3 className="font-bold text-lg mb-2">{achievement.name}</h3>
          <Badge 
            variant={rarityBadges[achievement.rarity] as any}
            className="mb-3 capitalize"
          >
            {achievement.rarity}
          </Badge>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4">
            {achievement.description}
          </p>

          {/* Progress Bar (if not earned) */}
          {!achievement.earned && achievement.progress !== undefined && achievement.progressRequired && (
            <div className="w-full space-y-2 mb-4">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {achievement.progress} / {achievement.progressRequired}
              </p>
            </div>
          )}

          {/* XP Reward */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Reward:</span>
            <Badge variant="outline" className="text-primary border-primary">
              +{achievement.xpReward} XP
            </Badge>
          </div>

          {/* Earned Date */}
          {achievement.earned && achievement.earnedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
