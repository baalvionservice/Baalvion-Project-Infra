
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { PublicCandidateRanking } from './page';
import type { RoleCategory, ExperienceLevel } from '@/lib/types';
import { LeaderboardTopPerformers } from './leaderboard-top-performers';
import { LeaderboardTable } from './leaderboard-table';
import { groupedRoles } from '@/lib/roles';

const timeRanges: ('All-Time' | 'Monthly' | 'Weekly')[] = ["All-Time", "Monthly", "Weekly"];
const skillLevels: (ExperienceLevel | 'All')[] = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

export function LeaderboardClientPage({ initialData }: { initialData: PublicCandidateRanking[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleCategory | 'All'>('All');
    const [timeFilter, setTimeFilter] = useState<string>('All-Time');
    const [skillFilter, setSkillFilter] = useState<ExperienceLevel | 'All'>('All');

    const filteredData = useMemo(() => {
        return initialData.filter((item) => {
            const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesRole = (() => {
                if (roleFilter === 'All') return true;
                if (item.primaryRole === roleFilter) return true;

                // Check if the selected filter is a parent category
                const parentGroup = groupedRoles.find(g => g.label === roleFilter);
                if (parentGroup && item.primaryRole && parentGroup.subRoles.includes(item.primaryRole)) {
                    return true;
                }
                
                return false;
            })();
            
            const matchesSkill = skillFilter === 'All' || item.candidate.profile?.experienceLevel === skillFilter;
            // Time filter is mocked, so it doesn't do anything
            return matchesSearch && matchesRole && matchesSkill;
        });
    }, [initialData, searchTerm, roleFilter, timeFilter, skillFilter]);

    const topPerformers = filteredData.slice(0, 3);
    const restOfLeaderboard = filteredData.slice(3);

    return (
        <div className="container py-12 md:py-20">
            <div className="mx-auto max-w-4xl text-center">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
                    Top Performers
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Discover the most skilled and highest-scoring candidates on the platform.
                </p>
            </div>

            <div className="my-8 flex flex-col gap-4 md:flex-row">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by candidate name..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleCategory | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Roles</SelectItem>
                        {groupedRoles.map(group => (
                        <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            <SelectItem value={group.label}>{group.label} (All)</SelectItem>
                            {group.subRoles.map(role => (
                            <SelectItem key={role} value={role} className="pl-8">{role}</SelectItem>
                            ))}
                        </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={skillFilter} onValueChange={(value) => setSkillFilter(value as ExperienceLevel | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by skill level" />
                    </SelectTrigger>
                    <SelectContent>
                        {skillLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by time" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeRanges.map(range => <SelectItem key={range} value={range}>{range}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <LeaderboardTopPerformers performers={topPerformers} />

            <div className="mt-12">
                <LeaderboardTable data={restOfLeaderboard} />
            </div>
        </div>
    )
}
