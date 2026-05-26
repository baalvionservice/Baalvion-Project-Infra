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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/design-system/typography/text";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Loader2,
  Search,
  ExternalLink,
} from "lucide-react";
import { getPendingVerifications } from "@/services/mock-api/creators";
import { CreatorVerification } from "@/types";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

/**
 * Admin Creator Verification Management Page.
 * Allows administrators to review expert authentication requests and assign verified status.
 */
export default function CreatorVerificationPage() {
  const [requests, setRequests] = useState<CreatorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await getPendingVerifications();
        setRequests(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

  const handleAction = (creatorId: string, action: "approve" | "reject") => {
    const creator = requests.find((r) => r.creatorId === creatorId);
    setRequests((prev) => prev.filter((r) => r.creatorId !== creatorId));

    toast({
      title:
        action === "approve" ? "Creator Verified" : "Verification Rejected",
      description: `${creator?.creatorName} has been ${
        action === "approve" ? "assigned" : "denied"
      } verified status.`,
      variant: action === "reject" ? "destructive" : "default",
    });
  };

  const filtered = requests.filter((r) =>
    r.creatorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-secondary mb-1">
            <ShieldCheck className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Compliance Hub
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">
            Expert Authentication
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Review and validate experts for the Imperialpedia Intelligence
            Index.
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {requests.length} Pending Requests
          </span>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter requests by name..."
          className="pl-10 bg-card/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="glass-card overflow-hidden border-none shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Candidate</TableHead>
              <TableHead>Proof of Expertise</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <Text variant="caption" className="animate-pulse">
                      Validating credentials...
                    </Text>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-48 text-center text-muted-foreground italic"
                >
                  No pending verification requests found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => (
                <TableRow
                  key={req.creatorId}
                  className="group hover:bg-muted/20"
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl border border-white/10">
                        <AvatarImage src={req.creatorAvatar} />
                        <AvatarFallback>
                          {req.creatorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">
                          {req.creatorName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ID: {req.creatorId}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {req.documentsProvided.map((doc) => (
                        <Badge
                          key={doc}
                          variant="outline"
                          className="text-[9px] font-bold py-0 h-5 border-secondary/30 bg-secondary/5 text-secondary"
                        >
                          <FileText className="h-2.5 w-2.5 mr-1" /> {doc}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">
                        {req.requestedAt
                          ? format(new Date(req.requestedAt), "MMM d, yyyy")
                          : "N/A"}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{" "}
                        {req.requestedAt
                          ? format(new Date(req.requestedAt), "HH:mm")
                          : "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold uppercase tracking-widest">
                      Pending
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleAction(req.creatorId, "reject")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-xs"
                        onClick={() => handleAction(req.creatorId, "approve")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Verify
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Guidelines Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card bg-secondary/5 border-secondary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-secondary/10">
              <ShieldCheck className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <Text variant="bodySmall" weight="bold">
                Verification Criteria
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground mt-1 leading-relaxed"
              >
                Expert status requires proven industry experience, advanced
                academic degrees, or a significant public record of financial
                research. Always verify primary sources before approving.
              </Text>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <ExternalLink className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Text variant="bodySmall" weight="bold">
                Platform Benefits
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground mt-1 leading-relaxed"
              >
                Verified creators receive increased reach in the Intelligence
                Engine, early access to new AI content tools, and a higher
                revenue share from platform engagement.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
