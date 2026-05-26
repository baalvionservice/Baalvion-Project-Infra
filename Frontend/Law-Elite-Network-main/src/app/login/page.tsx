"use client";

import LoginForm from "@/components/forms/LoginForm";
import { Navbar } from "@/components/navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ShieldCheck, User, Gavel, Shield } from "lucide-react";

/**
 * @fileOverview Professional Login Page for the Law Elite Network.
 * Enhanced with testing credentials for administrative auditing.
 */

export default function LoginPage() {
  const testUsers = [
    { role: 'Premier Client', email: 'client@test.com', pass: 'password123', icon: <User className="w-3.5 h-3.5" /> },
    { role: 'Legal Practitioner', email: 'lawyer@test.com', pass: 'password123', icon: <Gavel className="w-3.5 h-3.5" /> },
    { role: 'System Authority', email: 'admin@test.com', pass: 'password123', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12 gap-8">
        
        {/* Main Login Card */}
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
            
            <CardHeader className="text-center pb-8 pt-10">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                </div>
              </div>
              <CardTitle className="font-headline text-3xl italic">Portal Access</CardTitle>
              <CardDescription className="text-muted-foreground mt-2 italic">Secure entry for authorized elite network members.</CardDescription>
            </CardHeader>
            
            <CardContent>
              <LoginForm />
            </CardContent>
            
            <CardFooter className="flex flex-col items-center gap-4 py-8 border-t border-white/5 bg-white/5">
              <p className="text-xs text-muted-foreground">
                Not a verified member yet?{" "}
                <Link href="/register" className="text-accent hover:underline font-bold uppercase tracking-widest text-[10px]">
                  Apply for Membership
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Testing Credentials Helper */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="glass-panel p-6 rounded-2xl border-white/5 bg-accent/5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Authorized Testing Credentials</h3>
            </div>
            
            <div className="space-y-3">
              {testUsers.map((u) => (
                <div key={u.email} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      {u.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-accent uppercase tracking-tighter">{u.role}</p>
                      <p className="text-xs text-white font-medium">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Password</p>
                    <p className="text-[10px] text-white/60 font-mono">{u.pass}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-[8px] text-muted-foreground/40 italic text-center mt-4 uppercase tracking-tighter">
              Mock environment active. Authentication is simulated via secure local storage.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
