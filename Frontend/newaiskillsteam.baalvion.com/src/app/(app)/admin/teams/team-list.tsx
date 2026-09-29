
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import type { AdminTeamData } from './page';
import { TeamDetailsDialog } from './team-details-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AdminTeamList({ initialData }: { initialData: AdminTeamData[] }) {
  const [data, setData] = useState<AdminTeamData[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingTeam, setViewingTeam] = useState<AdminTeamData | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(team => {
      return team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             team.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
             <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by team or company..."
                    className="pl-10 min-w-[200px] md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
      </div>

      <div className="rounded-md border">
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="hidden md:table-cell">Team Lead</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="hidden md:table-cell">Tasks</TableHead>
              <TableHead className="hidden md:table-cell">Submissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.company.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{team.lead.name}</TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                        {team.members.slice(0,3).map(member => (
                            <Tooltip key={member.id}>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-background">
                                        <AvatarImage src={member.profile?.avatarUrl} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent><p>{member.name}</p></TooltipContent>
                            </Tooltip>
                        ))}
                         {team.members.length > 3 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                                +{team.members.length - 3}
                            </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{team.taskCount}</TableCell>
                  <TableCell className="hidden md:table-cell">{team.submissionCount}</TableCell>
                  <TableCell className="text-right">
                     <Button variant="ghost" size="sm" onClick={() => setViewingTeam(team)}>View Details</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No teams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </TooltipProvider>
      </div>
      <TeamDetailsDialog
        isOpen={!!viewingTeam}
        onOpenChange={() => setViewingTeam(null)}
        team={viewingTeam}
      />
    </div>
  );
}
