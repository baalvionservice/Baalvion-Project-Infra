"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Copy, Clapperboard, Rabbit } from "lucide-react";
import type { Submission } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FlagStatus = "Normal" | "Warning" | "Critical";

type AntiCheatingFlag = {
  name: string;
  status: FlagStatus;
  description: string;
  icon: React.ElementType;
};

const getStatusVariant = (status: FlagStatus) => {
  switch (status) {
    case "Critical":
      return "destructive";
    case "Warning":
      return "warning";
    default:
      return "default";
  }
};

const getRiskLevel = (
  flags: AntiCheatingFlag[]
): { level: FlagStatus; description: string } => {
  const criticalCount = flags.filter((f) => f.status === "Critical").length;
  const warningCount = flags.filter((f) => f.status === "Warning").length;

  if (criticalCount > 0) {
    return {
      level: "Critical",
      description: "High risk of academic dishonesty detected.",
    };
  }
  if (warningCount > 1) {
    return {
      level: "Warning",
      description: "Multiple potential issues detected.",
    };
  }
  if (warningCount > 0) {
    return { level: "Warning", description: "Some potential issues detected." };
  }
  return { level: "Normal", description: "No significant issues detected." };
};

export function AntiCheatingIndicatorPanel({
  submission,
}: {
  submission: Submission;
}) {
  // In a real app, these would be fetched or calculated.
  const mockFlags: AntiCheatingFlag[] = [
    {
      name: "Copy/Paste Detected",
      status: submission.plagiarismRisk === "High" ? "Critical" : "Normal",
      description: "Large blocks of code were pasted into the editor.",
      icon: Copy,
    },
    {
      name: "Rapid Typing Speed",
      status: submission.plagiarismRisk === "Medium" ? "Warning" : "Normal",
      description: "Typing speed exceeded normal human limits.",
      icon: Rabbit,
    },
    {
      name: "Multiple Tabs Opened",
      status: "Normal",
      description: "Candidate frequently switched between tabs.",
      icon: Shield,
    },
    {
      name: "Idle Time",
      status: "Normal",
      description: "Long periods of inactivity were detected.",
      icon: Clapperboard,
    },
  ];

  const risk = getRiskLevel(mockFlags);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Anti-Cheating Indicators
          </CardTitle>
          <CardDescription>
            Simulated analysis of submission for potential plagiarism or
            cheating.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <h4 className="font-semibold">Plagiarism Risk</h4>
              <p className="text-sm text-muted-foreground">
                {risk.description}
              </p>
            </div>
            <Badge variant={getStatusVariant(risk.level)} className="text-base">
              {risk.level}
            </Badge>
          </div>
          <div className="space-y-3">
            {mockFlags.map((flag) => (
              <Tooltip key={flag.name}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <flag.icon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{flag.name}</p>
                    </div>
                    <Badge variant={getStatusVariant(flag.status)}>
                      {flag.status}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{flag.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
