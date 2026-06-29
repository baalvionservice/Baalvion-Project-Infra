'use client';

import { useState } from 'react';
import { CONTACT } from '@/lib/content';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOPICS = [
  { label: 'Support', to: CONTACT.support },
  { label: 'Business / partnerships', to: CONTACT.business },
  { label: 'Privacy / data request', to: CONTACT.privacy },
  { label: 'Security report', to: CONTACT.security },
  { label: 'Legal', to: CONTACT.legal },
] as const;

/**
 * Accessible contact form. The static export has no server, so submission opens
 * the visitor's mail client pre-addressed to the right channel — honest and
 * functional without claiming a backend the page does not have.
 */
export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Please enter your name';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (message.trim().length < 10) next.message = 'Please add a little more detail';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const to = TOPICS[topic].to;
    const subject = encodeURIComponent(`[${TOPICS[topic].label}] Enquiry from ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()} (${email.trim()})`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" id="cf-name" error={errors.name}>
          <input
            id="cf-name"
            className={inputCls}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        </Field>
        <Field label="Your email" id="cf-email" error={errors.email}>
          <input
            id="cf-email"
            type="email"
            inputMode="email"
            className={inputCls}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@company.com"
          />
        </Field>
      </div>

      <Field label="Topic" id="cf-topic">
        <select
          id="cf-topic"
          className={inputCls}
          value={topic}
          onChange={(e) => setTopic(Number(e.target.value))}
        >
          {TOPICS.map((t, i) => (
            <option key={t.label} value={i}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Message" id="cf-message" error={errors.message}>
        <textarea
          id="cf-message"
          className={`${inputCls} h-36 resize-y py-3`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
        />
      </Field>

      <button type="submit" className="btn-primary w-full justify-center sm:w-auto">
        Send message
        <span aria-hidden="true">→</span>
      </button>

      <p className="mono-caption">
        This opens your email client, addressed to the right team. Prefer to write directly?
        Use the channels listed alongside.
      </p>
    </form>
  );
}

const inputCls =
  'w-full border hairline bg-ink-deep px-3 py-2.5 text-foreground placeholder:text-muted-2 transition-colors duration-200 focus:border-accent focus:outline-none';

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
      {error && <span className="mt-1 block text-[0.7rem] text-red-400">{error}</span>}
    </div>
  );
}
