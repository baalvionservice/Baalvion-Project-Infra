"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Copy, 
  LogIn, 
  ShieldAlert, 
  DollarSign, 
  LifeBuoy, 
  Truck,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const roles = [
  {
    name: "Super Admin",
    key: "super_admin",
    email: "superadmin@baalvion.com",
    password: "Admin@Baalvion",
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/5"
  },
  {
    name: "Compliance Admin",
    key: "compliance",
    email: "compliance@baalvion.com",
    password: "Compliance@Baalvion",
    icon: ShieldAlert,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  {
    name: "Finance Admin",
    key: "finance",
    email: "finance@baalvion.com",
    password: "Finance@Baalvion",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  {
    name: "Support Admin",
    key: "support",
    email: "support@baalvion.com",
    password: "Support@Baalvion",
    icon: LifeBuoy,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    name: "Logistics Admin",
    key: "logistics",
    email: "logistics@baalvion.com",
    password: "Logistics@Baalvion",
    icon: Truck,
    color: "text-slate-600",
    bg: "bg-slate-100"
  }
];

export default function AdminDemoAccess() {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const handleLogin = (role: typeof roles[0]) => {
    setLoadingRole(role.key);
    localStorage.setItem("adminRole", role.key);
    localStorage.setItem("adminEmail", role.email);
    
    setTimeout(() => {
      toast({
        title: "Session Active",
        description: `Logged in as ${role.name}. Redirecting to Baalvion Command...`,
      });
      router.push("/admin");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-primary text-white shadow-xl">
            <Globe className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-bold text-slate-900 tracking-tight">Baalvion Admin Matrix</h1>
            <p className="text-slate-500 max-w-md mx-auto font-medium">
              Secure governance entry for Baalvion Mining Inc. administrative staff.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.key} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
              <CardHeader className="border-b bg-white/50 flex flex-row items-center gap-4">
                <div className={`p-3 rounded-xl ${role.bg} ${role.color}`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{role.name}</CardTitle>
                  <CardDescription className="text-[9px] font-black uppercase tracking-widest opacity-60">System Role</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border text-xs">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Email</p>
                      <p className="font-bold truncate text-slate-700">{role.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => copyToClipboard(role.email, "Email")}><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary font-bold h-11 gap-2 rounded-xl"
                  disabled={loadingRole !== null}
                  onClick={() => handleLogin(role)}
                >
                  {loadingRole === role.key ? (
                    <span className="animate-pulse">Initializing...</span>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" /> Enter Matrix
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] italic">
            Proprietary Governance System • Baalvion Industries Private Limited
          </p>
        </div>
      </div>
    </div>
  );
}
