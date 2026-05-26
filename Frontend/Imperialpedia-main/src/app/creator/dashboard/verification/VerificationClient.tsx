"use client";

import React, { useState } from "react";
import { CreatorVerification } from "@/types";
import { Text } from "@/design-system/typography/text";
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
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Upload,
  FileText,
  ExternalLink,
  Shield,
  Search,
  Loader2,
  XCircle,
  HelpCircle,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VerificationClientProps {
  initialStatus: CreatorVerification;
}

/**
 * Expert Verification Client Hub.
 * Manages the multi-state verification lifecycle for creators.
 */
export function VerificationClient({ initialStatus }: VerificationClientProps) {
  const [status, setStatus] = useState<CreatorVerification>(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsSubmittingModalOpen] = useState(false);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API submission
    await new Promise((r) => setTimeout(r, 1500));

    setStatus({
      ...status,
      status: "pending",
      requestedAt: new Date().toISOString(),
      documentsProvided: ["Professional Portfolio", "Industry Certification"],
    });

    setIsSubmitting(false);
    setIsSubmittingModalOpen(false);

    toast({
      title: "Verification Requested",
      description:
        "Our Compliance Hub has received your credentials for review.",
    });
  };

  const getStatusVisuals = () => {
    switch (status.status) {
      case "verified":
        return {
          icon: <ShieldCheck className="h-16 w-16 text-secondary" />,
          title: "Verified Intelligence Expert",
          desc: "Your research nodes carry the highest level of platform authority.",
          badge: (
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 h-8 px-4 rounded-xl font-bold">
              VERIFIED
            </Badge>
          ),
          colorClass: "border-secondary/20 bg-secondary/5",
        };
      case "pending":
        return {
          icon: <Clock className="h-16 w-16 text-amber-500" />,
          title: "Credentials Under Review",
          desc: "Our platform leads are currently validating your expertise markers.",
          badge: (
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 h-8 px-4 rounded-xl font-bold">
              PENDING REVIEW
            </Badge>
          ),
          colorClass: "border-amber-500/20 bg-amber-500/5",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "Verification Declined",
          desc:
            status.rejectionReason ||
            "Credentials did not meet the primary source transparency standards.",
          badge: (
            <Badge
              variant="destructive"
              className="h-8 px-4 rounded-xl font-bold"
            >
              DECLINED
            </Badge>
          ),
          colorClass: "border-destructive/20 bg-destructive/5",
        };
      default:
        return {
          icon: <Shield className="h-16 w-16 text-primary" />,
          title: "Expert Authentication Required",
          desc: "Apply for verified status to increase reach and monetize your research.",
          badge: (
            <Badge variant="outline" className="h-8 px-4 rounded-xl font-bold">
              UNVERIFIED
            </Badge>
          ),
          colorClass: "border-primary/20 bg-primary/5",
        };
    }
  };

  const visuals = getStatusVisuals();

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Compliance Engine
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">
            Expert Authentication
          </Text>
        </div>
        {visuals.badge}
      </header>

      {/* Main Status Hero */}
      <Card
        className={`border-2 transition-all duration-500 overflow-hidden relative ${visuals.colorClass}`}
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Award className="h-64 w-64" />
        </div>
        <CardContent className="p-10 flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="p-6 rounded-[2.5rem] bg-background/50 border border-white/5 shadow-2xl">
            {visuals.icon}
          </div>
          <div className="space-y-2 max-w-xl">
            <Text variant="h2" className="text-2xl font-bold">
              {visuals.title}
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground leading-relaxed"
            >
              {visuals.desc}
            </Text>
          </div>

          {status.status === "unverified" && (
            <Dialog open={isModalOpen} onOpenChange={setIsSubmittingModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                >
                  Request Authentication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-white/10 p-0 overflow-hidden">
                <form onSubmit={handleSubmitRequest}>
                  <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                      <Award className="h-6 w-6 text-primary" /> Expert
                      Credentials
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                      Submit verifiable proof of your industry expertise or
                      academic research.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Proof of Authority
                        </Label>
                        <Input
                          placeholder="LinkedIn Profile URL"
                          className="bg-background/50 border-white/5 h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Expertise Hub
                        </Label>
                        <Input
                          placeholder="e.g. Fixed Income Analyst"
                          className="bg-background/50 border-white/5 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Document Repository (Identity Proof)
                      </Label>
                      <div className="border-2 border-dashed rounded-2xl p-8 text-center bg-background/30 hover:border-primary/40 transition-colors cursor-pointer group">
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                        <Text variant="bodySmall" weight="bold">
                          Upload Credentials
                        </Text>
                        <Text
                          variant="caption"
                          className="text-muted-foreground mt-1"
                        >
                          PDF, JPG (CFA, FINRA, PHD, or Portfolio)
                        </Text>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsSubmittingModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Verifying...
                        </>
                      ) : (
                        "Submit for Review"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {(status.status === "pending" || status.status === "verified") &&
            status.requestedAt && (
              <div className="flex items-center gap-6 pt-4">
                <div className="flex flex-col items-center">
                  <Text
                    variant="label"
                    className="text-[9px] text-muted-foreground mb-1"
                  >
                    Requested
                  </Text>
                  <Text variant="bodySmall" weight="bold">
                    {format(new Date(status.requestedAt), "MMM d, yyyy")}
                  </Text>
                </div>
                {status.approvedAt && (
                  <>
                    <div className="h-8 w-px bg-white/5" />
                    <div className="flex flex-col items-center">
                      <Text
                        variant="label"
                        className="text-[9px] text-muted-foreground mb-1"
                      >
                        Authenticated
                      </Text>
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        className="text-secondary"
                      >
                        {format(new Date(status.approvedAt), "MMM d, yyyy")}
                      </Text>
                    </div>
                  </>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Why Verify? */}
        <div className="md:col-span-2 space-y-8">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary" /> The Verification
                Advantage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    icon: <TrendingUp className="h-5 w-5" />,
                    title: "Intelligence Reach",
                    desc: "Verified insights receive 3.5x more visibility in the global discovery engine.",
                  },
                  {
                    icon: <DollarSign className="h-5 w-5" />,
                    title: "Enhanced Revenue",
                    desc: "Verified creators unlock higher ad-revenue premiums and exclusive grants.",
                  },
                  {
                    icon: <ShieldCheck className="h-5 w-5" />,
                    title: "Expert Authority",
                    desc: "Build immediate trust with institutional and private wealth readers.",
                  },
                  {
                    icon: <Search className="h-5 w-5" />,
                    title: "pSEO Priority",
                    desc: "Your research nodes are prioritized for high-intent search queries.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    <div>
                      <Text variant="bodySmall" weight="bold">
                        {item.title}
                      </Text>
                      <Text
                        variant="caption"
                        className="text-muted-foreground mt-1 leading-relaxed"
                      >
                        {item.desc}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Compliance Documents</CardTitle>
              <CardDescription>
                Archive of your submitted authentication markers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.documentsProvided.length > 0 ? (
                <div className="space-y-3">
                  {status.documentsProvided.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <Text variant="bodySmall" weight="medium">
                          {doc}
                        </Text>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 uppercase font-bold"
                      >
                        Received
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center opacity-50">
                  <Text variant="caption" className="italic">
                    No documents submitted yet.
                  </Text>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Requirements Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-sm font-bold tracking-widest uppercase text-primary">
                Verification Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <ul className="space-y-4">
                {[
                  "Active industry experience (5+ years)",
                  "Advanced academic degrees (Masters/PhD)",
                  "Significant public research record",
                  "Professional certifications (CFA, etc.)",
                  "Primary source transparency",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 w-4 h-4 rounded-full border-2 border-primary/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <Text variant="caption" className="text-muted-foreground">
                      {item}
                    </Text>
                  </li>
                ))}
              </ul>

              <div className="pt-6 border-t border-white/5">
                <Text
                  variant="caption"
                  className="italic text-muted-foreground leading-relaxed"
                >
                  "Authenticity is the bedrock of our index. Every expert node
                  is manually vetted by our platform leads."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <ShieldCheck className="h-4 w-4" /> Editorial SLA
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Standard review cycles are completed within **3-5 business days**.
              You will receive an activity feed alert upon status update.
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto text-secondary text-xs font-bold"
            >
              Review compliance policy{" "}
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { DollarSign } from "lucide-react";
