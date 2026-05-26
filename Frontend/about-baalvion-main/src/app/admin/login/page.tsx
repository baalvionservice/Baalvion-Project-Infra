"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Lock, AlertCircle } from "lucide-react";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(adminLogin, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md glass-card border-gray-100 shadow-xl bg-white">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="w-16 h-16 bg-[#FF9900] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#FF9900]/20">
            <Globe className="text-white w-8 h-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold text-gray-900 tracking-tight">
              Baalvion Operating System (BOS) Admin
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium uppercase tracking-widest text-[10px]">
              Strategic Control Terminal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-12 px-10">
          <form action={formAction} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Secure Authorization Key
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  className="flex h-14 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 pl-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900] transition-all text-gray-900"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {state?.error && (
              <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-14 btn-primary rounded-xl text-lg font-bold"
            >
              {isPending ? "Verifying…" : "Initiate Access"}
            </Button>
          </form>

          <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-10">
            Secured by Baalvion Imperial Governance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
