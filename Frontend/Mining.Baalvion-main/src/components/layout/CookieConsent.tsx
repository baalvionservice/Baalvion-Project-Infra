"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <Card className="p-6 border-primary/20 shadow-2xl bg-white/95 backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/5 rounded-lg text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Privacy & Data Transparency</h4>
              <button onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Baalvion Mining Inc. uses cookies to provide a secure industrial trading environment and to analyze platform traffic for optimization. By continuing, you agree to our <a href="/terms" className="text-primary font-bold hover:underline">Terms</a> and <a href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</a>.
            </p>
            <div className="flex gap-3 pt-2">
              <Button size="sm" onClick={handleAccept} className="bg-primary text-white font-bold px-6">
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsVisible(false)} className="text-xs font-bold border-slate-200">
                Preferences
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
