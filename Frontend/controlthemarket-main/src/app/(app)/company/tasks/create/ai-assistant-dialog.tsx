'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { generateTaskDescriptionAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { TaskDifficulty } from '@/lib/types';

interface AiAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDescriptionUpdate: (newDescription: string) => void;
  initialTitle?: string;
}

export function AiAssistantDialog({
  isOpen,
  onOpenChange,
  onDescriptionUpdate,
  initialTitle,
}: AiAssistantDialogProps) {
  const [taskTitle, setTaskTitle] = useState(initialTitle || '');
  const [keywords, setKeywords] = useState('');
  const [requirements, setRequirements] = useState('');
  const [skills, setSkills] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('Intermediate');
  const [duration, setDuration] = useState('4 hours');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialTitle) {
      setTaskTitle(initialTitle);
    }
  }, [initialTitle]);

  const handleGenerate = async () => {
    if (!taskTitle || !requirements) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a Task Title and Description Requirements.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedDescription('');

    try {
      const result = await generateTaskDescriptionAction({
        taskTitle,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        descriptionRequirements: requirements,
        skillsRequired: skills.split(',').map(s => s.trim()).filter(Boolean),
        difficulty,
        durationEstimate: duration,
      });

      if (result.success && result.data) {
        setGeneratedDescription(result.data.generatedDescription);
      } else {
        throw new Error(result.error || 'Failed to generate description.');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Could not generate description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDescription = () => {
    onDescriptionUpdate(generatedDescription);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Task Description Assistant
          </DialogTitle>
          <DialogDescription>
            Provide some details, and let AI craft a professional task description for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-title" className="text-right">Title</Label>
            <Input id="ai-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-requirements" className="text-right">Requirements</Label>
            <Textarea id="ai-requirements" placeholder="e.g., Create a React component, use Tailwind for styling, must be responsive..." value={requirements} onChange={(e) => setRequirements(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-keywords" className="text-right">Keywords</Label>
            <Input id="ai-keywords" placeholder="react, tailwind, frontend (comma-separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-skills" className="text-right">Skills</Label>
            <Input id="ai-skills" placeholder="React, TypeScript, CSS (comma-separated)" value={skills} onChange={(e) => setSkills(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Difficulty</Label>
             <Select onValueChange={(val) => setDifficulty(val as TaskDifficulty)} defaultValue={difficulty}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a difficulty level" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
           {generatedDescription && (
            <div className="space-y-2">
              <Label>AI Generated Description:</Label>
              <Textarea readOnly value={generatedDescription} className="h-48" />
            </div>
          )}

        </div>
        <DialogFooter>
          {generatedDescription ? (
             <Button onClick={handleUseDescription}>Use This Description</Button>
          ) : (
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Description
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
