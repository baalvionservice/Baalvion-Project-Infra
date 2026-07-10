"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, email: string, message: string): FormErrors {
  const errors: FormErrors = {};
  if (name.trim().length < 2) errors.name = "Enter your full name.";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";
  if (message.trim().length < 10) errors.message = "Tell us a bit more (10+ characters).";
  return errors;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(name, email, message);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="glow-card rounded-xl p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground">Message received</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks, {name.split(" ")[0]} — our team will get back to you at {email} shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glow-card space-y-5 rounded-xl p-8" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="text-xs text-signal-negative">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="text-xs text-signal-negative">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">How can we help?</Label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          aria-invalid={Boolean(errors.message)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {errors.message && <p className="text-xs text-signal-negative">{errors.message}</p>}
      </div>
      <Button type="submit" className="w-full">
        Send message
      </Button>
    </form>
  );
}
