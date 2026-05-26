"use client";

import React, { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/design-system/typography/text";
import { useToast } from "@/components/common/ToastManager";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactFormProps = {
  className?: string;
};

export default function ContactForm({ className }: ContactFormProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const subjectId = `${baseId}-subject`;
  const messageId = `${baseId}-message`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      subject: String(fd.get("subject") || ""),
      message: String(fd.get("message") || ""),
      website: String(fd.get("website") || ""),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        addToast({ message: data.message, type: "success" });
        form.reset();
      } else {
        addToast({
          message: data.message || "Could not send your message.",
          type: "error",
        });
      }
    } catch {
      addToast({
        message: "Network error. Please try again or use the email address below.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative space-y-6", className)}
      noValidate
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={nameId}>Name</Label>
          <Input id={nameId} name="name" required autoComplete="name" maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={subjectId}>Subject</Label>
        <Input id={subjectId} name="subject" required maxLength={200} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={messageId}>Message</Label>
        <Textarea
          id={messageId}
          name="message"
          required
          rows={6}
          maxLength={5000}
          className="min-h-[160px] resize-y"
        />
      </div>
      {/* Honeypot — leave hidden */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={`${baseId}-website`}>Website</label>
        <input
          id={`${baseId}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto h-12 px-8 rounded-2xl font-bold"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
        ) : (
          <Send className="h-4 w-4 mr-2" aria-hidden />
        )}
        {loading ? "Sending…" : "Send message"}
      </Button>
      <Text variant="caption" className="text-muted-foreground block">
        By sending this form, you agree we may use your email to respond to your inquiry.
        See our{" "}
        <a href="/privacy-policy" className="text-primary hover:underline font-medium">
          Privacy Policy
        </a>
        .
      </Text>
    </form>
  );
}
