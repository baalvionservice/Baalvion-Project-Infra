'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, CheckCircle2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Vote {
  id: string;
  title: string;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
}

export default function ActiveVoting({ votes }: { votes: Vote[] }) {
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (voteId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/investor/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteId, choice: 'APPROVE' }),
      });

      const result = await response.json();

      if (result.success) {
        setVotedIds((prev) => [...prev, voteId]);
        toast({
          title: 'Vote Recorded',
          description: `Confirmation ID: ${result.data.confirmationId}`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Voting Failed',
        description: err.message || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVotes = votes.filter((v) => v.status === 'OPEN');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" /> Active Resolutions
        </CardTitle>
        <CardDescription>Participate in corporate governance decisions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeVotes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active resolutions require your attention.
          </p>
        ) : (
          activeVotes.map((vote) => (
            <div key={vote.id} className="p-4 rounded-lg border space-y-3">
              <div className="flex justify-between items-start gap-4">
                <h4 className="text-sm font-bold leading-tight">{vote.title}</h4>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3 w-3" /> Due {vote.deadline}
                </div>
              </div>
              
              {votedIds.includes(vote.id) ? (
                <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Vote Submitted
                </div>
              ) : (
                <Button 
                  className="w-full h-8 text-xs" 
                  onClick={() => handleVote(vote.id)}
                  disabled={isSubmitting}
                >
                  Cast Secure Ballot
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
