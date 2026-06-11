"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, X, SlidersHorizontal } from "lucide-react";

const CONSENT_KEY = "cookie-consent";

type ConsentCategories = {
  necessary: true; // always on — cannot be disabled
  functional: boolean;
  analytics: boolean;
};

type StoredConsent = ConsentCategories & { timestamp: string };

const FULL_CONSENT: ConsentCategories = { necessary: true, functional: true, analytics: true };
const MINIMAL_CONSENT: ConsentCategories = { necessary: true, functional: false, analytics: false };

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<ConsentCategories>(FULL_CONSENT);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) setIsVisible(true);
    } catch {
      // localStorage unavailable (private mode / SSR mismatch) — show the banner.
      setIsVisible(true);
    }
  }, []);

  const persist = (categories: ConsentCategories) => {
    const record: StoredConsent = { ...categories, timestamp: new Date().toISOString() };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    } catch {
      // Best-effort: if storage fails we simply dismiss for this session.
    }
    setIsVisible(false);
  };

  const handleAcceptAll = () => persist(FULL_CONSENT);
  const handleRejectAll = () => persist(MINIMAL_CONSENT);
  const handleSavePreferences = () => persist(prefs);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-6 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-[100] animate-in slide-in-from-bottom-10 duration-500"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <Card className="p-6 border-primary/20 shadow-2xl bg-white/95 backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/5 rounded-lg text-primary shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h4 id="cookie-consent-title" className="font-bold text-slate-900">Privacy &amp; Cookie Preferences</h4>
              <button
                onClick={handleRejectAll}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Reject non-essential cookies and close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Baalvion Mining Inc. uses cookies to run a secure trading environment and, with your consent,
              to analyze platform performance. You can accept all, reject non-essential cookies, or manage your
              choices. See our{" "}
              <a href="/cookies" className="text-primary font-bold hover:underline">Cookie Policy</a> and{" "}
              <a href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</a>.
            </p>

            {showPreferences && (
              <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <PreferenceRow
                  label="Strictly Necessary"
                  desc="Required for security, sign-in and core functionality. Always on."
                  checked
                  disabled
                />
                <PreferenceRow
                  label="Functional"
                  desc="Remembers your preferences (e.g. language)."
                  checked={prefs.functional}
                  onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
                />
                <PreferenceRow
                  label="Analytics"
                  desc="Helps us understand usage to improve the platform."
                  checked={prefs.analytics}
                  onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={handleAcceptAll} className="bg-primary text-white font-bold px-5">
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectAll} className="text-xs font-bold border-slate-200">
                Reject All
              </Button>
              {showPreferences ? (
                <Button size="sm" variant="outline" onClick={handleSavePreferences} className="text-xs font-bold border-primary text-primary">
                  Save Preferences
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPreferences(true)}
                  className="text-xs font-bold text-slate-600 gap-1.5"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Manage Preferences
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PreferenceRow({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      <span className="space-y-0.5">
        <span className="block text-xs font-bold text-slate-800">{label}</span>
        <span className="block text-[11px] text-slate-500 leading-snug">{desc}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-primary disabled:opacity-60"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-label={label}
      />
    </label>
  );
}
