'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface JsonViewerModalProps {
  payload: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function JsonViewerModal({
  payload,
  isOpen,
  onOpenChange,
}: JsonViewerModalProps) {
  if (!payload) return null;

  let formattedPayload;
  try {
    formattedPayload = JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    formattedPayload = payload;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raw Webhook Payload</DialogTitle>
          <DialogDescription>
            The raw JSON payload received from the webhook source.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-auto rounded-md bg-muted p-4">
          <pre><code className="text-sm">{formattedPayload}</code></pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
