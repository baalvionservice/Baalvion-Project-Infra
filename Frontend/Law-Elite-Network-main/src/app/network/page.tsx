"use client";

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Check, X, Rss, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  listConnections, acceptConnectionRequest, declineConnectionRequest, removeConnection, getNetworkFeed,
  type LawyerConnection, type GroupUpdatePost,
} from '@/services/connections/connectionService';
import { resolvePersonImage } from '@/lib/article-art';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NetworkPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <NetworkContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function NetworkContent() {
  const { toast } = useToast();
  const [feed, setFeed] = useState<GroupUpdatePost[]>([]);
  const [followers, setFollowers] = useState<LawyerConnection[]>([]);
  const [following, setFollowing] = useState<LawyerConnection[]>([]);
  const [connections, setConnections] = useState<LawyerConnection[]>([]);
  const [pending, setPending] = useState<LawyerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [f, fol, fg, conn, pend] = await Promise.all([
        getNetworkFeed(),
        listConnections('followers'),
        listConnections('following'),
        listConnections('connections'),
        listConnections('pending'),
      ]);
      setFeed(f); setFollowers(fol); setFollowing(fg); setConnections(conn); setPending(pend);
    } catch (e: any) {
      toast({ title: 'Failed to load network', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleRespond = async (id: number, accept: boolean) => {
    setBusyId(id);
    try {
      await (accept ? acceptConnectionRequest(id) : declineConnectionRequest(id));
      toast({ title: accept ? 'Request accepted' : 'Request declined' });
      await loadAll();
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id: number) => {
    setBusyId(id);
    try {
      await removeConnection(id);
      toast({ title: 'Removed' });
      await loadAll();
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="container mx-auto px-8 pt-8 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Network</h1>
        <p className="text-slate-500 text-sm mt-1">Colleagues, collaborators, and legal updates from those you follow.</p>
      </header>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="pending">Pending {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
          <TabsTrigger value="connections">Connections ({connections.length})</TabsTrigger>
          <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
          <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6 space-y-3">
          {feed.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              <Rss className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              No updates yet — follow colleagues or join a group to see activity here.
            </Card>
          ) : feed.map((p) => (
            <Card key={p.id} className="p-4 flex gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={resolvePersonImage({ avatarUrl: p.author?.profile_photo, name: p.author?.name, id: p.author?.id })} />
                <AvatarFallback>{p.author?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm"><span className="font-semibold">{p.author?.name}</span> <span className="text-muted-foreground">in {p.group?.name}</span></p>
                <p className="text-sm mt-1">{p.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{formatDistanceToNow(new Date(p.createdAt))} ago</p>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-3">
          {pending.length === 0 ? <Card className="p-10 text-center text-sm text-muted-foreground">No pending requests.</Card> : pending.map((c) => (
            <Card key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.requester.name}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{c.relation} request</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => handleRespond(c.id, false)}><X className="w-3.5 h-3.5 mr-1" /> Decline</Button>
                <Button size="sm" disabled={busyId === c.id} onClick={() => handleRespond(c.id, true)}><Check className="w-3.5 h-3.5 mr-1" /> Accept</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="connections" className="mt-6 space-y-3">
          {connections.length === 0 ? <Card className="p-10 text-center text-sm text-muted-foreground">No connections yet.</Card> : connections.map((c) => (
            <ConnectionRow key={c.id} connection={c} onRemove={() => handleRemove(c.id)} busy={busyId === c.id} />
          ))}
        </TabsContent>

        <TabsContent value="followers" className="mt-6 space-y-3">
          {followers.length === 0 ? <Card className="p-10 text-center text-sm text-muted-foreground">No followers yet.</Card> : followers.map((c) => (
            <ConnectionRow key={c.id} connection={c} counterpartKey="requester" />
          ))}
        </TabsContent>

        <TabsContent value="following" className="mt-6 space-y-3">
          {following.length === 0 ? <Card className="p-10 text-center text-sm text-muted-foreground">You aren't following anyone yet.</Card> : following.map((c) => (
            <ConnectionRow key={c.id} connection={c} counterpartKey="addressee" onRemove={() => handleRemove(c.id)} busy={busyId === c.id} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConnectionRow({ connection, counterpartKey, onRemove, busy }: {
  connection: LawyerConnection; counterpartKey?: 'requester' | 'addressee'; onRemove?: () => void; busy?: boolean;
}) {
  const person = counterpartKey ? connection[counterpartKey] : connection.requester;
  return (
    <Card className="p-4 flex items-center justify-between">
      <Link href={`/lawyer/${person.id}`} className="flex items-center gap-3 hover:underline">
        <Avatar className="w-9 h-9">
          <AvatarImage src={resolvePersonImage({ avatarUrl: person.profile_photo, name: person.name, id: person.id })} />
          <AvatarFallback>{person.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{person.name}</p>
          <p className="text-xs text-muted-foreground">{person.city ? `${person.city}, ` : ''}{person.country}</p>
        </div>
      </Link>
      {onRemove && (
        <Button size="sm" variant="outline" disabled={busy} onClick={onRemove}>
          <UserMinus className="w-3.5 h-3.5 mr-1" /> Remove
        </Button>
      )}
    </Card>
  );
}
