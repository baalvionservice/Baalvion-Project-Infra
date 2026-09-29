'use client';

import { useState } from 'react';
import { EXTERNAL } from '@/lib/site';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Account & login');
  const [message, setMessage] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const subject = `[${topic}] Support request from ${name || 'Baalvion user'}`;
    const body = `${message}\n\n—\nName: ${name}\nEmail: ${email}\nTopic: ${topic}`;
    window.location.href = `mailto:${EXTERNAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="focus-ring rounded-lg border border-line-strong bg-ground px-3 py-2 text-sm text-foreground"
            placeholder="Jane Doe"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring rounded-lg border border-line-strong bg-ground px-3 py-2 text-sm text-foreground"
            placeholder="you@company.com"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Topic</span>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="focus-ring rounded-lg border border-line-strong bg-ground px-3 py-2 text-sm text-foreground"
        >
          <option>Account & login</option>
          <option>Orders & trades</option>
          <option>API & webhooks</option>
          <option>Billing</option>
          <option>Enterprise support</option>
          <option>Other</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">How can we help?</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="focus-ring resize-none rounded-lg border border-line-strong bg-ground px-3 py-2 text-sm text-foreground"
          placeholder="Describe the issue, including your organization name and, if relevant, an order or trade ID."
        />
      </label>

      <button type="submit" className="btn-primary self-start">
        Send to Support
      </button>
      <p className="text-xs text-muted-2">
        Submitting opens your email client with a pre-filled message to {EXTERNAL.supportEmail}.
      </p>
    </form>
  );
}
