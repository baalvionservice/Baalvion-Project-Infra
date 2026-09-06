import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Mail, Phone, ShieldCheck } from "lucide-react";
import { founderPath, investorPath } from "@/lib/directory-url";

type Claim = {
  id: string;
  entity_type: "investor" | "company";
  entity_id: string;
  entity_name: string | null;
  claimant_name: string;
  claimant_email: string;
  claimant_role: string | null;
  claimant_phone: string | null;
  evidence_url: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const GATEWAY = "/auth-bff";
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

// Approving a claim hands a stranger control of a record about a real firm, so this screen shows
// everything the claimant said and the domain they used, and asks for a decision rather than
// offering a one-click accept.
export default function AdminClaims() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${GATEWAY}/api/insiders/v1/claims?status=${status}`, { credentials: "include" });
      const body = await r.json().catch(() => null);
      setClaims(body?.success ? body.data.claims : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isAdmin, status]);

  if (user && !isAdmin) return <Navigate to="/dashboard" replace />;

  const review = async (c: Claim, decision: "approved" | "rejected") => {
    setBusy(c.id);
    try {
      const csrf = document.cookie.split("; ").find((x) => x.startsWith("csrf_token="))?.split("=")[1] || "";
      const r = await fetch(`${GATEWAY}/api/insiders/v1/claims/${c.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ status: decision, review_note: notes[c.id] || undefined }),
      });
      const body = await r.json().catch(() => null);
      if (!r.ok || !body?.success) throw new Error(body?.message || "Could not save");
      toast.success(decision === "approved" ? `${c.entity_name} handed to ${c.claimant_email}` : "Claim rejected");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  const profileHref = (c: Claim) =>
    c.entity_type === "investor"
      ? investorPath({ id: c.entity_id, name: c.entity_name })
      : founderPath({ id: c.entity_id, company_name: c.entity_name });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-primary" />Profile claims</h1>
            <p className="text-muted-foreground mt-1">Firms asking to take over a record compiled from their filings.</p>
          </div>
          <div className="flex gap-1">
            {(["pending", "approved", "rejected", "all"] as const).map((s) => (
              <Button key={s} size="sm" variant={status === s ? "secondary" : "ghost"} onClick={() => setStatus(s)} className="capitalize">{s}</Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded" />)}</div>
        ) : claims.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center text-muted-foreground">
            No {status === "all" ? "" : status} claims.
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {claims.map((c) => (
              <Card key={c.id} className="border-border"><CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">
                      <Link to={profileHref(c)} className="text-primary hover:underline">{c.entity_name}</Link>
                      <Badge variant="secondary" className="ml-2 font-normal capitalize">{c.entity_type}</Badge>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Requested {fmt(c.created_at)}</p>
                  </div>
                  <Badge variant={c.status === "pending" ? "outline" : "secondary"} className="capitalize">{c.status}</Badge>
                </div>

                <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-5">
                  <div><dt className="label-eyebrow">Claimant</dt><dd className="text-sm font-medium mt-0.5">{c.claimant_name}{c.claimant_role ? ` · ${c.claimant_role}` : ""}</dd></div>
                  <div><dt className="label-eyebrow">Work email</dt>
                    <dd className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={`mailto:${c.claimant_email}`} className="text-primary hover:underline">{c.claimant_email}</a>
                      <span className="text-xs text-muted-foreground">@{c.claimant_email.split("@")[1]}</span>
                    </dd>
                  </div>
                  {c.claimant_phone && <div><dt className="label-eyebrow">Telephone</dt><dd className="text-sm font-medium mt-0.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{c.claimant_phone}</dd></div>}
                  {c.evidence_url && <div><dt className="label-eyebrow">Evidence</dt>
                    <dd className="text-sm mt-0.5"><a href={c.evidence_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 truncate">{c.evidence_url}<ExternalLink className="w-3 h-3 shrink-0" /></a></dd></div>}
                </dl>

                {c.message && <p className="text-sm mt-4 p-3 bg-secondary/60 rounded border border-border leading-relaxed">{c.message}</p>}

                {c.status === "pending" ? (
                  <div className="mt-5 space-y-3">
                    <Textarea rows={2} placeholder="Note for the record (optional)" value={notes[c.id] || ""}
                      onChange={(e) => setNotes((p) => ({ ...p, [c.id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button disabled={busy === c.id} onClick={() => review(c, "approved")}>
                        <BadgeCheck className="w-4 h-4 mr-2" />Approve — hand over the profile
                      </Button>
                      <Button variant="outline" disabled={busy === c.id} onClick={() => review(c, "rejected")}>Reject</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-4">
                    {c.status === "approved" ? "Approved" : "Rejected"} {fmt(c.reviewed_at)}{c.review_note ? ` — ${c.review_note}` : ""}
                  </p>
                )}
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
