
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Lock, 
  History, 
  Bell, 
  Smartphone,
  CheckCircle2,
  Save,
  LogOut,
  Fingerprint,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminProfilePage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Profile Updated",
        description: "Your administrative profile and security settings have been synchronized.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            Admin Profile
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your personal credentials and session security.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-white font-bold gap-2 px-8 h-12 shadow-lg">
          {isSaving ? <CheckCircle2 className="h-4 w-4 animate-bounce" /> : <Save className="h-4 w-4" />}
          Update Profile
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-32 bg-slate-900 relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center font-bold text-2xl text-primary">
                  AD
                </div>
              </div>
            </div>
            <CardContent className="pt-16 pb-8 text-center space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Admin_9921</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Super Administrator</p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold">ACTIVE SESSION</Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold">MFA SECURED</Badge>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Platform Access</span>
                  <span className="font-bold text-slate-900">Level 1 (Full)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Joined Platform</span>
                  <span className="font-bold text-slate-900">Jan 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white/10 rounded-lg border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Last Login</span>
                  <span className="font-bold">2h ago</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Login Location</span>
                  <span className="font-bold">Johannesburg, ZA</span>
                </div>
              </div>
              <Button variant="outline" className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold h-11 text-xs">
                Revoke All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="bg-slate-100 p-1 h-auto gap-1">
              <TabsTrigger value="account" className="px-8 py-2.5 font-bold">Account Info</TabsTrigger>
              <TabsTrigger value="security" className="px-8 py-2.5 font-bold">Security & Keys</TabsTrigger>
              <TabsTrigger value="activity" className="px-8 py-2.5 font-bold">My Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Personal Details</CardTitle>
                  <CardDescription>Primary administrative identity information.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Public Alias</Label>
                      <Input defaultValue="Admin_9921" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input className="pl-10" defaultValue="admin@baalvion.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Phone</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input className="pl-10" defaultValue="+27 11 000 0000" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input defaultValue="EMP-HQ-772" readOnly className="bg-slate-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Security Governance</CardTitle>
                  <CardDescription>Credential management and MFA configuration.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/5 rounded-lg text-primary">
                        <Fingerprint className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Multi-Factor Authentication</p>
                        <p className="text-xs text-slate-500">Secured via FIDO2 Hardware Key</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500">ENFORCED</Badge>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Password Management</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button variant="outline" className="font-bold border-slate-200">Request Password Reset</Button>
                      <Button variant="outline" className="font-bold border-slate-200">Rotate API Master Keys</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Personal Activity Log</CardTitle>
                  <CardDescription>A list of recent actions performed under this account.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {[
                      { action: "Updated Global Fee Matrix", time: "2h ago", icon: History },
                      { action: "Verified Company: Atlas Mining", time: "5h ago", icon: CheckCircle2 },
                      { action: "Logged in from HQ Node", time: "Yesterday", icon: Clock },
                      { action: "Rejected Trade Document DOC-1025", time: "2 days ago", icon: History },
                    ].map((log, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-100 rounded text-slate-400">
                            <log.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{log.action}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{log.time}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full text-xs font-bold text-primary py-4">View All Activity</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
