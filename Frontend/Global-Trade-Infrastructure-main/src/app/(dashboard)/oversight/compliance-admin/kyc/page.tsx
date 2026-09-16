'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toList } from '@/lib/api-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ShieldCheck, Check, X, Loader2, User, Building2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { documentsApi } from '@/api/documents';

/** Unified row over the two real verification tracks — identity (personal) and
 *  company (institutional) — so the queue reads as one worklist even though they're
 *  separate tables with separate approve/reject endpoints. */
interface QueueRow {
  id: string;
  kind: 'identity' | 'company';
  label: string;
  detail: string;
  status: string;
  submittedAt: string;
  /** The uploaded evidence document, when the submission carried one. */
  documentId: string | null;
}

export default function ComplianceAdminKYCPage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [identityRes, companyRes] = await Promise.all([
        apiClient.get<any[]>('/identity_verifications', { status: 'submitted' }),
        apiClient.get<any[]>('/company_verifications', { status: 'submitted' }),
      ]);
      const identityRows: QueueRow[] = toList<any>(identityRes).map((r) => ({
        id: r.id, kind: 'identity', label: r.full_name || `User #${r.user_id}`,
        detail: `${r.id_type || 'ID'} · ${r.nationality || 'unknown nationality'}`,
        status: r.status, submittedAt: r.createdAt,
        documentId: r.id_document_id || null,
      }));
      const companyRows: QueueRow[] = toList<any>(companyRes).map((r) => ({
        id: String(r.org_id), kind: 'company', label: r.legal_company_name || `Org #${r.org_id}`,
        detail: r.registration_number ? `Reg. ${r.registration_number}` : 'No registration number on file',
        status: r.status, submittedAt: r.submitted_at || r.createdAt,
        documentId: (r.metadata && r.metadata.businessLicenseDocumentId) || null,
      }));
      setRows([...identityRows, ...companyRows].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDocument = async (row: QueueRow) => {
    if (!row.documentId) return;
    try {
      await documentsApi.openInNewTab(row.documentId);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not open document', description: e instanceof Error ? e.message : undefined });
    }
  };

  const handleAction = async (row: QueueRow, action: 'approve' | 'reject') => {
    // A rejection has to say why — the applicant sees this reason and resubmits against it.
    let reason: string | null = null;
    if (action === 'reject') {
      reason = window.prompt(`Reason for rejecting ${row.label}?`);
      if (reason === null) return;          // cancelled
      if (!reason.trim()) {
        toast({ variant: 'destructive', title: 'A rejection reason is required' });
        return;
      }
    }

    setProcessingId(row.id + row.kind);
    try {
      const path = row.kind === 'identity'
        ? `/identity_verifications/${row.id}/${action}`
        : `/company_verifications/${row.id}/${action}`;
      const res = await apiClient.patch(path, action === 'reject' ? { rejection_reason: reason!.trim() } : {});
      if (!res.success) throw new Error(res.error?.message || 'Action failed');
      toast({
        title: action === 'approve' ? 'Verification Approved' : 'Verification Rejected',
        description: `${row.label} (${row.kind}) marked ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });
      fetchData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action failed', description: e instanceof Error ? e.message : undefined });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = rows.filter(r =>
    r.label.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 space-y-8 p-4 md:p-8 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Institutional KYC Queue</h2>
          <p className="text-muted-foreground">Real submitted identity and company verifications awaiting review.</p>
        </div>
        <div className="flex items-center gap-2 bg-background p-3 rounded-lg border shadow-sm">
           <ShieldCheck className="h-5 w-5 text-primary" />
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Queue</span>
              <span className="text-sm font-bold">{rows.length} pending</span>
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or id..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed shadow-none py-20 text-center">
           <CardContent className="space-y-3 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto opacity-20" />
              <p>No pending verifications.</p>
           </CardContent>
        </Card>
      ) : (
        <Card className="shadow-none border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.kind + row.id}>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 capitalize">
                      {row.kind === 'identity' ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      {row.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold">{row.label}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.detail}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {row.submittedAt ? format(new Date(row.submittedAt), "MMM d, yyyy HH:mm") : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       {row.documentId && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 text-xs font-bold text-primary"
                           onClick={() => handleViewDocument(row)}
                         >
                           <FileText className="mr-1.5 h-3.5 w-3.5" /> View doc
                         </Button>
                       )}
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8 text-red-600 hover:bg-red-50"
                         disabled={!!processingId}
                         onClick={() => handleAction(row, 'reject')}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8 text-green-600 hover:bg-green-50"
                         disabled={!!processingId}
                         onClick={() => handleAction(row, 'approve')}
                       >
                         {processingId === row.id + row.kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </main>
  );
}
