'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContactAuthorModalProps {
  authorSlug: string;
  authorName: string;
}

type Status = 'idle' | 'submitting' | 'sent' | 'error';

export function ContactAuthorModal({ authorSlug, authorName }: ContactAuthorModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/authors/${encodeURIComponent(authorSlug)}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, name, email, message }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(body?.message || 'Could not send your message. Please try again.');
        return;
      }
      setStatus('sent');
    } catch {
      setStatus('error');
      setErrorMessage('Could not send your message. Please try again.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          // Reset for the next time it's opened, but not mid-close animation.
          setTimeout(() => {
            setStatus('idle');
            setName('');
            setEmail('');
            setMessage('');
            setErrorMessage('');
          }, 200);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white text-black hover:bg-[#c8102e] hover:text-white border-2 border-black"
          title={`Contact ${authorName}`}
        >
          <Mail className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="uppercase font-black italic">Contact the Author</DialogTitle>
        </DialogHeader>

        {status === 'sent' ? (
          <p className="text-sm text-slate-700 dark:text-slate-300 py-4">
            Thanks — your message for {authorName} has been sent to Imperialpedia&apos;s editorial team.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-author-name">
                Name <span className="text-[#c8102e]">(required)</span>
              </Label>
              <Input
                id="contact-author-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === 'submitting'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-author-email">
                Email <span className="text-[#c8102e]">(required)</span>
              </Label>
              <Input
                id="contact-author-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-author-message">
                Comment <span className="text-[#c8102e]">(required)</span>
              </Label>
              <Textarea
                id="contact-author-message"
                required
                minLength={10}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={status === 'submitting'}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-[#c8102e] font-semibold">{errorMessage}</p>
            )}

            <Button type="submit" disabled={status === 'submitting'} className="w-full">
              {status === 'submitting' ? 'Sending…' : 'Submit'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
