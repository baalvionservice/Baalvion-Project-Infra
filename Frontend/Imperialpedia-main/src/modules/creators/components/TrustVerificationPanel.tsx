"use client";

import React from "react";
import { ContributorTrustData, VerificationFlag } from "@/types/trust";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Info,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrustScoreGauge } from "./TrustScoreGauge";
import { CredibilityTimeline } from "./CredibilityTimeline";

interface TrustVerificationPanelProps {
  trustData: ContributorTrustData;
  displayName: string;
}

/**
 * Specialized profile section for verified expert credibility details.
 */
export function TrustVerificationPanel({
  trustData,
  displayName,
}: TrustVerificationPanelProps) {
  const getFlagIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Primary Verification State */}
      <div className="lg:col-span-4 space-y-8">
        <Card className="glass-card border-none shadow-2xl bg-card/30">
          <CardHeader className="text-center pb-2">
            <Text
              variant="label"
              className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4"
            >
              Verification State
            </Text>
          </CardHeader>
          <CardContent className="space-y-8 pb-10">
            <TrustScoreGauge
              score={trustData.trust_score}
              level={trustData.level}
              size="lg"
            />

            <div className="space-y-3 pt-4 border-t border-white/5">
              {trustData.verification_flags.map((flag) => (
                <div
                  key={flag.type}
                  className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-white/5 group hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {getFlagIcon(flag.status)}
                    <Text
                      variant="caption"
                      weight="bold"
                      className="text-muted-foreground group-hover:text-foreground transition-colors"
                    >
                      {flag.label}
                    </Text>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground/30 hover:text-primary transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="glass-card border-white/10 text-[10px] p-3 max-w-[200px]">
                        Cryptographically signed verification node from our
                        institutional audit cluster.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="p-8 rounded-[3rem] bg-primary/5 border border-primary/20 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Target className="h-4 w-4" /> Integrity Note
          </div>
          <Text
            variant="caption"
            className="text-muted-foreground leading-relaxed italic"
          >
            "Trust scores are dynamically adjusted based on **Source
            Authenticity**, **Forecast Precision**, and **Community Interaction
            Quality**."
          </Text>
        </div>
      </div>

      {/* Detailed Credibility Registry */}
      <div className="lg:col-span-8 space-y-10">
        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8">
            <CardTitle className="text-xl flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" /> Expert Credential
              Registry
            </CardTitle>
            <CardDescription>
              Verified academic and professional markers for {displayName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Text
                    variant="label"
                    className="text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    Organizational Hub
                  </Text>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-white/5">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <Text variant="bodySmall" weight="bold">
                      {trustData.organization || "Independent Analyst"}
                    </Text>
                  </div>
                </div>

                <div className="space-y-4">
                  <Text
                    variant="label"
                    className="text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    Authority Certifications
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {trustData.certifications?.map((cert) => (
                      <Badge
                        key={cert}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-none text-[9px] font-bold uppercase h-6 px-3"
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Text
                  variant="label"
                  className="text-[10px] font-bold text-muted-foreground uppercase"
                >
                  Credibility Evolution
                </Text>
                <CredibilityTimeline milestones={trustData.milestones} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-white/5 p-6 flex justify-between items-center">
            <Text
              variant="caption"
              className="text-muted-foreground font-medium flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Handshake ID:{" "}
              {displayName.replace(" ", "").toLowerCase()}-v4.2
            </Text>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold uppercase tracking-widest text-primary gap-2"
            >
              Review Full Audit Chain <ExternalLink className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>

        {/* Impact Pulse Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Avg. Engagement",
              value: trustData.avg_engagement,
              icon: Zap,
              color: "text-primary",
            },
            {
              label: "Reputation Tier",
              value: "Elite",
              icon: Award,
              color: "text-secondary",
            },
            {
              label: "Network Multiplier",
              value: "2.4x",
              icon: TrendingUp,
              color: "text-emerald-500",
            },
          ].map((item) => (
            <Card
              key={item.label}
              className="glass-card border-none hover:border-white/20 transition-all group"
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                <div
                  className={cn(
                    "p-2 rounded-lg bg-background/50 border border-white/5 transition-transform group-hover:scale-110",
                    item.color
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold tracking-tighter">
                  {item.value}
                </div>
                <Text
                  variant="label"
                  className="text-[8px] opacity-50 uppercase font-bold tracking-widest leading-tight"
                >
                  {item.label}
                </Text>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
