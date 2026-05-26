"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ArrowRight,
  Loader2,
  FileSearch,
  MessageSquare,
} from "lucide-react";
import { getSubmittedArticles } from "@/services/mock-api/articles";
import { ArticleSubmission } from "@/modules/content-engine/types/article";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/state/app-store";
import Link from "next/link";

export default function EditorialWorkflowPage() {
  const [submissions, setSubmissions] = useState<ArticleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addNotification } = useAppStore();

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const data = await getSubmittedArticles();
        // Map mock data to Submission type
        const mapped: ArticleSubmission[] = data.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body || "",
          authorId: item.authorId,
          status: item.status as any,
          submittedAt: item.submittedAt,
        }));
        setSubmissions(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, []);

  const handleAction = (id: string, action: "approve" | "request_changes") => {
    const status = action === "approve" ? "approved" : "changes_requested";
    const submission = submissions.find((s) => s.id === id);

    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );

    const message =
      action === "approve"
        ? `Article "${submission?.title}" has been approved and scheduled for publication.`
        : `Revision requested for "${submission?.title}". Feedback sent to writer.`;

    toast({
      title: action === "approve" ? "Submission Approved" : "Changes Requested",
      description: message,
    });

    addNotification({
      userId: submission?.authorId || "unknown",
      message: message,
      type: action === "approve" ? "success" : "warning",
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">
            Editorial Workflow
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Validating expert analysis for the Imperialpedia Intelligence Index.
          </Text>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
          <FileSearch className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">
            {submissions.filter((s) => s.status === "submitted").length} Pending
            Review
          </span>
        </div>
      </header>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Article Submission</TableHead>
              <TableHead>Expert</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col max-w-md">
                      <span className="font-bold text-sm truncate">
                        {item.title}
                      </span>
                      <Link
                        href={`/editor/review/${item.id}`}
                        className="text-[10px] text-primary hover:underline flex items-center mt-1"
                      >
                        Read full analysis{" "}
                        <ArrowRight className="ml-1 h-2 w-2" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{item.authorId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs">
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.submittedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : item.status === "changes_requested"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "submitted" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs border-amber-500/30 hover:bg-amber-500/10"
                          onClick={() =>
                            handleAction(item.id, "request_changes")
                          }
                        >
                          <MessageSquare className="mr-1.5 h-3 w-3" /> Revisions
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAction(item.id, "approve")}
                        >
                          <CheckCircle2 className="mr-1.5 h-3 w-3" /> Approve
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">
                        Processed
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" /> Editorial
              Guideline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Always verify macro-economic claims against the Intelligence
              Index. If an article lacks proper sourcing for interest rate
              projections, request changes immediately.
            </Text>
          </CardContent>
        </Card>

        <Card className="glass-card bg-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary" /> Performance SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Our current average review time is 4.2 hours. Aim to clear the
              high-priority queue within 6 hours of submission to maintain
              platform velocity.
            </Text>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
