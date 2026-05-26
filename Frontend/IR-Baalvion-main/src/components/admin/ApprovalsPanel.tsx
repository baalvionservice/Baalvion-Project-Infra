"use client";

import { useState } from "react";
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
import { CheckCircle2, XCircle, Clock, UserCheck, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/core/content/schemas";
import { auditService } from "@/core/services/audit.service";

interface ApprovalItem {
  id: string;
  type: "Investor" | "Capital Call";
  target: string;
  amount?: string;
  status: "Pending" | "Approved" | "Rejected";
  date: string;
}

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "APP-001",
    type: "Investor",
    target: "Elena Petrov",
    status: "Pending",
    date: "2026-02-10",
  },
  {
    id: "APP-002",
    type: "Capital Call",
    target: "Growth Fund A",
    amount: "$5,000,000",
    status: "Pending",
    date: "2026-02-11",
  },
  {
    id: "APP-003",
    type: "Investor",
    target: "North Atlantic Pension",
    status: "Pending",
    date: "2026-02-12",
  },
];

export function ApprovalsPanel({ role }: { role: UserRole }) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const { toast } = useToast();

  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    if (role !== "admin" && role !== "compliance" && role !== "admin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Insufficient privileges for workflow actions.",
      });
      return;
    }

    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: action } : a))
    );

    await auditService.log({
      userRole: role,
      module: "Workflow",
      action: action === "Approved" ? "approve" : "reject",
      entityId: id,
      newState: { status: action },
    });

    toast({
      title: `Workflow ${action}`,
      description: `${item.type} request for ${
        item.target
      } has been ${action.toLowerCase()}.`,
    });
  };

  return (
    <div className="grid gap-8">
      <Card className="bg-card/30 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Pending Review Queue
          </CardTitle>
          <CardDescription>
            Critical approvals required for capital operations and onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-6">
                  Type
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Entity / Target
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Amount
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals
                .filter((a) => a.status === "Pending")
                .map((item) => (
                  <TableRow key={item.id} className="border-border/50 group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        {item.type === "Investor" ? (
                          <UserCheck className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Wallet className="h-3 w-3 text-primary" />
                        )}
                        <span className="text-xs font-bold">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {item.target}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {item.amount || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[9px] uppercase font-bold tracking-tighter"
                      >
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-green-500 hover:bg-green-500/10"
                          onClick={() => handleAction(item.id, "Approved")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:bg-destructive/10"
                          onClick={() => handleAction(item.id, "Rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {approvals.filter((a) => a.status === "Pending").length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground text-xs italic"
                  >
                    Queue clear. No pending approvals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card/30 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Processed Actions</CardTitle>
          <CardDescription>
            Historical record of approvals and rejections in the current
            session.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {approvals
                .filter((a) => a.status !== "Pending")
                .map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-border/50 opacity-60"
                  >
                    <TableCell className="pl-6 text-xs">{item.type}</TableCell>
                    <TableCell className="text-xs font-bold">
                      {item.target}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge
                        variant={
                          item.status === "Approved" ? "default" : "destructive"
                        }
                        className="text-[9px] uppercase"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
