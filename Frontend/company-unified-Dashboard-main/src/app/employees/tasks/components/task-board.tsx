"use client";
import { useState, useMemo, type DragEvent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import tasksData from "@/lib/data/tasks.json";
import employeesData from "@/lib/data/employees.json";
import businessesData from "@/lib/data/businesses";
import departmentsData from "@/lib/data/departments.json";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Employee, Task, Business } from "@/lib/types";
import AddTaskModal from "./add-task-modal";
import TaskDetailModal from "./task-detail-modal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Status = "To Do" | "In Progress" | "Review" | "Done";
const statuses: Status[] = ["To Do", "In Progress", "Review", "Done"];

const priorityColors: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};

export default function TaskBoard() {
  const [allTasks, setAllTasks] = useState(tasksData as Task[]);
  const [filters, setFilters] = useState({
    search: "",
    business: "all",
    assignee: "all",
    priority: "all",
    department: "all",
  });
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleFilterChange = (filterName: string) => (value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const assignee = employeesData.find((e) => e.id === task.assigneeId);
      if (
        filters.search &&
        !task.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (filters.business !== "all" && task.businessId !== filters.business)
        return false;
      if (filters.assignee !== "all" && task.assigneeId !== filters.assignee)
        return false;
      if (filters.priority !== "all" && task.priority !== filters.priority)
        return false;
      if (
        filters.department !== "all" &&
        assignee?.department !== filters.department
      )
        return false;
      return true;
    });
  }, [filters, allTasks]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<Status, Task[]> = {
      "To Do": [],
      "In Progress": [],
      Review: [],
      Done: [],
    };
    for (const task of filteredTasks) {
      grouped[task.status as Status].push(task as Task);
    }
    return grouped;
  }, [filteredTasks]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    setAllTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: status } : task
      )
    );
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
          <Select
            value={filters.business}
            onValueChange={handleFilterChange("business")}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              {businessesData.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.assignee}
            onValueChange={handleFilterChange("assignee")}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {employeesData.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.priority}
            onValueChange={handleFilterChange("priority")}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.department}
            onValueChange={handleFilterChange("department")}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentsData.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {statuses.map((status) => (
          <div
            key={status}
            className="bg-muted/50 rounded-lg h-full"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            <h3 className="p-4 text-lg font-semibold sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10">
              {status}{" "}
              <Badge variant="secondary">{tasksByStatus[status].length}</Badge>
            </h3>
            <div className="p-4 space-y-4 h-full">
              {tasksByStatus[status].map((task) => {
                const assignee = employeesData.find(
                  (e) => e.id === task.assigneeId
                ) as Employee;
                const business = businessesData.find(
                  (b) => b.id === task.businessId
                ) as Business;
                const assigneeImage = assignee
                  ? PlaceHolderImages.find((p) => p.id === assignee.imageId)
                  : null;

                return (
                  <Card
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium pr-2">{task.title}</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={cn(
                                  "h-3 w-3 rounded-full",
                                  priorityColors[task.priority]
                                )}
                              ></div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{task.priority} Priority</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <Badge variant="outline">{business.name}</Badge>
                        <div className="flex items-center gap-2">
                          <span>{format(new Date(task.dueDate), "MMM d")}</span>
                          <Avatar className="h-6 w-6">
                            {assigneeImage && (
                              <AvatarImage src={assigneeImage.imageUrl} />
                            )}
                            <AvatarFallback>
                              {assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <AddTaskModal isOpen={isAddModalOpen} onOpenChange={setAddModalOpen} />
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onOpenChange={() => setSelectedTask(null)}
      />
    </>
  );
}
