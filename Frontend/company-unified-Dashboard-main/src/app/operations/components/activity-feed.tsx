"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import operationsData from "@/lib/data/operations.json";
import businessesData from "@/lib/data/businesses";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Check,
  DollarSign,
  Server,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getIconForActivity = (description: string) => {
  if (description.includes("order")) return <DollarSign className="h-4 w-4" />;
  if (description.includes("clocked in")) return <User className="h-4 w-4" />;
  if (description.includes("ticket")) return <Check className="h-4 w-4" />;
  if (description.includes("Server costs"))
    return <Server className="h-4 w-4 text-orange-500" />;
  if (description.includes("onboarded")) return <User className="h-4 w-4" />;
  if (description.includes("approved")) return <Check className="h-4 w-4" />;
  if (description.includes("backup")) return <Server className="h-4 w-4" />;
  return <Briefcase className="h-4 w-4" />;
};

export default function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>
          A live feed of events from across your businesses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {operationsData.activityFeed.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {getIconForActivity(activity.description)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.description}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    &mdash; {activity.business}
                  </span>
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {activity.detail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
