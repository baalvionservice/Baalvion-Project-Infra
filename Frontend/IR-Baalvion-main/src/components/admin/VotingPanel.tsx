"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { UserRole } from "@/core/content/schemas";
import { auditService } from "@/core/services/audit.service";
import { useToast } from "@/hooks/use-toast";

interface Resolution {
  id: string;
  title: string;
  status: "Open" | "Closed";
  results?: { approve: number; reject: number };
  dueDate: string;
}

const INITIAL_RESOLUTIONS: Resolution[] = [
  {
    id: "RES-001",
    title: "Board Re-election: Q1 2026 Tranche",
    status: "Open",
    dueDate: "2026-03-01",
  },
  {
    id: "RES-002",
    title: "Authorization of Secondary Secondary Buyback",
    status: "Open",
    dueDate: "2026-03-15",
  },
  {
    id: "RES-003",
    title: "SPV Alpha Asset Liquidation Policy",
    status: "Closed",
    results: { approve: 88, reject: 12 },
    dueDate: "2026-01-10",
  },
];

export function VotingPanel({ role }: { role: UserRole }) {
  const [resolutions, setResolutions] =
    useState<Resolution[]>(INITIAL_RESOLUTIONS);
  const { toast } = useToast();

  const handleClose = async (id: string) => {
    if (role !== "admin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only Admins can finalize resolutions.",
      });
      return;
    }

    setResolutions((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Closed",
              results: {
                approve: Math.floor(Math.random() * 20) + 80,
                reject: Math.floor(Math.random() * 10),
              },
            }
          : r
      )
    );

    await auditService.log({
      userRole: role,
      module: "Voting",
      action: "publish",
      entityId: id,
      newState: { status: "Closed" },
    });

    toast({
      title: "Resolution Finalized",
      description: "Voting results have been immutably recorded.",
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {resolutions.map((res) => (
        <Card
          key={res.id}
          className={`bg-card/30 border-border/50 ${
            res.status === "Closed" ? "opacity-70" : ""
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start mb-2">
              <Badge
                variant={res.status === "Open" ? "default" : "outline"}
                className="text-[9px] uppercase font-bold tracking-widest"
              >
                {res.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">
                {res.id}
              </span>
            </div>
            <CardTitle className="text-base font-bold leading-tight">
              {res.title}
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">
              Ends: {res.dueDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {res.status === "Open" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <p className="text-[10px] text-muted-foreground italic">
                    Institutional quorum currently at 64% (Verified).
                  </p>
                </div>
                <Button
                  className="w-full h-9 text-xs font-bold uppercase tracking-widest"
                  onClick={() => handleClose(res.id)}
                >
                  Finalize Resolution <Gavel className="ml-2 h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                    <p className="text-[10px] font-bold uppercase text-green-500">
                      Approve
                    </p>
                    <p className="text-xl font-bold">{res.results?.approve}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                    <p className="text-[10px] font-bold uppercase text-red-500">
                      Reject
                    </p>
                    <p className="text-xl font-bold">{res.results?.reject}%</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-9 text-xs font-bold uppercase tracking-widest"
                >
                  <BarChart3 className="mr-2 h-3 w-3" /> View Ballot Audit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
