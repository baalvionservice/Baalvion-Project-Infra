

'use client';

import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TaskCard } from './task-card';
import type { Task, RoleCategory, TaskDifficulty, TaskType, TaskPriority } from '@/lib/types';
import { Search } from 'lucide-react';
import { groupedRoles } from '@/lib/roles';
import { useAuth } from '@/contexts/auth-context';

export type TaskWithCompany = Task & {
  companyName: string;
  companyLogo?: string;
};

const difficulties: (TaskDifficulty | 'All')[] = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];
const taskTypes: (TaskType | 'All')[] = ["All", "Coding", "MCQ", "Design", "Documentation", "Project", "UI", "Component", "Styling", "Feature Implementation", "Campaign Planning", "Content Creation", "Social Media", "Email Marketing", "Ads", "Market Analysis", "Strategy Planning", "Financial Modeling", "Presentation", "Data Cleaning", "Visualization", "Statistical Analysis", "Reporting"];
const priorities: (TaskPriority | 'All')[] = ["All", "High", "Medium", "Low"];


export function TaskList({ tasks }: { tasks: TaskWithCompany[] }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleCategory | 'All'>('Engineering');
  const [difficultyFilter, setDifficultyFilter] = useState<TaskDifficulty | 'All'>('All');
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Base filter: only published tasks are visible in the general list
      if (task.status !== 'published') return false;

      // Smart Task Engine Logic
      if (user && user.role === 'candidate') {
          // If a task is private, the user MUST be in the assignedTo list
          if (task.isPrivate === true) {
              if (!task.assignedTo?.includes(user.id)) {
                  return false;
              }
          } 
          // If a task is not explicitly open (isOpen: false), it's treated as private
          else if (task.isOpen === false) {
              if (!task.assignedTo?.includes(user.id)) {
                  return false;
              }
          }
          // Otherwise (isOpen: true or undefined), it's a public task visible to all candidates
      }


      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || task.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = (() => {
          if (roleFilter === 'All') return true;
          if (task.roleCategory === roleFilter) return true;

          // Check if the selected filter is a parent category
          const parentGroup = groupedRoles.find(g => g.label === roleFilter);
          if (parentGroup && task.roleCategory && parentGroup.subRoles.includes(task.roleCategory)) {
              return true;
          }
          
          return false;
      })();

      const matchesDifficulty = difficultyFilter === 'All' || task.difficulty === difficultyFilter;
      const matchesTaskType = taskTypeFilter === 'All' || (task.taskTypes || []).includes(taskTypeFilter);
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      return matchesSearch && matchesRole && matchesDifficulty && matchesTaskType && matchesPriority;
    });
  }, [tasks, searchTerm, roleFilter, difficultyFilter, taskTypeFilter, priorityFilter, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title or company..."
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
            <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as TaskDifficulty | 'All')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(diff => <SelectItem key={diff} value={diff}>{diff}</SelectItem>)}
              </SelectContent>
            </Select>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
            <Select value={taskTypeFilter} onValueChange={(value) => setTaskTypeFilter(value as TaskType | 'All')}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'All')}>
                <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                    {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <h3 className="text-xl font-semibold">No Tasks Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
