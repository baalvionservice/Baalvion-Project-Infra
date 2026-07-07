'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFreightBookings, useDocuments, useCreateDocument, DocType } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, ExternalLink } from 'lucide-react';

const DOC_TYPES: DocType[] = ['commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin', 'insurance_document', 'other'];

export default function FreightDocumentsPage() {
  const { toast } = useToast();
  const { data: bookingsPage } = useFreightBookings({});
  const bookingsWithShipment = (bookingsPage?.items ?? []).filter((b) => !!b.shipment_id);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const { data: docsPage, isLoading } = useDocuments({ shipment_id: selectedShipmentId }, { enabled: !!selectedShipmentId });
  const createDoc = useCreateDocument(selectedShipmentId);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ docType: 'commercial_invoice' as DocType, title: '' });

  const handleCreate = async () => {
    if (!selectedShipmentId) return;
    await createDoc.mutateAsync({ doc_type: form.docType, title: form.title || undefined, shipment_id: selectedShipmentId });
    toast({ title: 'Document record created', description: 'Upload the file version from the Document Vault to finish.' });
    setOpen(false);
    setForm({ docType: 'commercial_invoice', title: '' });
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Freight Documents</h1>
          <p className="text-sm text-muted-foreground">Documents scoped to a freight booking's shipment — backed by the shared trade-service document engine.</p>
        </div>
        <Link href="/documents" className="text-sm text-primary flex items-center gap-1">Open Document Vault <ExternalLink className="h-3.5 w-3.5" /></Link>
      </div>

      <FreightNavTabs />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Select a Booking</CardTitle>
          <CardDescription>Only bookings linked to a shipment can have documents attached.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId}>
            <SelectTrigger className="w-full md:w-96"><SelectValue placeholder="Choose a booking…" /></SelectTrigger>
            <SelectContent>
              {bookingsWithShipment.length === 0 && <SelectItem value="none" disabled>No bookings with a linked shipment yet</SelectItem>}
              {bookingsWithShipment.map((b) => (
                <SelectItem key={b.shipment_id as string} value={b.shipment_id as string}>{b.carrier?.toUpperCase() ?? 'Unassigned'} · {b.tracking_number ?? b.id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedShipmentId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Documents</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" /> New Document</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Document Record</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={form.docType} onValueChange={(v) => setForm((f) => ({ ...f, docType: v as DocType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
                </div>
                <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground py-6 text-center">Loading documents…</p>}
            {!isLoading && (docsPage?.items.length ?? 0) === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No documents attached to this shipment yet.</p>}
            {(docsPage?.items ?? []).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-xs font-bold">{doc.title ?? doc.doc_type}</p><p className="text-[10px] text-muted-foreground capitalize">{doc.doc_type.replace('_', ' ')}</p></div>
                </div>
                <Badge variant="outline" className="text-[9px] capitalize">{doc.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
