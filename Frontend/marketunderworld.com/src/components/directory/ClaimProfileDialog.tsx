import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BadgeCheck, CheckCircle2 } from "lucide-react";
import { submitClaim } from "@/lib/publicApi";

// Nobody on a compiled profile chose to be listed. Claiming is how the firm itself takes the
// record over — so the form asks who they are and how they are connected, and says plainly that a
// person reads it. No account is required: requiring one first is the wall that made the whole
// directory read-only.
export default function ClaimProfileDialog({ entityType, entityId, entityName }: {
  entityType: "investor" | "company";
  entityId: string;
  entityName: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ claimant_name: "", claimant_email: "", claimant_role: "", claimant_phone: "", evidence_url: "", message: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await submitClaim({ entity_type: entityType, entity_id: entityId, ...f });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the claim");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSent(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><BadgeCheck className="w-4 h-4 mr-2" />Is this your {entityType === "investor" ? "firm" : "company"}?</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {sent ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
            <h2 className="text-lg font-semibold">Claim received</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We review each claim by hand and will email you at <strong className="text-foreground">{f.claimant_email}</strong>.
              Nothing on the profile changes until it is approved.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Claim {entityName}</DialogTitle>
              <DialogDescription>
                This record was compiled from public filings. Claiming it lets you correct the details and
                decide what appears. A person reviews every claim.
              </DialogDescription>
            </DialogHeader>

            <div className="grid sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="claimant_name">Your name *</Label>
                <Input id="claimant_name" required value={f.claimant_name} onChange={(e) => set("claimant_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claimant_role">Your role</Label>
                <Input id="claimant_role" placeholder="Partner, Founder, IR" value={f.claimant_role} onChange={(e) => set("claimant_role", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="claimant_email">Work email *</Label>
                <Input id="claimant_email" type="email" required placeholder="you@yourfirm.com" value={f.claimant_email} onChange={(e) => set("claimant_email", e.target.value)} />
                <p className="text-xs text-muted-foreground">Must be your firm's domain — a free webmail address cannot show you are connected to it.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claimant_phone">Telephone</Label>
                <Input id="claimant_phone" value={f.claimant_phone} onChange={(e) => set("claimant_phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="evidence_url">Page that shows your role</Label>
                <Input id="evidence_url" placeholder="https://…/team" value={f.evidence_url} onChange={(e) => set("evidence_url", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="message">Anything we should know</Label>
                <Textarea id="message" rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send claim"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
