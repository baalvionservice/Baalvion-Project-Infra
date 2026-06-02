
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Clock, Loader2, CheckCircle2, Circle, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockAddTask, updateCase } from '@/services/cases/case.mock';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface TaskSystemProps {
  caseId: string;
  tasks: any[];
  onUpdate: () => void;
}

/**
 * @fileOverview TaskSystem
 * Strategic workflow management for individual case dossiers.
 */
export default function TaskSystem({ caseId, tasks, onUpdate }: TaskSystemProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const { toast } = useToast();

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      await mockAddTask(caseId, { title: taskTitle, status: 'pending' });
      setTaskTitle("");
      setIsAdding(false);
      onUpdate();
      toast({ title: "Protocol Entry Added", description: "Strategic task has been committed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failure" });
    }
  };

  const toggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    await updateCase(caseId, { tasks: updatedTasks });
    onUpdate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-blue-600" /> Matter Workflow
        </h3>
        <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Task
        </Button>
      </div>

      {isAdding && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4 flex gap-3">
            <input 
              autoFocus
              className="flex-1 bg-white border border-slate-200 rounded-lg px-4 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Enter protocol objective..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button onClick={handleAddTask} className="bg-blue-600 text-white font-bold uppercase text-[9px] tracking-widest px-4 h-9">Commit</Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-slate-400 font-bold uppercase text-[9px] tracking-widest px-4 h-9">Cancel</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {tasks.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">No active protocols defined.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={cn(
              "group transition-all duration-300 border-slate-100 hover:border-blue-200 shadow-none",
              task.status === 'completed' ? "opacity-60 bg-slate-50/50" : "bg-white"
            )}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleStatus(task.id, task.status)}
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                      task.status === 'completed' ? "bg-emerald-500 text-white" : "border-2 border-slate-200 text-slate-200 hover:border-blue-400"
                    )}
                  >
                    {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <div>
                    <p className={cn(
                      "text-sm font-bold tracking-tight",
                      task.status === 'completed' ? "line-through text-slate-400" : "text-slate-900"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Log ID: {task.id.slice(-6)} • Assigned to Chambers
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {formatDistanceToNow(task.createdAt)} ago
                  </span>
                  <button className="text-slate-300 hover:text-blue-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
