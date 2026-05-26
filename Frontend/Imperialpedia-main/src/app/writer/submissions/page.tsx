"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

export default function WriterSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Mock loading submissions
      await new Promise((r) => setTimeout(r, 600));
      setSubmissions([
        {
          id: "s-1",
          title: "The Future of DeFi",
          status: "submitted",
          date: new Date().toISOString(),
        },
        {
          id: "s-2",
          title: "Yield Curve Basics",
          status: "approved",
          date: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[10px] font-bold">
            Approved
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] font-bold">
            Reviewing
          </Badge>
        );
      case "changes_requested":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase text-[10px] font-bold">
            Revisions
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <Text variant="h1" className="text-3xl font-bold">
          Submission Pipeline
        </Text>
        <Text variant="bodySmall" className="text-muted-foreground mt-1">
          Tracking the editorial lifecycle of your expert analysis.
        </Text>
      </header>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Article Submission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Platform Priority</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold py-4">{item.title}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i <= 2 ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(item.date), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={item.status !== "changes_requested"}
                    >
                      <MessageSquare className="mr-2 h-3.5 w-3.5" />
                      {item.status === "changes_requested"
                        ? "View Feedback"
                        : "Locked"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
