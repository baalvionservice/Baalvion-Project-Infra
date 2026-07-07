'use client';

import { useState } from 'react';

/**
 * Static placeholder — this app ships with no backend or form handler.
 * Wire `onSubmit` to a real endpoint (or a service like Formspree) before launch.
 */
export function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="glass-panel p-8 text-center">
        <p className="eyebrow justify-center text-center">Message received</p>
        <h3 className="mt-4 text-xl font-semibold text-foreground">Thanks for reaching out.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This form is a placeholder — no message was sent. Once connected to a live endpoint,
          our team will reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-5 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" type="text" autoComplete="name" required />
        <Field label="Work email" name="email" type="email" autoComplete="email" required />
      </div>
      <Field label="Company" name="company" type="text" autoComplete="organization" />
      <div>
        <label htmlFor="reason" className="mb-2 block text-sm font-medium text-foreground">
          What can we help with?
        </label>
        <select
          id="reason"
          name="reason"
          className="focus-ring w-full rounded-lg border border-line bg-surface-3 px-4 py-3 text-sm text-foreground"
          defaultValue="sales"
        >
          <option value="sales">Sales enquiry</option>
          <option value="support">Existing customer support</option>
          <option value="partnership">Partnership</option>
          <option value="other">Something else</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="focus-ring w-full rounded-lg border border-line bg-surface-3 px-4 py-3 text-sm text-foreground placeholder:text-muted-2"
          placeholder="Tell us a bit about your organization and what you're looking for."
        />
      </div>
      <button type="submit" className="btn-primary focus-ring w-full sm:w-auto">
        Send Message
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
};

function Field({ label, name, type, autoComplete, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="focus-ring w-full rounded-lg border border-line bg-surface-3 px-4 py-3 text-sm text-foreground placeholder:text-muted-2"
      />
    </div>
  );
}
