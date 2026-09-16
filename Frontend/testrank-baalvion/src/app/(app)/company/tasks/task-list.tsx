"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Edit, Trash2, Copy } from "lucide-react";
import type {
  Task,
  TaskDifficulty,
  TaskStatus,
  RoleCategory,
  TaskType,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export type TaskWithSubmissionCount = Task & {
  submissionCount: number;
};

const difficulties: (TaskDifficulty | "All")[] = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];
const statuses: (TaskStatus | "All")[] = [
  "All",
  "draft",
  "published",
  "closed",
  "archived",
];
const roleCategories: (RoleCategory | "All")[] = [
  "All",
  "Engineering",
  "Design",
  "Marketing",
  "Business",
  "Data",
];
const taskTypes: (TaskType | "All")[] = [
  "All",
  "Coding",
  "MCQ",
  "Design",
  "Documentation",
  "Project",
];

export function CompanyTaskList({
  tasks,
}: {
  tasks: TaskWithSubmissionCount[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<
    TaskDifficulty | "All"
  >("All");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [roleFilter, setRoleFilter] = useState<RoleCategory | "All">("All");
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | "All">("All");
  const { toast } = useToast();

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesSearch = task.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesDifficulty =
          difficultyFilter === "All" || task.difficulty === difficultyFilter;
        const matchesStatus =
          statusFilter === "All" || task.status === statusFilter;
        const matchesRole =
          roleFilter === "All" || task.roleCategory === roleFilter;
        const matchesTaskType =
          taskTypeFilter === "All" ||
          (task.taskTypes || []).includes(taskTypeFilter);
        return (
          matchesSearch &&
          matchesDifficulty &&
          matchesStatus &&
          matchesRole &&
          matchesTaskType
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [
    tasks,
    searchTerm,
    difficultyFilter,
    statusFilter,
    roleFilter,
    taskTypeFilter,
  ]);

  const getStatusVariant = (status: TaskStatus) => {
    switch (status) {
      case "published":
        return "default";
      case "draft":
        return "secondary";
      case "closed":
      case "archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleDuplicate = (task: Task) => {
    const duplicatedTask = {
      ...task,
      id: `task-${Date.now()}`,
      title: `${task.title} (Copy)`,
      status: "draft",
      assignedCandidateIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log("Duplicated Task (Mock):", duplicatedTask);
    toast({
      title: "Task Duplicated (Mock)",
      description: `A copy of "${task.title}" has been created as a draft.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as TaskStatus | "All")
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={difficultyFilter}
            onValueChange={(value) =>
              setDifficultyFilter(value as TaskDifficulty | "All")
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((diff) => (
                <SelectItem key={diff} value={diff}>
                  {diff}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <Select
            value={roleFilter}
            onValueChange={(value) =>
              setRoleFilter(value as RoleCategory | "All")
            }
          >
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              {roleCategories.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={taskTypeFilter}
            onValueChange={(value) =>
              setTaskTypeFilter(value as TaskType | "All")
            }
          >
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.difficulty}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(task.deadline), "PPP")}
                  </TableCell>
                  <TableCell>{task.submissionCount}</TableCell>
                  <TableCell className="text-right  flex items-center">
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        href={`/company/tasks/${task.id}/assign`}
                        title="Assign Task"
                      >
                        <Users className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Duplicate Task"
                      onClick={() => handleDuplicate(task)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit Task">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      title="Delete Task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No tasks found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
