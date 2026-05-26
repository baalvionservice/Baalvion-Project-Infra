"use client";

import React, { useState, useId } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/design-system/typography/text";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/common/ToastManager";
import { cn } from "@/lib/utils";
import { logEvent } from "@/lib/utils/analytics";

/**
 * Institutional Newsletter Subscription Node.
 * Optimized for accessibility and performance.
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const { addToast } = useToast();

  const inputId = useId();
  const errorId = useId();
  const successId = useId();

  const validateEmail = (email: string) => {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage("Email node is required.");
      return;
    }

    if (!validateEmail(email)) {
      setStatus("error");
      setMessage("Invalid email identity node detected.");
      return;
    }

    setStatus("loading");
    logEvent("Newsletter Signup Attempt", "Engagement", email);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage("Synchronization complete. You are now subscribed.");
        setEmail("");

        addToast({
          message: "Handshake Successful: Subscription active.",
          type: "success",
        });

        logEvent("Newsletter Signup", "Conversion", email);
      } else {
        throw new Error(data.message || "Verification failure");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Network handshake failed.");

      addToast({
        message: "Handshake Failed: Unable to synchronize newsletter node.",
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
        role="status"
        className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4"
      >
        <CheckCircle2
          className="h-8 w-8 text-emerald-500 mx-auto"
          aria-hidden="true"
        />
        <Text variant="h4" className="font-bold">
          Subscription Node Active
        </Text>
        <Text variant="bodySmall" className="text-muted-foreground">
          {message}
        </Text>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative flex-1 group">
          <Label htmlFor={inputId} className="sr-only">
            Institutional Email
          </Label>
          <Input
            id={inputId}
            type="email"
            placeholder="analyst@institution.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            disabled={status === "loading"}
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? errorId : undefined}
            className={cn(
              "h-14 bg-card/30 border-white/10 rounded-2xl text-lg pl-6",
              status === "error" && "border-destructive/50"
            )}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl"
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {status === "loading" ? "Processing..." : "Subscribe"}
        </Button>
      </form>

      {status === "error" && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-bold animate-in fade-in"
        >
          <AlertCircle className="h-3 w-3" /> {message}
        </div>
      )}

      <div className="flex items-center justify-center gap-6 pt-2 opacity-40">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
          <Sparkles className="h-3 w-3" /> Market Audits
        </div>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
          <Sparkles className="h-3 w-3" /> pSEO Alerts
        </div>
      </div>
    </div>
  );
}
