import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShieldCheck, Download, Trash2, BadgeCheck, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useTrustStatus, useRecordConsent, useStartKyc, useRequestDataExport, useRequestDeletion } from "@/hooks/usePlatform";

const kycVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  approved: "success", pending: "warning", review: "warning", rejected: "destructive", unverified: "secondary",
};
const riskVariant: Record<string, "success" | "warning" | "destructive"> = {
  low: "success", medium: "warning", high: "destructive", critical: "destructive",
};

export default function PrivacyCenter() {
  const { data: status, isLoading } = useTrustStatus();
  const consent = useRecordConsent();
  const startKyc = useStartKyc();
  const exportData = useRequestDataExport();
  const deletion = useRequestDeletion();
  const [subjectType, setSubjectType] = useState<"individual" | "business">("individual");
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="space-y-6">
      <SEOHead title="Privacy & Trust" description="Verification status, data rights and consent." />
      <div>
        <h1 className="text-2xl font-bold">Privacy &amp; Trust Center</h1>
        <p className="text-muted-foreground">Your verification status, data rights (GDPR) and consent preferences.</p>
      </div>

      {/* Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><BadgeCheck className="w-4 h-4" /> Verification</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
              <Badge variant={kycVariant[status?.kycStatus || "unverified"]}>{status?.kycStatus || "unverified"}</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Risk level</CardTitle></CardHeader>
          <CardContent><Badge variant={riskVariant[status?.riskLevel || "low"]}>{status?.riskLevel || "low"}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Account</CardTitle></CardHeader>
          <CardContent><Badge variant={status?.accountStatus === "active" ? "success" : "destructive"}>{status?.accountStatus || "—"}</Badge></CardContent>
        </Card>
      </div>

      {/* KYC */}
      {status?.kycStatus !== "approved" && (
        <Card>
          <CardHeader><CardTitle>Identity verification (KYC / KYB)</CardTitle>
            <CardDescription>Required for full access. Complete verification to lift limits and enable live proxy traffic.</CardDescription></CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Type</span>
              <Select value={subjectType} onValueChange={(v) => setSubjectType(v as "individual" | "business")}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual (KYC)</SelectItem>
                  <SelectItem value="business">Business (KYB)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => startKyc.mutate({ subjectType })} disabled={startKyc.isPending}>
              {startKyc.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Start verification
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data rights */}
      <Card>
        <CardHeader><CardTitle>Your data rights (GDPR)</CardTitle><CardDescription>Export or erase your data. Financial records are retained per law.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">Export my data</p>
              <p className="text-sm text-muted-foreground">Download a signed JSON copy of your organization data.</p>
            </div>
            <Button variant="outline" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
              {exportData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div>
              <p className="font-medium text-destructive">Right to be forgotten</p>
              <p className="text-sm text-muted-foreground">Anonymize personal data and revoke credentials. Irreversible.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" /> Erase my data</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Erase your personal data?</AlertDialogTitle>
                  <AlertDialogDescription>Your email/name will be anonymized and sessions/keys revoked. Billing records are retained for legal compliance. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deletion.mutate("me")}>Erase</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Consent */}
      <Card>
        <CardHeader><CardTitle>Consent preferences</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">Marketing communications</p>
              <p className="text-sm text-muted-foreground">Product news and offers.</p>
            </div>
            <Switch checked={marketing} onCheckedChange={(v) => { setMarketing(v); consent.mutate({ purpose: "marketing", granted: v }); }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
