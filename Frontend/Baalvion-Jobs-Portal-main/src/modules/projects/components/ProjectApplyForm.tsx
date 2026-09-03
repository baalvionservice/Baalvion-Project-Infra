'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, User, UsersRound, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { marketplaceService, type MarketplaceProject } from '@/services/marketplace.service';

type Member = { name: string; email: string; role: string };

const MIN_PITCH = 40;

/**
 * Pitching for a brief, alone or with a team.
 *
 * The mode toggle only appears when the brief accepts both — offering "work as a team"
 * on a solo-only brief just invites a rejection the server would have to issue. Team
 * members are named collaborators on this proposal, not accounts: nobody is signed up
 * to anything without their say-so.
 */
export function ProjectApplyForm({ project }: { project: MarketplaceProject }) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const canChoose = project.collaborationMode === 'either';
  const [mode, setMode] = useState<'solo' | 'team'>(
    project.collaborationMode === 'team' ? 'team' : 'solo',
  );
  const [pitch, setPitch] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<Member[]>([{ name: '', email: '', role: '' }]);
  const [availability, setAvailability] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // The lead counts towards the team, so the roster holds one fewer than the cap.
  const maxOthers = Math.max((project.maxTeamSize ?? 5) - 1, 1);

  const updateMember = (index: number, patch: Partial<Member>) =>
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const submit = async () => {
    if (pitch.trim().length < MIN_PITCH) {
      toast({
        variant: 'destructive',
        title: 'Tell them a bit more',
        description: `A pitch needs at least ${MIN_PITCH} characters — what you'd do and why you.`,
      });
      return;
    }
    const roster = members.filter((m) => m.name.trim());
    if (mode === 'team' && roster.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Who else is with you?',
        description: 'Add at least one teammate, or switch to applying on your own.',
      });
      return;
    }

    setIsSending(true);
    try {
      await marketplaceService.apply(project.id, {
        mode,
        pitch: pitch.trim(),
        teamName: mode === 'team' ? teamName.trim() || undefined : undefined,
        teamMembers: mode === 'team' ? roster : undefined,
        availability: availability.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Application not sent',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex items-start gap-4 p-6">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
          <div>
            <h3 className="font-semibold">Your pitch is in</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A confirmation is on its way to your inbox, and you can follow it from{' '}
              <Link href="/my-account" className="underline underline-offset-4">your dashboard</Link>.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!authLoading && !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sign in to pitch for this</CardTitle>
          <CardDescription>
            Applications are tied to your candidate record, so you can track them and message the team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild><Link href={`/login?next=/projects/${project.slug ?? project.id}`}>Sign in</Link></Button>
          <Button asChild variant="outline"><Link href="/register">Create an account</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pitch for this project</CardTitle>
        <CardDescription>
          {project.collaborationMode === 'solo' && 'This brief is for one person.'}
          {project.collaborationMode === 'team' && `This brief is for a team of up to ${project.maxTeamSize ?? 'a few'}.`}
          {canChoose && 'Take it on alone or bring a team — whichever suits the work.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {canChoose && (
          <div>
            <Label className="text-sm">How would you take this on?</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {([
                { value: 'solo' as const, icon: User, label: 'On my own', hint: 'You do the whole brief' },
                { value: 'team' as const, icon: UsersRound, label: 'With a team', hint: `Up to ${project.maxTeamSize ?? 5} of you` },
              ]).map((option) => {
                const Icon = option.icon;
                const active = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    aria-pressed={active}
                    className={cn(
                      'border p-3 text-left transition-colors',
                      active ? 'border-foreground bg-muted' : 'hover:border-foreground/30',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <p className="mt-2 text-sm font-semibold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="pitch">Your pitch</Label>
          <Textarea
            id="pitch"
            value={pitch}
            onChange={(e) => setPitch(e.target.value.slice(0, 5000))}
            rows={6}
            className="mt-2"
            placeholder="What you'd do first, what you've built that's close to this, and anything about the brief you'd push back on."
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {pitch.trim().length < MIN_PITCH
              ? `${MIN_PITCH - pitch.trim().length} more characters`
              : `${pitch.length} characters`}
          </p>
        </div>

        {mode === 'team' && (
          <div className="space-y-3 border-t pt-5">
            <div>
              <Label htmlFor="teamName">Team name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-2"
                placeholder="Studio Nine"
              />
            </div>

            <div>
              <Label>Who else is with you?</Label>
              <p className="mb-2 mt-1 text-xs text-muted-foreground">
                You are counted as the lead. Add up to {maxOthers} {maxOthers === 1 ? 'other' : 'others'} —
                they are named on the proposal, not signed up to anything.
              </p>
              <div className="space-y-2">
                {members.map((member, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input
                      value={member.name}
                      onChange={(e) => updateMember(i, { name: e.target.value })}
                      placeholder="Name"
                      aria-label={`Teammate ${i + 1} name`}
                    />
                    <Input
                      value={member.email}
                      onChange={(e) => updateMember(i, { email: e.target.value })}
                      placeholder="Email (optional)"
                      type="email"
                      aria-label={`Teammate ${i + 1} email`}
                    />
                    <Input
                      value={member.role}
                      onChange={(e) => updateMember(i, { role: e.target.value })}
                      placeholder="Role on the project"
                      aria-label={`Teammate ${i + 1} role`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={members.length === 1}
                      aria-label={`Remove teammate ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {members.length < maxOthers && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setMembers((prev) => [...prev, { name: '', email: '', role: '' }])}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add teammate
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="availability">Availability <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="mt-2"
              placeholder="20 hrs/week from October"
            />
          </div>
          <div>
            <Label htmlFor="portfolio">Portfolio link <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="portfolio"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="mt-2"
              placeholder="https://…"
            />
          </div>
        </div>

        <Button onClick={submit} disabled={isSending} className="w-full sm:w-auto">
          {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send pitch
        </Button>
      </CardContent>
    </Card>
  );
}
