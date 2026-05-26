"use client";

import { useEffect, useState } from "react";
import { votingService } from "@/core/services/voting.service";
import { Vote, VoteChoice } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Gavel, CheckCircle2, Clock, AlertTriangle, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/core/services/auth.service";

export default function MyVotingPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userRole, setUserRole] = useState<string>('public');
  const [selectedChoices, setSelectedChoices] = useState<Record<string, VoteChoice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    const [data, { role }] = await Promise.all([
      votingService.getVotes(),
      authService.getCurrentUser()
    ]);
    setVotes(data);
    setUserRole(role);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('voting-updated', loadData);
    return () => window.removeEventListener('voting-updated', loadData);
  }, []);

  const handleVote = async (voteId: string) => {
    const choice = selectedChoices[voteId];
    if (!choice) return;

    try {
      await votingService.castVote(voteId, choice);
      toast({ title: "Vote Cast Successfully", description: "Your secure ballot has been recorded in the ledger." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Voting Error", description: e.message });
    }
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Securely loading ballot center...</div>;

  const eligibleVotes = votes.filter(v => v.eligibleRoles.includes(userRole as any) || userRole === 'admin');

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
      <div className="text-center space-y-4">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
          <Gavel className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">Institutional Voting Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review and cast your votes on key corporate resolutions and board appointments. 
          All ballots are encrypted and tracked for governance compliance.
        </p>
      </div>

      <div className="grid gap-8">
        {eligibleVotes.length === 0 ? (
          <Card className="bg-muted/20 border-dashed text-center py-20">
            <CardContent>
              <p className="text-muted-foreground">No active resolutions require your vote at this time.</p>
            </CardContent>
          </Card>
        ) : (
          eligibleVotes.map((vote) => (
            <Card key={vote.id} className={vote.status === 'Closed' ? 'opacity-80' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle>{vote.title}</CardTitle>
                    <CardDescription>{vote.description}</CardDescription>
                  </div>
                  <Badge variant={vote.status === 'Open' ? 'default' : 'secondary'}>
                    {vote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg border text-sm italic">
                  "{vote.resolutionText}"
                </div>

                {vote.status === 'Open' ? (
                  <div className="space-y-4">
                    <Label className="font-bold">Cast Your Secure Ballot</Label>
                    <RadioGroup 
                      onValueChange={(val) => setSelectedChoices(prev => ({ ...prev, [vote.id]: val as VoteChoice }))}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Approve" id={`app-${vote.id}`} />
                        <Label htmlFor={`app-${vote.id}`}>Approve</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Reject" id={`rej-${vote.id}`} />
                        <Label htmlFor={`rej-${vote.id}`}>Reject</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Abstain" id={`abs-${vote.id}`} />
                        <Label htmlFor={`abs-${vote.id}`}>Abstain</Label>
                      </div>
                    </RadioGroup>
                  </div>
                ) : (
                  vote.results && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <BarChart className="h-4 w-4" /> Final Results
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground uppercase">Approve</p>
                          <p className="text-xl font-bold text-green-500">{vote.results.approve}%</p>
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground uppercase">Reject</p>
                          <p className="text-xl font-bold text-red-500">{vote.results.reject}%</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground uppercase">Abstain</p>
                          <p className="text-xl font-bold text-blue-500">{vote.results.abstain}%</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t bg-card/50 px-6 py-4">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Ends: {new Date(vote.endDate).toLocaleDateString()}
                  </div>
                  {vote.results?.isQuorumMet && (
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-3 w-3" /> Quorum Met
                    </div>
                  )}
                </div>
                {vote.status === 'Open' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleVote(vote.id)}
                    disabled={!selectedChoices[vote.id]}
                  >
                    Submit Vote
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <div className="p-6 bg-amber-500/10 border border-amber-500/50 rounded-xl flex gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-amber-500">Fiduciary Responsibility</p>
          <p className="text-sm text-amber-200/80">
            Institutional voting carries significant legal weight. Your decision impacts company governance, 
            capital structure, and board oversight. Ensure you have reviewed all related board materials 
            in the data room before casting your vote.
          </p>
        </div>
      </div>
    </div>
  );
}
