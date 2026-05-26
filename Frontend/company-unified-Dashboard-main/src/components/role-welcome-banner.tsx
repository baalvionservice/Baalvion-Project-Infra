"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/lib/types";
import { Crown, Users, TrendingUp, Briefcase } from "lucide-react";

const roleConfig = {
  ADMIN: {
    icon: Crown,
    color: "bg-purple-500",
    title: "Administrator Dashboard",
    description: "You have full access to all businesses and system features.",
    features: [
      "Manage all businesses",
      "User management",
      "System settings",
      "Global analytics",
    ],
  },
  CO_FOUNDER: {
    icon: Users,
    color: "bg-blue-500",
    title: "Co-Founder Dashboard",
    description: "Strategic overview and business management capabilities.",
    features: [
      "Business operations",
      "Team management",
      "Strategic planning",
      "Growth metrics",
    ],
  },
  INVESTOR: {
    icon: TrendingUp,
    color: "bg-green-500",
    title: "Investor Dashboard",
    description: "Financial insights and portfolio performance tracking.",
    features: [
      "Portfolio overview",
      "Financial reports",
      "ROI tracking",
      "Investment analytics",
    ],
  },
  EMPLOYEE: {
    icon: Briefcase,
    color: "bg-orange-500",
    title: "Employee Dashboard",
    description: "Your personal workspace for tasks and attendance.",
    features: [
      "Task management",
      "Attendance tracking",
      "Performance metrics",
      "Team collaboration",
    ],
  },
};

export function RoleWelcomeBanner() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getCurrentUser());
  }, []);

  if (!mounted || !user) {
    return null;
  }

  const config = roleConfig[user.role];
  const Icon = config.icon;

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`p-3 rounded-full ${config.color} text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 md:hidden text-right">
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">{config.title}</h2>
            </div>
            <p className="text-muted-foreground mb-4">{config.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {config.features.map((feature, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {feature}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <p className="font-medium">{user.name}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
