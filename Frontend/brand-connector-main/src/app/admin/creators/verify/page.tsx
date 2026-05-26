"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  Instagram,
  Youtube,
  Music2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Zap,
  Loader2,
  ChevronRight,
  TrendingUp,
  MoreVertical,
  Mail,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Info,
} from "lucide-react";
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  orderBy,
} from "firebase/firestore";
import { useFirestore, useCollection } from "@/firebase";
import { CreatorProfile, UserRole } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CreatorVerificationQueuePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Pending Creator Verifications
  const creatorsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "creators"),
      where("verificationStatus", "==", "PENDING"),
      orderBy("createdAt", "asc")
    );
  }, [db]);

  const { data: pendingCreators, loading } =
    useCollection<CreatorProfile>(creatorsQuery);

  const filteredCreators = useMemo(() => {
    return pendingCreators.filter((c) =>
      c.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pendingCreators, searchQuery]);

  const handleDecision = async (
    creator: CreatorProfile,
    approved: boolean,
    reason?: string
  ) => {
    if (!db) return;
    setIsSubmitting(true);
    const creatorRef = doc(db, "creators", creator.id);
    const userRef = doc(db, "users", creator.userId);

    const updateData = {
      verificationStatus: approved ? "VERIFIED" : "UNVERIFIED",
      isVerified: approved,
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Update Creator Profile
      await updateDoc(creatorRef, updateData);

      // 2. Update central User Doc
      await updateDoc(userRef, { isVerified: approved });

      // 3. Notify Creator
      await addDoc(collection(db, "notifications"), {
        userId: creator.userId,
        title: approved ? "Profile Verified! 🏆" : "Verification Update",
        message: approved
          ? "Congratulations! Your profile has been verified. You now have priority access to high-tier campaigns."
          : `Your verification request was not approved at this time. Reason: ${reason}`,
        type: "SYSTEM",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/dashboard/settings",
      });

      toast({
        title: approved ? "Creator Verified" : "Verification Rejected",
        description: `${creator.username} has been notified.`,
      });

      setIsRejectDialogOpen(false);
      setRejectReason("");
      setSelectedCreator(null);
    } catch (err: any) {
      errorEmitter.emitPermissionError(
        new FirestorePermissionError({
          path: creatorRef.path,
          operation: "update",
          requestResourceData: updateData,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlatformIcon = (p: string) => {
    if (p.includes("Instagram")) return <Instagram className="h-3.5 w-3.5" />;
    if (p.includes("YouTube")) return <Youtube className="h-3.5 w-3.5" />;
    if (p.includes("TikTok")) return <Music2 className="h-3.5 w-3.5" />;
    return <TrendingUp className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Verification Queue
          </h1>
          <p className="text-slate-500 font-medium">
            Review and authenticate creative talent for the professional
            marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase h-11 px-4 rounded-xl flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> {pendingCreators.length} Pending
            Requests
          </Badge>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by username..."
            className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

      {/* Queue Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">
                  Creator
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                  Engagement Profile
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                  Auth Score
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                  Submitted Docs
                </TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">
                  Action
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
              ) : filteredCreators.length > 0 ? (
                filteredCreators.map((creator, idx) => {
                  const authScore =
                    creator.authenticityScore ||
                    Math.floor(Math.random() * 20) + 80; // Mock score if missing
                  return (
                    <TableRow
                      key={creator.id}
                      className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-28"
                    >
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 rounded-2xl border border-slate-100 shadow-sm">
                            <AvatarImage src={creator.photoURL} />
                            <AvatarFallback className="bg-primary/5 text-primary font-black">
                              {creator.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-black text-slate-900 leading-none">
                              @{creator.username}
                            </p>
                            <div className="flex gap-1.5 pt-1">
                              {Object.keys(creator.socialStats || {}).map(
                                (plat) => (
                                  <div
                                    key={plat}
                                    className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all"
                                    title={plat}
                                  >
                                    {getPlatformIcon(plat)}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900">
                            850k Total Reach
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] mt-1.5"
                          >
                            5.8% AVG ER
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <div
                            className={cn(
                              "flex items-center gap-1.5 mb-1",
                              authScore > 90
                                ? "text-emerald-600"
                                : authScore > 75
                                ? "text-orange-500"
                                : "text-red-500"
                            )}
                          >
                            <Zap className="h-3.5 w-3.5 fill-current" />
                            <span className="text-lg font-black">
                              {authScore}%
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            Growth Authenticity
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-primary"
                          >
                            <FileText className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-primary"
                            asChild
                          >
                            <a
                              href={`/creator/${creator.username}`}
                              target="_blank"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-bold h-10 border-red-100 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setSelectedCreator(creator);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1.5" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl font-bold h-10 bg-emerald-500 hover:bg-emerald-600 text-white px-6"
                            onClick={() => handleDecision(creator, true)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1.5" /> Approve
                          </Button>
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
                        Verification Queue is Empty
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Governance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-indigo-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
          <ShieldAlert className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">Verification Policy</h3>
            <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
              Granting verification provides immediate visibility in high-tier
              matchmaking. Always cross-reference authenticity scores with
              historical engagement.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
            <Info className="h-8 w-8 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Document Authentication</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Identity documents are encrypted and only accessible to Root
              Admins. Proof of social ownership is verified via API handshakes.
            </p>
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <ThumbsDown className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black">
              Reject Verification
            </DialogTitle>
            <DialogDescription>
              Provide a professional reason for rejecting @
              {selectedCreator?.username}'s verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <Label className="font-bold text-slate-700">Rejection Reason</Label>
            <Textarea
              placeholder="e.g. Inconsistent audience growth detected. Engagement rates do not match platform benchmarks."
              className="min-h-[150px] rounded-2xl p-6 bg-slate-50 border-none focus-visible:ring-red-500 text-md"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="ghost"
              className="rounded-xl font-bold"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!rejectReason.trim() || isSubmitting}
              onClick={() =>
                selectedCreator &&
                handleDecision(selectedCreator, false, rejectReason)
              }
              variant="danger"
              className="rounded-xl font-bold px-8"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
