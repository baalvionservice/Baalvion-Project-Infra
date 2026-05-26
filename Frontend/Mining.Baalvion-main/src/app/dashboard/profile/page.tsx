"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Globe,
  Pickaxe,
  ShieldCheck,
  Award,
  Mail,
  Phone,
  Camera,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function CompanyProfilePage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Identity Synchronized",
        description:
          "Your company profile and public credentials have been updated.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">
            Trade Identity
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your public presence and verified industrial credentials.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-secondary text-secondary-foreground font-bold gap-2 px-8 h-11 shadow-sm"
        >
          {isSaving ? (
            <CheckCircle2 className="h-4 w-4 animate-bounce" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Profile
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Public Sidebar Preview */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-32 bg-primary relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="h-24 w-24 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden relative group">
                  <Building2 className="h-12 w-12 text-primary opacity-20" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="pt-16 pb-8 text-center space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Global Mining Inc.
                </h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">
                  Tier 3 Verified Supplier
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold"
                >
                  MINER
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold"
                >
                  EXPORTER
                </Badge>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-medium">
                <MapPin className="h-4 w-4" /> Johannesburg, ZA
              </div>
              <div className="pt-4 border-t grid grid-cols-3 gap-2">
                <div>
                  <p className="text-lg font-bold text-primary">94%</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400">
                    Trust
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">42</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400">
                    Trades
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">15y</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400">
                    Exp
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="h-48 w-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">KYC Status</span>
                  <span className="font-bold text-emerald-400">
                    Level 3 Complete
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Audit Cycle</span>
                  <span className="font-bold">Next: Oct 2024</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-11 text-xs"
              >
                Download Audit Evidence
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 h-auto gap-1">
              <TabsTrigger value="general" className="px-8 py-2.5">
                General Info
              </TabsTrigger>
              <TabsTrigger value="credentials" className="px-8 py-2.5">
                Credentials
              </TabsTrigger>
              <TabsTrigger value="team" className="px-8 py-2.5">
                Authorized Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Company Details</CardTitle>
                  <CardDescription>
                    Primary trade profile information used across the
                    marketplace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Registered Legal Name</Label>
                      <Input defaultValue="Global Mining Infrastructure Ltd" />
                    </div>
                    <div className="space-y-2">
                      <Label>Trade Display Name</Label>
                      <Input defaultValue="Global Mining Inc." />
                    </div>
                    <div className="space-y-2">
                      <Label>Industrial Sector</Label>
                      <Input defaultValue="Metallic Minerals" />
                    </div>
                    <div className="space-y-2">
                      <Label>Headquarters Country</Label>
                      <Input defaultValue="South Africa" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Company Bio & Values</Label>
                    <textarea
                      className="w-full h-32 p-3 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      defaultValue="A premier extractor and distributor of high-purity industrial minerals based in the Southern Africa trade region. Committed to sustainable extraction and transparent logistics."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Trade Support Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          className="pl-10"
                          defaultValue="support@globalmining.co.za"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hotline Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          className="pl-10"
                          defaultValue="+27 (0) 11 442 8892"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Verified Licenses</CardTitle>
                    <CardDescription>
                      Industry-specific certifications and export permits.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-bold border-slate-200"
                  >
                    <Plus className="h-4 w-4" /> Add Credential
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {[
                      {
                        name: "Bulk Export Permit #ZA-7721",
                        status: "VERIFIED",
                        expiry: "Dec 2026",
                        icon: Award,
                      },
                      {
                        name: "SGS Purity Auditor Badge",
                        status: "VERIFIED",
                        expiry: "Annual",
                        icon: ShieldCheck,
                      },
                      {
                        name: "IRMA Sustainability Cert",
                        status: "PENDING",
                        expiry: "Reviewing",
                        icon: Globe,
                      },
                    ].map((cred, i) => (
                      <div
                        key={i}
                        className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                            <cred.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {cred.name}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                              Valid until: {cred.expiry}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold uppercase",
                              cred.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            )}
                          >
                            {cred.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
