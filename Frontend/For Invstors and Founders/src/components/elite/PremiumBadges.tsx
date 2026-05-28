import { Badge } from "@/components/ui/badge";
import { Crown, Gem, Star } from "lucide-react";

interface BadgeConfig {
  name: string;
  color: string;
  tier: string;
}

interface PremiumBadgesProps {
  badges: BadgeConfig[];
  userBadges?: string[];
}

export const PremiumBadges = ({
  badges,
  userBadges = [],
}: PremiumBadgesProps) => {
  const getBadgeIcon = (badgeName: string) => {
    switch (badgeName.toLowerCase()) {
      case "founder":
        return <Crown className="h-4 w-4" />;
      case "investor":
        return <Gem className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (color: string) => {
    const colorMap: Record<string, string> = {
      gold: "bg-yellow-500 text-white",
      platinum: "bg-gray-300 text-gray-900",
      emerald: "bg-emerald-500 text-white",
    };
    return colorMap[color] || "bg-primary text-primary-foreground";
  };

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <Badge
          key={index}
          className={`${getBadgeColor(badge.color)} flex items-center gap-1 px-3 py-1`}
          variant="secondary"
        >
          {getBadgeIcon(badge.name)}
          <span>{badge.name}</span>
        </Badge>
      ))}
    </div>
  );
};
