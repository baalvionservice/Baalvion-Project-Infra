"use client";

import SignupForm from "@/components/forms/SignupForm";
import { Navbar } from "@/components/navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Award } from "lucide-react";

/**
 * @fileOverview Professional Registration Page for the Law Elite Network.
 */

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
            
            <CardHeader className="text-center pb-8 pt-10">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-inner">
                  <Award className="w-6 h-6 text-accent" />
                </div>
              </div>
              <CardTitle className="font-headline text-3xl italic">Membership Application</CardTitle>
              <CardDescription className="text-muted-foreground mt-2 italic">Begin your journey into the world's elite legal ecosystem.</CardDescription>
            </CardHeader>
            
            <CardContent>
              <SignupForm />
            </CardContent>
            
            <CardFooter className="flex flex-col items-center gap-4 py-8 border-t border-white/5 bg-white/5">
              <p className="text-xs text-muted-foreground">
                Already a verified member?{" "}
                <Link href="/login" className="text-accent hover:underline font-bold uppercase tracking-widest text-[10px]">
                  Portal Access
                </Link>
              </p>
              <p className="text-[9px] text-muted-foreground/40 italic text-center max-w-[240px]">
                Applications are subject to rigorous verification of professional credentials.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
