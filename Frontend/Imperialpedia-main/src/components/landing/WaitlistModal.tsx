"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/design-system/typography/text";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  ShieldCheck,
  Info,
  User,
} from "lucide-react";
import { useToast } from "@/components/common/ToastManager";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/utils/analytics";

interface WaitlistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

/**
 * Waitlist & Early Access Modal Hub.
 * Features dual-input identity capture and institutional-grade validation.
 */
export const WaitlistModal = ({
  isOpen,
  onOpenChange,
  title = "Join the Imperialpedia Waitlist",
}: WaitlistModalProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const { addToast } = useToast();

  // TODO: AI-driven waitlist prioritization based on user profile or behavior
  // TODO: Dynamic success message personalization
  // TODO: Analytics tracking for submissions and conversions

  const validateEmail = (email: string) => {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus("error");
      setMessage("Intelligence node (email) is required.");
      return;
    }
    if (!validateEmail(email)) {
      setStatus("error");
      setMessage("Please enter a valid institutional email address.");
      return;
    }

    setStatus("loading");
    trackEvent({
      category: "Form",
      action: "Submit Start",
      label: "Waitlist Modal",
    });

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
        trackEvent({
          category: "Form",
          action: "Submit Success",
          label: "Waitlist Modal",
        });

        addToast({
          message:
            "Waitlist Success: Your node has been reserved in the index.",
          type: "success",
        });
      } else {
        throw new Error(data.message || "Audit Failure");
      }
    } catch (err: any) {
      setStatus("error");
      const errorMsg =
        err.message || "Network handshake failed. Try again shortly.";
      setMessage(errorMsg);
      trackEvent({
        category: "Form",
        action: "Connection Error",
        label: "Waitlist Modal",
      });

      addToast({
        message: "Sync Error: Handshake verification failed.",
        type: "error",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        setStatus("idle");
        setEmail("");
        setName("");
        setMessage("");
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-white/10 p-0 overflow-hidden shadow-3xl">
        {status === "success" ? (
          <div className="p-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <Text variant="h2" className="text-2xl font-bold">
                Access Secured
              </Text>
              <Text
                variant="bodySmall"
                className="text-muted-foreground leading-relaxed"
              >
                Your spot in the intelligence matrix has been reserved. You are
                now part of the 142,000+ analysts receiving high-fidelity
                updates.
              </Text>
            </div>
            <Button
              onClick={() => handleOpenChange(false)}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold h-12"
            >
              Return to Discovery
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <Text
                    variant="label"
                    className="text-[10px] font-bold uppercase tracking-widest"
                  >
                    Early Access
                  </Text>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase">
                    Identity Verified
                  </span>
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2">
                Secure your node in the world's most scalable financial
                intelligence engine.
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="modal-name"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Legal Persona (Optional)
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="modal-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background/50 border-white/5 h-14 pl-12 rounded-xl text-lg transition-all"
                      disabled={status === "loading"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="modal-email"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Institutional Email
                  </Label>
                  <Input
                    id="modal-email"
                    type="email"
                    placeholder="analyst@institution.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    className={cn(
                      "bg-background/50 border-white/5 h-14 rounded-xl text-lg transition-all",
                      status === "error" &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={status === "loading"}
                    required
                  />
                  {status === "error" && (
                    <div className="flex items-center gap-2 text-destructive text-[10px] font-bold uppercase tracking-tighter mt-1 px-1">
                      <AlertCircle className="h-3 w-3" /> {message}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-muted/20 border border-white/5">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed italic"
                >
                  "Your data traversal is cryptographically signed. We respect
                  institutional privacy by default. No data is shared with
                  third-party aggregators."
                </Text>
              </div>
            </div>

            <DialogFooter className="p-8 bg-muted/20 border-t border-white/5">
              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-14 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100 group/btn"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    Secure My Spot
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
