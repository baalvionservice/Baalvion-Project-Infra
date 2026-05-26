"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Zap,
  Loader2,
  ChevronRight,
  TrendingUp,
  MoreVertical,
  Briefcase,
  IndianRupee,
  Building2,
  Eye,
  Info,
  Clock,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  where,
} from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { Campaign, CampaignStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function AdminCampaignModerationPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_REVIEW");
  const [industryFilter, setNicheFilter] = useState<string>("all");
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [decisionType, setDecisionType] = useState<
    "APPROVE" | "REJECT" | "MODIFY"
  >("APPROVE");
  const [decisionNote, setDecisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Campaigns
  const { data: campaigns, loading } = useCollection<Campaign>(
    db ? query(collection(db, "campaigns"), orderBy("createdAt", "desc")) : null
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.brandId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesNiche =
        industryFilter === "all" || (c.niches || []).includes(industryFilter);
      return matchesSearch && matchesStatus && matchesNiche;
    });
  }, [campaigns, searchQuery, statusFilter, industryFilter]);

  const handleDecision = async () => {
    if (!selectedCampaign || isSubmitting || !db) return;
    if (decisionType !== "APPROVE" && !decisionNote.trim()) {
      return toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please provide a reason for rejection or modification.",
      });
    }

    setIsSubmitting(true);
    const campaignRef = doc(db, "campaigns", selectedCampaign.id);

    let newStatus: CampaignStatus = CampaignStatus.ACTIVE;
    if (decisionType === "REJECT") newStatus = CampaignStatus.REJECTED;
    if (decisionType === "MODIFY") newStatus = CampaignStatus.DRAFT;

    const updateData = {
      status: newStatus,
      moderationNotes: decisionNote,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(campaignRef, updateData);

      // Notify Brand
      const brandId = selectedCampaign.brandId.replace("brand_", "");
      await addDoc(collection(db, "notifications"), {
        userId: brandId,
        title:
          decisionType === "APPROVE"
            ? "Campaign Approved! 🚀"
            : decisionType === "REJECT"
            ? "Campaign Rejected"
            : "Action Required: Campaign Brief",
        message:
          decisionType === "APPROVE"
            ? `Your campaign "${selectedCampaign.title}" is now live and creators are being matched.`
            : `Update regarding "${selectedCampaign.title}": ${decisionNote}`,
        type: "CAMPAIGN",
        read: false,
        createdAt: new Date().toISOString(),
        link: `/dashboard/brand/campaigns/${selectedCampaign.id}`,
      });

      toast({
        title: "Decision Applied",
        description: `Campaign has been ${decisionType.toLowerCase()}ed and brand notified.`,
      });

      setIsDecisionDialogOpen(false);
      setDecisionNote("");
      setSelectedCampaign(null);
    } catch (err: any) {
      errorEmitter.emitPermissionError(
        new FirestorePermissionError({
          path: campaignRef.path,
          operation: "update",
          requestResourceData: updateData,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return {
          label: "In Queue",
          color: "bg-orange-100 text-orange-600",
          icon: Clock,
        };
      case "ACTIVE":
        return {
          label: "Live",
          color: "bg-emerald-100 text-emerald-600",
          icon: Zap,
        };
      case "REJECTED":
        return {
          label: "Rejected",
          color: "bg-red-100 text-red-600",
          icon: XCircle,
        };
      case "DRAFT":
        return {
          label: "Needs Mod",
          color: "bg-blue-100 text-blue-600",
          icon: FileText,
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 text-slate-500",
          icon: Briefcase,
        };
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Campaign Moderation
          </h1>
          <p className="text-slate-500 font-medium">
            Audit briefs, enforce marketplace integrity, and manage operational
            project flow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase h-11 px-4 rounded-xl flex items-center gap-2">
            <Clock className="h-4 w-4" />{" "}
            {campaigns.filter((c) => c.status === "PENDING_REVIEW").length}{" "}
            Awaiting Review
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by campaign title or ID..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">
                All Status
              </SelectItem>
              <SelectItem value="PENDING_REVIEW" className="font-bold">
                Moderation Queue
              </SelectItem>
              <SelectItem value="ACTIVE" className="font-bold">
                Active Projects
              </SelectItem>
              <SelectItem value="REJECTED" className="font-bold text-red-600">
                Rejected
              </SelectItem>
              <SelectItem value="DRAFT" className="font-bold">
                Modification Requested
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 text-slate-400"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Moderation Ledger */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">
                  Campaign Brief
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">
                  Budget Cap
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">
                  Audience Target
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">
                  Status
                </TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                  Moderation
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp, idx) => {
                  const status = getStatusConfig(camp.status);
                  return (
                    <TableRow
                      key={camp.id}
                      className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-28"
                    >
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                            <Briefcase className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="font-black text-slate-900 leading-none truncate max-w-[250px]">
                              {camp.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase h-4 px-1.5"
                              >
                                {camp.brandId.replace("brand_", "ID: ")}
                              </Badge>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Created{" "}
                                {new Date(
                                  camp.createdAt || ""
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-slate-900">
                            ₹{camp.budget.toLocaleString()}
                          </span>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            Escrow Ready
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="border-slate-200 text-slate-600 font-bold text-[10px] h-5"
                          >
                            {camp.creatorTier || "MICRO"} Tier
                          </Badge>
                          <div className="flex -space-x-2">
                            {(camp.niches || []).slice(0, 3).map((n, i) => (
                              <div
                                key={i}
                                className="h-5 px-2 rounded-full bg-white border border-slate-100 text-[8px] font-black text-slate-400 flex items-center justify-center shadow-sm"
                              >
                                {n}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase border-none",
                            status.color
                          )}
                        >
                          <status.icon className="h-3 w-3 mr-1.5" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-bold h-10 px-4 bg-slate-50 text-slate-600 hover:text-primary"
                            onClick={() => {
                              setSelectedCampaign(camp);
                              setDecisionType("MODIFY");
                              setIsDecisionDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1.5" /> Audit
                          </Button>
                          {camp.status === "PENDING_REVIEW" && (
                            <Button
                              size="sm"
                              className="rounded-xl font-bold h-10 bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-lg shadow-emerald-500/20"
                              onClick={() => {
                                setSelectedCampaign(camp);
                                setDecisionType("APPROVE");
                                setIsDecisionDialogOpen(true);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />{" "}
                              Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        Moderation Queue is Empty
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Governance Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
          <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <AlertCircle className="h-8 w-8 text-orange-400" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">Policy Enforcement</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Review all external links and campaign hashtags. Ensure brand
              objectives do not violate FTC disclosure guidelines or
              platform-specific content restrictions.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <IndianRupee className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Financial Integrity</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Campaigns above ₹1,00,000 require secondary audit of the brand's
              verified billing status before being approved for the global feed.
            </p>
          </div>
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog
        open={isDecisionDialogOpen}
        onOpenChange={setIsDecisionDialogOpen}
      >
        <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-2xl shadow-2xl">
          <div className="bg-slate-50 p-8 border-b">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center",
                    decisionType === "APPROVE"
                      ? "bg-emerald-100 text-emerald-600"
                      : decisionType === "REJECT"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  )}
                >
                  {decisionType === "APPROVE" ? (
                    <ThumbsUp className="h-6 w-6" />
                  ) : decisionType === "REJECT" ? (
                    <ThumbsDown className="h-6 w-6" />
                  ) : (
                    <MessageSquare className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">
                    Moderate Campaign
                  </DialogTitle>
                  <DialogDescription className="font-medium">
                    Audit brief for "{selectedCampaign?.title}"
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Brand Objectives
                </h4>
                <div className="space-y-2">
                  {selectedCampaign?.objectives.map((obj, i) => (
                    <div
                      key={i}
                      className="text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100"
                    >
                      {obj}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Content Rules
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Total Deliverables</span>
                    <span className="text-slate-900">
                      {selectedCampaign?.deliverables?.length || 0} Assets
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Niches</span>
                    <span className="text-slate-900">
                      {selectedCampaign?.niches.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-4">
              <Label className="font-bold text-slate-700">
                Moderation Action
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "APPROVE", label: "Approve", color: "bg-emerald-500" },
                  { id: "MODIFY", label: "Request Fix", color: "bg-blue-500" },
                  { id: "REJECT", label: "Reject", color: "bg-red-500" },
                ].map((act) => (
                  <Button
                    key={act.id}
                    variant="outline"
                    className={cn(
                      "rounded-xl font-bold h-12 transition-all",
                      decisionType === act.id
                        ? `${act.color} text-white border-transparent shadow-lg`
                        : "bg-white text-slate-400 border-slate-100"
                    )}
                    onClick={() => setDecisionType(act.id as any)}
                  >
                    {act.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-bold text-slate-700">
                Admin Note to Brand
              </Label>
              <Textarea
                placeholder={
                  decisionType === "APPROVE"
                    ? "Optional approval message..."
                    : "Please specify policy violation or required changes..."
                }
                className="min-h-[120px] rounded-2xl p-6 bg-slate-50 border-none focus-visible:ring-primary text-md"
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button
              variant="ghost"
              className="rounded-xl font-bold h-12 px-6"
              onClick={() => setIsDecisionDialogOpen(false)}
            >
              Cancel Audit
            </Button>
            <Button
              disabled={
                isSubmitting ||
                (decisionType !== "APPROVE" && !decisionNote.trim())
              }
              onClick={handleDecision}
              className={cn(
                "rounded-xl font-bold h-12 px-10 shadow-xl",
                decisionType === "APPROVE"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  : decisionType === "REJECT"
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                  : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Finalize Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
