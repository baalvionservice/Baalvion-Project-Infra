"use client";

import { useEffect, useState } from "react";
import { votingService } from "@/core/services/voting.service";
import { Vote, VoteStatus } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, Play, Square, Archive, BarChart, History, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VotingManagerPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadVotes = async () => {
    setIsLoading(true);
    const data = await votingService.getVotes();
    setVotes(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadVotes();
    window.addEventListener('voting-updated', loadVotes);
    return () => window.removeEventListener('voting-updated', loadVotes);
  }, []);

  const handleStatusChange = async (id: string, status: VoteStatus) => {
    try {
      await votingService.updateStatus(id, status);
      toast({ title: "Status Updated", description: `Resolution is now ${status}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    }
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Accessing resolution ledger...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resolution Manager</h1>
          <p className="text-muted-foreground">Manage institutional voting, proxy resolutions, and board ballots.</p>
        </div>
        <Button onClick={() => toast({ title: "Simulation", description: "Create Resolution logic triggered." })}>
          <Plus className="mr-2 h-4 w-4" /> Create Resolution
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resolution Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Participation</TableHead>
                <TableHead className="text-right">Governance Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votes.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Gavel className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{vote.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {vote.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vote.status === 'Open' ? 'default' : 'secondary'}>
                      {vote.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {vote.eligibleRoles.map(role => (
                        <Badge key={role} variant="outline" className="text-[8px] px-1">{role}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vote.results ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>{vote.results.participationRate}% Participation</span>
                          <span className="text-green-500">{vote.results.isQuorumMet ? 'Quorum' : 'Incomplete'}</span>
                        </div>
                        <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${vote.results.participationRate}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">In Progress</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {vote.status === 'Draft' && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(vote.id, 'Open')}>
                          <Play className="h-3 w-3 mr-1" /> Open
                        </Button>
                      )}
                      {vote.status === 'Open' && (
                        <Button size="sm" variant="outline" className="text-amber-500" onClick={() => handleStatusChange(vote.id, 'Closed')}>
                          <Square className="h-3 w-3 mr-1" /> Close
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <BarChart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
