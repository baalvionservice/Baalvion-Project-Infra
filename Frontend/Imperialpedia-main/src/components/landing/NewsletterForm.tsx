"use client";

import React, { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/design-system/typography/text";
import { Loader2, CheckCircle2, AlertCircle, Send, User } from "lucide-react";
import { useToast } from "@/components/common/ToastManager";
import { cn } from "@/lib/utils";
import { trackEvent, logEvent } from "@/lib/utils/analytics";

/**
 * Institutional newsletter subscription form.
 * Handles state transitions for capturing interest in intelligence updates.
 * Optimized for accessibility and search engine visibility.
 */
export const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const { addToast } = useToast();

  const errorId = useId();
  const successId = useId();

  // TODO: AI-powered newsletter content recommendations based on traversal history
  // TODO: Personalized suggestions based on user research behavior

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
      setMessage("Invalid email node detected.");
      return;
    }

    setStatus("loading");

    // Broadcast engagement to analytics
    trackEvent({
      category: "Interaction",
      action: "Newsletter Signup Attempt",
      label: "Footer Form",
    });

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
        setName("");

        addToast({
          message:
            "Subscription Active: You are now synchronized with the wire.",
          type: "success",
        });

        // Log specific conversion event
        logEvent("Newsletter Signup", "Conversion", email);
      } else {
        throw new Error(data.message || "Verification failure");
      }
    } catch (err: any) {
      setStatus("error");
      const errorMsg = err.message || "Network handshake failed.";
      setMessage(errorMsg);

      addToast({
        message: "Handshake Failed: Unable to synchronize identity.",
        type: "error",
      });
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-3"
        noValidate
        aria-label="Newsletter subscription form"
      >
        <div className="space-y-2">
          <div className="relative group">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Analyst Name (optional)"
              aria-label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="h-11 pl-10 bg-background/50 border-white/10 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-sm"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Input
                type="email"
                placeholder="Email address..."
                aria-label="Institutional email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={status === "loading" || status === "success"}
                aria-required="true"
                aria-invalid={status === "error"}
                aria-describedby={
                  status === "error"
                    ? errorId
                    : status === "success"
                    ? successId
                    : undefined
                }
                className={cn(
                  "h-11 bg-background/50 border-white/10 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-sm",
                  status === "error" && "border-destructive/50"
                )}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={status === "loading" || status === "success"}
              aria-label={
                status === "loading"
                  ? "Processing subscription"
                  : "Subscribe to intelligence wire"
              }
              className={cn(
                "h-11 px-6 rounded-xl font-bold transition-all shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                status === "success"
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : "bg-primary hover:bg-primary/90 shadow-primary/20"
              )}
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : status === "success" ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </form>

      <div aria-live="polite">
        {status === "success" && (
          <Text
            variant="caption"
            id={successId}
            className="text-emerald-500 font-bold animate-in fade-in slide-in-from-top-1 px-1"
          >
            {message}
          </Text>
        )}

        {status === "error" && (
          <Text
            variant="caption"
            id={errorId}
            className="text-destructive font-bold animate-in fade-in slide-in-from-top-1 flex items-center gap-1 px-1"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" /> {message}
          </Text>
        )}
      </div>
    </div>
  );
};
