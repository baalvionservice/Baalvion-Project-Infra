"use client";

import React, { useState, useId } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/design-system/typography/text";
import { Loader2, CheckCircle2, AlertCircle, Send, User } from "lucide-react";
import { useToast } from "@/components/common/ToastManager";
import { cn } from "@/lib/utils";
import { logEvent } from "@/lib/utils/analytics";
import { useTranslation } from "react-i18next";

export const WaitlistForm = () => {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const { addToast } = useToast();

  const nameId = useId();
  const emailId = useId();
  const errorId = useId();
  const successId = useId();

  const validateEmail = (email: string) => {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage(t("waitlist.error_required") || "Email node is required.");
      return;
    }
    if (!validateEmail(email)) {
      setStatus("error");
      setMessage(t("waitlist.error_invalid") || "Invalid email node detected.");
      return;
    }

    setStatus("loading");
    logEvent("Waitlist Submission Attempt", "Engagement", "Landing Page Form");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);

        addToast({
          message: "Identity Secured: You have been indexed for early access.",
          type: "success",
        });

        logEvent("Waitlist Submission", "Conversion", email);
      } else {
        throw new Error(data.message || "Verification failure");
      }
    } catch (err: any) {
      setStatus("error");
      const errorMsg =
        err.message || "Network handshake failed. Try again shortly.";
      setMessage(errorMsg);

      addToast({
        message: "Handshake Alert: Connectivity interruption detected.",
        type: "error",
      });
    }
  };

  if (status === "success") {
    return (
      <motion.div
        id={successId}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        role="alert"
        className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4 shadow-xl"
      >
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
          <CheckCircle2
            className="h-8 w-8 text-emerald-500"
            aria-hidden="true"
          />
        </div>
        <Text variant="h4" className="font-bold text-foreground">
          Handshake Complete
        </Text>
        <Text variant="bodySmall" className="text-muted-foreground">
          {message}
        </Text>
      </motion.div>
    );
  }

  return (
    <div id="waitlist-inline" className="w-full max-w-2xl mx-auto scroll-mt-32">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
        aria-label="Waitlist registration form"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label
              htmlFor={nameId}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
            >
              Legal Persona (Optional)
            </Label>
            <div className="relative group">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors"
                aria-hidden="true"
              />
              <Input
                id={nameId}
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "loading"}
                className="h-12 pl-10 bg-card/30 border-white/10 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <Label
              htmlFor={emailId}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
            >
              Intelligence Node (Email)
            </Label>
            <div className="relative group">
              <Input
                id={emailId}
                type="email"
                placeholder={t("waitlist.input_placeholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={status === "loading"}
                aria-required="true"
                aria-invalid={status === "error"}
                className={cn(
                  "h-12 bg-card/30 border-white/10 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all text-sm",
                  status === "error" && "border-destructive/50"
                )}
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={status === "loading"}
          aria-label={t("waitlist.submit_button")}
          className="w-full h-14 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-100 active:scale-[0.98] group/btn"
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
          ) : (
            <Send
              className="h-4 w-4 mr-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
              aria-hidden="true"
            />
          )}
          {status === "loading"
            ? "Transmitting..."
            : t("waitlist.submit_button")}
        </Button>

        <div aria-live="polite">
          {status === "error" && (
            <div
              id={errorId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in fade-in slide-in-from-top-1"
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" /> {message}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Text
            variant="caption"
            className="text-muted-foreground text-center block px-4 leading-relaxed text-[10px]"
          >
            {t("waitlist.caption")}
          </Text>
        </div>
      </form>
    </div>
  );
};
