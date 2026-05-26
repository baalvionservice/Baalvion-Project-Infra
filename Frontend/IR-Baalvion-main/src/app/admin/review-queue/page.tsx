"use client";

import { useEffect, useState } from "react";
import { pageService } from "@/core/services/page.service";
import { PageDefinition, UserRole } from "@/core/content/schemas";
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
import { CheckCircle, XCircle, Eye, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/core/services/auth.service";

export default function ReviewQueuePage() {
  const [pendingPages, setPendingPages] = useState<PageDefinition[]>([]);
  const [userRole, setUserRole] = useState<UserRole>("public");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    const [pagesResponse, { role }] = await Promise.all([
      pageService.getAllPages(),
      authService.getCurrentUser(),
    ]);

    const pages = pagesResponse.data || [];
    setPendingPages(pages.filter((p) => p.workflowStatus === "InReview"));
    setUserRole(role);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await pageService.approvePage(id);
        toast({
          title: "Approved",
          description: "Content has been moved to Approved state.",
        });
      } else {
        // Mock reject logic
        toast({
          title: "Rejected",
          description: "Content has been returned to Draft.",
        });
      }
      loadData();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: e.message,
      });
    }
  };

  if (isLoading)
    return (
      <div className="py-20 text-center text-muted-foreground">
        Accessing review queue...
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance Review Queue
        </h1>
        <p className="text-muted-foreground">
          High-priority approvals for institutional content and governance
          updates.
        </p>
      </div>

      {pendingPages.length === 0 ? (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">Queue Clear</h3>
            <p className="text-muted-foreground max-w-xs">
              All submitted changes have been reviewed and processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div>
                        <p className="font-bold">{page.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          ID: {page.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Page</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        v{page.currentVersion}.1-draft
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">IR Manager</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> Diff
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction(page.id, "approve")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(page.id, "reject")}
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {userRole !== "ComplianceOfficer" && userRole !== "admin" && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/80">
            <p className="font-bold mb-1">Restricted View</p>
            <p>
              You are viewing the queue as {userRole}. Only users with the{" "}
              <strong>ComplianceOfficer</strong> role can execute approval
              actions. Interface buttons are for simulation only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
