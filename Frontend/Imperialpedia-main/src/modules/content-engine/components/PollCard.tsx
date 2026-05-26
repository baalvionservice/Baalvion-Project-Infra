'use client';

import React, { useState } from 'react';
import { Poll, PollOption } from '@/types/community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Users, Clock, CheckCircle2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PollCardProps {
  poll: Poll;
}

/**
 * Interactive poll component for community sentiment forecasting.
 * Enhanced for Prompt 38 with closed states and progress bars.
 */
export function PollCard({ poll }: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const isClosed = poll.status === 'closed';
  const showResults = hasVoted || isClosed;

  const handleVote = (idx: number) => {
    if (isClosed) return;
    setSelectedOption(idx);
    setHasVoted(true);
  };

  const options = Array.isArray(poll.options) ? poll.options : [];

  return (
    <Card className={cn(
      "glass-card border-none shadow-xl relative overflow-hidden transition-all duration-300",
      isClosed ? "opacity-80" : "bg-primary/5 hover:border-primary/20"
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Target className="h-24 w-24" />
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-primary">
            <Target className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold">Community Forecast</Text>
          </div>
          {isClosed ? (
            <Badge variant="secondary" className="text-[8px] h-5 px-2 font-bold uppercase">Final Results</Badge>
          ) : (
            <Badge className="bg-emerald-500 text-white border-none text-[8px] h-5 px-2 font-bold uppercase animate-pulse">Live</Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight font-bold">{poll.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {options.map((opt, idx) => {
            const optionLabel = typeof opt === 'string' ? opt : opt.option;
            const optionVotes = typeof opt === 'string' ? (poll.votes ? poll.votes[idx] : 0) : opt.votes;
            const percentage = poll.totalVotes > 0 ? Math.round((optionVotes / poll.totalVotes) * 100) : 0;
            
            return (
              <div key={idx} className="space-y-1.5">
                <button
                  disabled={showResults}
                  onClick={() => handleVote(idx)}
                  className={cn(
                    "w-full flex justify-between items-center p-3 rounded-xl border transition-all text-left",
                    showResults && selectedOption === idx ? "border-primary bg-primary/10 shadow-inner" : 
                    showResults ? "border-white/5 bg-background/20" :
                    "border-white/5 bg-background/40 hover:border-primary/30",
                    showResults && "cursor-default"
                  )}
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    {showResults && selectedOption === idx && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    {optionLabel}
                  </span>
                  {showResults && (
                    <span className="text-xs font-mono font-bold text-primary">
                      {percentage}%
                    </span>
                  )}
                </button>
                {showResults && (
                  <Progress value={percentage} className="h-1 bg-white/5" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
            <div className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {poll.totalVotes.toLocaleString()} participants</div>
            <div className="flex items-center gap-1.5">
              {isClosed ? (
                <><Lock className="h-3 w-3" /> Concluded {poll.closing_date}</>
              ) : (
                <><Clock className="h-3 w-3" /> Ends {poll.closing_date || 'Soon'}</>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
