'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface CreateField {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'url';
  placeholder?: string;
  help?: string;
  required?: boolean;
  maxLength?: number;
  /** Return an error message to block submit, or null when the value is fine. */
  validate?: (value: string) => string | null;
}

interface Props {
  trigger: ReactNode;
  triggerProps?: Omit<ComponentProps<typeof Button>, 'onClick' | 'children'>;
  title: string;
  description?: string;
  fields: CreateField[];
  submitLabel?: string;
  successMessage: string;
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
}

const messageOf = (e: unknown) =>
  (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
  ?? (e as { message?: string })?.message ?? 'Something went wrong';

/** One small form in a dialog — the shared shape behind every "New / Add / Create" button. */
export default function CreateDialog({ trigger, triggerProps, title, description, fields, submitLabel = 'Create', successMessage, onSubmit }: Props) {
  const empty = () => Object.fromEntries(fields.map((f) => [f.name, '']));
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(empty);
  const [busy, setBusy] = useState(false);

  const errors = fields.map((f) => {
    const v = (values[f.name] ?? '').trim();
    if (f.required && !v) return null; // blocks submit but is not worth shouting about while typing
    return v && f.validate ? f.validate(v) : null;
  });
  const missing = fields.some((f) => f.required && !(values[f.name] ?? '').trim());
  const invalid = errors.some(Boolean);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
      toast.success(successMessage);
      setOpen(false);
      setValues(empty());
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setValues(empty()); }}>
      <DialogTrigger asChild><Button {...triggerProps}>{trigger}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!missing && !invalid && !busy) void submit(); }}>
          {fields.map((f, i) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={`cd-${f.name}`}>{f.label}{f.required && ' *'}</Label>
              {f.type === 'textarea' ? (
                <Textarea id={`cd-${f.name}`} rows={4} maxLength={f.maxLength} placeholder={f.placeholder} value={values[f.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
              ) : (
                <Input id={`cd-${f.name}`} type={f.type === 'url' ? 'url' : 'text'} maxLength={f.maxLength} placeholder={f.placeholder} value={values[f.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
              )}
              {errors[i] ? <p className="text-xs text-destructive">{errors[i]}</p> : f.help ? <p className="text-xs text-muted-foreground">{f.help}</p> : null}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy || missing || invalid}>{busy ? 'Saving…' : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
