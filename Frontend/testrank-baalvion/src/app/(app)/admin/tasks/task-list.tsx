
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Edit, Trash2, CheckCircle } from 'lucide-react';
import type { Task, TaskDifficulty, TaskStatus, RoleCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export type TaskWithDetails = Task & {
  submissionCount: number;
  companyName: string;
};

const difficulties: (TaskDifficulty | 'All')[] = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];
const statuses: (TaskStatus | 'All')[] = ["All", "draft", "published", "closed", "archived"];
const roleCategories: (RoleCategory | 'All')[] = ["All", "Engineering", "Design", "Marketing", "Business", "Data"];

export function AdminTaskList({ tasks }: { tasks: TaskWithDetails[] }) {
  const [data, setData] = useState<TaskWithDetails[]>(tasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<TaskDifficulty | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<RoleCategory | 'All'>('All');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredTasks = useMemo(() => {
    return data.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || task.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'All' || task.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchesRole = roleFilter === 'All' || task.roleCategory === roleFilter;
      return matchesSearch && matchesDifficulty && matchesStatus && matchesRole;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, searchTerm, difficultyFilter, statusFilter, roleFilter]);

  const getStatusVariant = (status: TaskStatus) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'closed':
      case 'archived':
        return 'outline';
      default: return 'outline';
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredTasks.length) {
        setSelectedRows(new Set());
    } else {
        setSelectedRows(new Set(filteredTasks.map(item => item.id)));
    }
  };

  const handleBulkAction = (action: 'complete' | 'delete') => {
    if (selectedRows.size === 0) return;
    
    if (action === 'complete') {
        setData(prev => prev.map(task => selectedRows.has(task.id) ? { ...task, status: 'closed' } : task));
        toast({ title: 'Bulk Action Successful', description: `${selectedRows.size} task(s) have been marked as completed/closed.` });
    }
    
    if (action === 'delete') {
        setData(prev => prev.filter(task => !selectedRows.has(task.id)));
        toast({ title: 'Bulk Action Successful', description: `${selectedRows.size} task(s) have been deleted.` });
    }

    setSelectedRows(new Set());
  };

  const handleAction = (action: 'Edit' | 'Delete', taskTitle: string, taskId: string) => {
    if (action === 'Delete') {
        setData(prev => prev.filter(task => task.id !== taskId));
        toast({
            title: `Action: ${action}`,
            description: `Task "${taskTitle}" has been deleted.`,
        });
    } else {
        toast({
            title: `Action: ${action} (Mock)`,
            description: `Triggered "${action}" for task: ${taskTitle}. This would open an edit form.`,
        });
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 md:grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or company..."
                        className="pl-10 min-w-[200px] md:min-w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as TaskDifficulty | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        {difficulties.map(diff => <SelectItem key={diff} value={diff}>{diff}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleCategory | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roleCategories.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             {selectedRows.size > 0 && (
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleBulkAction('complete')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Complete ({selectedRows.size})
                </Button>
                <Button variant="destructive" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedRows.size})
                </Button>
             </div>
          )}
        </div>
        
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedRows.size > 0 && selectedRows.size === filteredTasks.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead className="hidden sm:table-cell">Deadline</TableHead>
                        <TableHead className="hidden md:table-cell">Submissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                        <TableRow key={task.id} data-state={selectedRows.has(task.id) && "selected"}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRows.has(task.id)}
                                onCheckedChange={() => toggleRow(task.id)}
                                aria-label="Select row"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell className="hidden md:table-cell">{task.companyName}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(task.status)} className="capitalize">{task.status}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{task.difficulty}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{format(new Date(task.deadline), "PPP")}</TableCell>
                            <TableCell className="hidden md:table-cell">{task.submissionCount}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" title="Edit Task" onClick={() => handleAction('Edit', task.title, task.id)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Task" onClick={() => handleAction('Delete', task.title, task.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                No tasks found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
