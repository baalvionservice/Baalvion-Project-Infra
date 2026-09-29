'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, RotateCcw, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { oauthClientsApi, type OAuthClient, type CreateClientPayload } from '@/lib/api/oauth-clients';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/lib/utils/format';

function SecretReveal({ secret }: { secret: string }) {
  const [show, setShow] = useState(false);
  const copy = () => { navigator.clipboard.writeText(secret); };
  return (
    <div className="flex items-center gap-2 mt-2">
      <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono break-all">
        {show ? secret : '••••••••••••••••••••••••••••••••'}
      </code>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShow(!show)}>
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CreateClientDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [form, setForm] = useState<CreateClientPayload>({
    name: '', redirectUris: [''], grantTypes: ['authorization_code', 'refresh_token'],
    scopes: ['openid', 'profile', 'email'], isConfidential: true,
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateClientPayload) => oauthClientsApi.create(payload),
    onSuccess: (res) => {
      setNewSecret(res.data.data.client_secret ?? null);
      onCreated();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, redirectUris: form.redirectUris?.filter(Boolean) };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setNewSecret(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Client</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{newSecret ? 'Client Created' : 'New OAuth Client'}</DialogTitle>
          {!newSecret && <DialogDescription>Create an OAuth2 application client.</DialogDescription>}
        </DialogHeader>
        {newSecret ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Save this secret now — it will not be shown again.
            </p>
            <SecretReveal secret={newSecret} />
          </div>
        ) : (
          <form id="create-client" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Application Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Redirect URI</Label>
              <Input
                value={form.redirectUris?.[0] ?? ''}
                onChange={(e) => setForm({ ...form, redirectUris: [e.target.value] })}
                placeholder="https://yourapp.com/callback"
              />
            </div>
          </form>
        )}
        <DialogFooter>
          {newSecret
            ? <Button onClick={() => { setOpen(false); setNewSecret(null); }}>Done</Button>
            : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button form="create-client" type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Creating…' : 'Create'}
                </Button>
              </>
            )
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OAuthClientsPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'OAuth Clients' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['oauth-clients', page],
    queryFn: () => oauthClientsApi.list({ page, limit: 20 }).then((r) => r.data.data),
  });

  const rotateMutation = useMutation({
    mutationFn: (clientId: string) => oauthClientsApi.rotateSecret(clientId),
    onSuccess: (res) => setRotatedSecret(res.data.data.clientSecret),
  });

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => oauthClientsApi.delete(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['oauth-clients'] }),
  });

  const columns: ColumnDef<OAuthClient>[] = [
    {
      accessorKey: 'name',
      header: 'Application',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.name}</p>
          <code className="text-[10px] text-muted-foreground">{row.original.client_id}</code>
        </div>
      ),
    },
    {
      accessorKey: 'grant_types',
      header: 'Grants',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.grant_types.map((g) => (
            <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'is_confidential',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant={row.original.is_confidential ? 'default' : 'outline'}>
          {row.original.is_confidential ? 'Confidential' : 'Public'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm" className="h-7 gap-1"
            onClick={() => rotateMutation.mutate(row.original.client_id)}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Rotate
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete client?</AlertDialogTitle>
                <AlertDialogDescription>
                  {row.original.name} will be revoked and all existing tokens invalidated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(row.original.client_id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="OAuth Clients"
        description="Manage OAuth2/OIDC application credentials"
        actions={<CreateClientDialog onCreated={() => queryClient.invalidateQueries({ queryKey: ['oauth-clients'] })} />}
      />

      {rotatedSecret && (
        <div className="mb-4 rounded-md border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/20 p-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">New client secret — save it now</p>
          <SecretReveal secret={rotatedSecret} />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setRotatedSecret(null)}>Dismiss</Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder="Search clients..."
        totalCount={data?.total}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
