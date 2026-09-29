"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageCircleQuestion, Megaphone, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGroup, listGroupPosts, createGroupPost, joinGroup, type DiscussionGroup, type GroupPost } from '@/services/groups/groupService';
import { formatDistanceToNow } from 'date-fns';

export default function GroupDetailPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <GroupDetailContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function GroupDetailContent() {
  const params = useParams();
  const slugOrId = String(params.slugOrId);
  const { toast } = useToast();
  const [group, setGroup] = useState<DiscussionGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerType, setComposerType] = useState<'update' | 'question'>('update');
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [g, p] = await Promise.all([getGroup(slugOrId), listGroupPosts(slugOrId)]);
      setGroup(g);
      setPosts(p);
    } catch (e: any) {
      toast({ title: 'Failed to load group', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slugOrId]);

  const handlePost = async () => {
    if (!composerText.trim()) return;
    setPosting(true);
    try {
      await joinGroup(slugOrId).catch(() => {}); // idempotent — ensures the author is a member before posting
      await createGroupPost(slugOrId, composerText.trim(), composerType);
      setComposerText('');
      toast({ title: composerType === 'question' ? 'Question posted' : 'Update shared' });
      await load();
    } catch (e: any) {
      toast({ title: 'Failed to post', description: e?.response?.data?.error?.message || e?.message, variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const handleAnswer = async (questionId: number) => {
    const text = answerDrafts[questionId];
    if (!text?.trim()) return;
    setAnsweringId(questionId);
    try {
      await createGroupPost(slugOrId, text.trim(), 'answer', questionId);
      setAnswerDrafts((d) => ({ ...d, [questionId]: '' }));
      await load();
    } catch (e: any) {
      toast({ title: 'Failed to post answer', description: e?.message, variant: 'destructive' });
    } finally {
      setAnsweringId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!group) return <div className="container mx-auto px-8 py-16 text-center text-muted-foreground">Group not found.</div>;

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{group.name}</h1>
        {group.description && <p className="text-slate-500 text-sm mt-1">{group.description}</p>}
        <p className="text-xs text-slate-400 mt-1">{group.memberCount} member{group.memberCount === 1 ? '' : 's'}</p>
      </header>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={composerType === 'update' ? 'default' : 'outline'} onClick={() => setComposerType('update')}>
              <Megaphone className="w-3.5 h-3.5 mr-1" /> Share Update
            </Button>
            <Button size="sm" variant={composerType === 'question' ? 'default' : 'outline'} onClick={() => setComposerType('question')}>
              <MessageCircleQuestion className="w-3.5 h-3.5 mr-1" /> Ask a Question
            </Button>
          </div>
          <Textarea
            rows={3}
            placeholder={composerType === 'question' ? 'What would you like to ask?' : "What's new in your practice?"}
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handlePost} disabled={posting}>
              {posting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No posts yet — be the first to share an update or ask a question.</Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-center gap-2 mb-1">
                {p.postType === 'question' ? <MessageCircleQuestion className="w-4 h-4 text-amber-600" /> : <Megaphone className="w-4 h-4 text-blue-600" />}
                <span className="font-semibold text-sm">{p.author?.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-auto">{formatDistanceToNow(new Date(p.createdAt))} ago</span>
              </div>
              <p className="text-sm text-slate-700">{p.content}</p>

              {p.postType === 'question' && (
                <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-3">
                  {(p.answers || []).map((a) => (
                    <div key={a.id}>
                      <p className="text-xs font-semibold">{a.author?.name}</p>
                      <p className="text-sm text-slate-600">{a.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      rows={1}
                      placeholder="Write an answer..."
                      value={answerDrafts[p.id] || ''}
                      onChange={(e) => setAnswerDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                      className="text-sm"
                    />
                    <Button size="sm" disabled={answeringId === p.id} onClick={() => handleAnswer(p.id)}>Reply</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
