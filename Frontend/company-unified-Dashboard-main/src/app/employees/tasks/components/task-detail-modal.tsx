"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Task, Employee, Business } from "@/lib/types";
import businessesData from "@/lib/data/businesses";
import employeesData from "@/lib/data/employees.json";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, User, Briefcase, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function TaskDetailModal({
  task,
  isOpen,
  onOpenChange,
}: TaskDetailModalProps) {
  if (!task) return null;

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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task.title}</SheetTitle>
          <SheetDescription>Task ID: {task.id}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              <Badge variant="secondary">{task.status}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User /> {assignee.name}
              </div>
              <div className="flex items-center gap-2">
                <Briefcase /> {business.name}
              </div>
              <div className="flex items-center gap-2">
                <Calendar /> Due: {format(new Date(task.dueDate), "PP")}
              </div>
              <div className="flex items-center gap-2">
                <Tag /> {task.priority}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-4">Comments</h4>
            <div className="space-y-4">
              {task.comments.map((comment) => {
                const author = employeesData.find(
                  (e) => e.id === comment.authorId
                );
                const authorImage = author
                  ? PlaceHolderImages.find((p) => p.id === author.imageId)
                  : null;
                return (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      {authorImage && (
                        <AvatarImage src={authorImage.imageUrl} />
                      )}
                      <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full rounded-md bg-muted/50 p-3">
                      <div className="flex items-baseline justify-between text-xs">
                        <p className="font-semibold">{author?.name}</p>
                        <p className="text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-3 pt-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <Textarea placeholder="Add a comment..." />
                  <Button className="mt-2">Post Comment</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
