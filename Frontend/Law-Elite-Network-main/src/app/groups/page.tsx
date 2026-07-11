"use client";

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { listGroups, createGroup, type DiscussionGroup } from '@/services/groups/groupService';
import Link from 'next/link';

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <GroupsContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function GroupsContent() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<DiscussionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setGroups(await listGroups()); }
    catch (e: any) { toast({ title: 'Failed to load groups', description: e?.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      await createGroup(name.trim(), description.trim() || undefined);
      toast({ title: 'Community created' });
      setName(''); setDescription('');
      await load();
    } catch (e: any) {
      toast({ title: 'Failed to create group', description: e?.response?.data?.error?.message || e?.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-8 pt-8 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Legal Communities</h1>
        <p className="text-slate-500 text-sm mt-1">Join discussion groups, share updates, and ask/answer legal questions.</p>
      </header>

      <Card className="max-w-2xl mb-8">
        <CardHeader><CardTitle className="text-base">Start a Community</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Community name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="What's this community about?" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : groups.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No communities yet — be the first to start one.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.slug}`}>
              <Card className="p-5 hover:border-blue-300 transition-colors h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold">{g.name}</h3>
                </div>
                {g.description && <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>}
                <p className="text-xs text-slate-400 mt-3">{g.memberCount} member{g.memberCount === 1 ? '' : 's'}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
