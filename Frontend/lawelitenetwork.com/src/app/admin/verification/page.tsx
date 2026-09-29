"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/admin/console/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ExternalLink, Check, X } from "lucide-react";
import {
  getVerificationQueue,
  getVerificationDocumentDownloadUrl,
  reviewVerificationDocument,
  type VerificationDocument,
} from "@/services/verification/verificationService";

type QueueItem = VerificationDocument & {
  lawyer: { id: number; name: string; email: string; country?: string; city?: string };
};

const DOC_LABELS: Record<string, string> = {
  bar_council_certificate: "Bar Council Certificate",
  government_id: "Government ID",
  professional_certificate: "Professional Certificate",
  selfie: "Selfie",
};

export default function AdminVerificationQueuePage() {
  const { toast } = useToast();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await getVerificationQueue(status);
      setItems((res.items as QueueItem[]) || []);
    } catch (e: any) {
      toast({ title: "Failed to load queue", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleDownload = async (id: number) => {
    try {
      const url = await getVerificationDocumentDownloadUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({ title: "Could not open document", description: e?.message, variant: "destructive" });
    }
  };

  const handleReview = async (id: number, next: "verified" | "rejected") => {
    setBusyId(id);
    try {
      await reviewVerificationDocument(id, next, notes[id]);
      toast({ title: next === "verified" ? "Document verified" : "Document rejected" });
      await load();
    } catch (e: any) {
      toast({ title: "Review failed", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell title="Lawyer Verification Queue">
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="w-5 h-5" />
            <p className="text-sm">Review uploaded credentials before a lawyer's profile goes public.</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">No documents in this queue.</Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.lawyer?.name} <span className="text-muted-foreground font-normal">— {item.lawyer?.email}</span></p>
                    <p className="text-sm text-muted-foreground">
                      {DOC_LABELS[item.doc_type] || item.doc_type} · {item.lawyer?.city ? `${item.lawyer.city}, ` : ""}{item.lawyer?.country}
                    </p>
                    <button
                      onClick={() => handleDownload(item.id)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-blue-600 hover:underline"
                    >
                      View document <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  {item.status === "pending" ? (
                    <div className="flex flex-col gap-2 w-full sm:w-72">
                      <Textarea
                        placeholder="Review notes (optional)"
                        rows={2}
                        value={notes[item.id] || ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === item.id}
                          onClick={() => handleReview(item.id, "rejected")}
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyId === item.id}
                          onClick={() => handleReview(item.id, "verified")}
                        >
                          {busyId === item.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                          Verify
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${item.status === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
