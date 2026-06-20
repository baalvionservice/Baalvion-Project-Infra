
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Settings2, 
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Edit,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Super Admin Governance (Prompt 8 & 9)
export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Master Config Saved",
        description: "Global platform safety rules and system blueprints have been updated.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            Global Architecture
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Govern marketplace thresholds, industrial fees, and automated communication blueprints.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-white font-bold gap-2 px-8 h-12 shadow-lg">
          {isSaving ? <CheckCircle2 className="h-4 w-4 animate-bounce" /> : <Save className="h-4 w-4" />}
          Apply Master Sync
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 h-auto gap-1">
          <TabsTrigger value="templates" className="px-8 py-2.5 font-bold">Industrial Templates</TabsTrigger>
          <TabsTrigger value="safety" className="px-8 py-2.5 font-bold">Marketplace Safety</TabsTrigger>
          <TabsTrigger value="financial" className="px-8 py-2.5 font-bold">Platform Yield</TabsTrigger>
          <TabsTrigger value="security" className="px-8 py-2.5 font-bold">Access Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Partnership Blueprint PDF (v4.2)
                </CardTitle>
                <CardDescription>Govern dynamic mapping for the 6-section industrial strategy.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "Phase 1: Current Stage Analysis", status: "Active" },
                    { label: "Phase 2: Grade Matching Logic", status: "Active" },
                    { label: "Phase 3: Supply Chain Corridors", status: "Active" },
                    { label: "Phase 4: Cost & ROI Synthesis", status: "Active" },
                    { label: "Phase 5: 30-Day Action Roadmap", status: "Active" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border group hover:border-primary/20 transition-all">
                      <span className="text-sm font-bold text-slate-700">{t.label}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"><Eye className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full font-bold border-slate-200">
                  Manage Strategy Logic Placeholders
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-secondary" />
                  Transactional Email Blueprints
                </CardTitle>
                <CardDescription>Draft system-automated dispatches for the lead lifecycle.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "Industrial Blueprint Delivery", id: "EML-BP-01", v: "v2.1" },
                    { label: "Tier 3 Vetting Confirmation", id: "EML-VT-02", v: "v1.8" },
                    { label: "Escrow Status Lockdown", id: "EML-ES-04", v: "v2.4" },
                    { label: "High-Priority Price Alert", id: "EML-AL-05", v: "v1.2" },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border group hover:border-primary/20 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{e.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{e.id}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold bg-white">{e.v}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full font-bold border-slate-200">
                  Configure Dispatch Service Relay
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-rose-600" />
                  Marketplace Sentinel
                </CardTitle>
                <CardDescription>Proactive rules for unverified or suspicious entities.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Max Daily RFQs (Unverified)</Label>
                      <p className="text-xs text-slate-500">Limits Tier 1 account creation per 24h cycle.</p>
                    </div>
                    <Input type="number" defaultValue="2" className="w-20 font-bold text-center" />
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Auto-Flag Price Surge</Label>
                      <p className="text-xs text-slate-500">Threshold % deviation from global index.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="40" className="w-20 font-bold text-center" />
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Automated Account Freeze</Label>
                      <p className="text-xs text-slate-500">Enable AI-driven suspension for high-risk flags.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  KYC Industrial Protocols
                </CardTitle>
                <CardDescription>Global onboarding and license verification standards.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Regional Sanctions Sync</Label>
                      <p className="text-xs text-slate-500">Automated ID cross-check against global trade blacklists.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Director ID Mandate</Label>
                      <p className="text-xs text-slate-500">Require individual verification for Tier 3 miners.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed font-medium">
          <strong>Security Note:</strong> Modifying global safety thresholds or access governance may impact automated fraud detection performance. Significant changes are logged and flagged for Super Admin secondary approval.
        </p>
      </div>
    </div>
  );
}
