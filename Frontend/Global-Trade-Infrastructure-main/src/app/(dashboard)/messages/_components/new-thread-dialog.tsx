'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { communicationService, ContextType } from '@/services/communication-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const CONTEXT_TYPES: ContextType[] = ['general', 'rfq', 'deal', 'order', 'incident', 'compliance', 'treasury', 'logistics'];

type Props = { onCreated: () => void };

export function NewThreadDialog({ onCreated }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [contextType, setContextType] = useState<ContextType>('general');

  const isValid = title.trim().length > 0 && participants.trim().length > 0;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const conv = await communicationService.provisionThread({
        contextId: `THREAD-${Date.now()}`,
        contextType,
        title: title.trim(),
        participants: participants.split(',').map((p) => p.trim()).filter(Boolean),
      });
      toast({ title: 'Dialogue Node Created', description: `${title} is now live.` });
      setOpen(false);
      setTitle('');
      setParticipants('');
      setContextType('general');
      onCreated();
      router.push(`/messages/${conv.id}`);
    } catch (err) {
      toast({
        title: 'Could not create thread',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-black shadow-2xl h-11 px-6 text-[10px] uppercase tracking-widest bg-primary">
          NEW THREAD
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Dialogue Node</DialogTitle>
          <DialogDescription>Opens a secure coordination thread between trade participants.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Thread Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solar PV Mandate Coordination" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Participants (comma-separated)</Label>
            <Input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Beacon Tech, Energy Corp" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Context</Label>
            <Select value={contextType} onValueChange={(v) => setContextType(v as ContextType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTEXT_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct} className="capitalize">{ct}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Thread
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
