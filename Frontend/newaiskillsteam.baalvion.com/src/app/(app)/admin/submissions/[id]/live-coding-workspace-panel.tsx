'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, RotateCw, Monitor, User, Radio, Code, Pause, Square } from 'lucide-react';
import type { Submission, LiveSessionStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '@/contexts/submissions-context';

const getStatusVariant = (status?: LiveSessionStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Paused': return 'warning';
        case 'Cancelled': return 'destructive';
        case 'Scheduled': return 'warning';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

const mockCode = `
function findLongestWord(str) {
  const words = str.split(' ');
  let longest = '';
  for (let word of words) {
    if (word.length > longest.length) {
      longest = word;
    }
  }
  return longest;
}

const sentence = 'The quick brown fox jumped over the lazy dog';
findLongestWord(sentence);
`;

const mockOutput = `
Running code...
Result: "jumped"
`;

export function LiveCodingWorkspacePanel({ submission }: { submission: Submission }) {
  const { toast } = useToast();
  const { updateSubmission } = useSubmissions();
  const [code, setCode] = useState(mockCode);
  const [output, setOutput] = useState('');
  const [isCandidateTyping, setIsCandidateTyping] = useState(false);

  const handleRunCode = () => {
    toast({ title: "Running Code", description: "Executing code in the live session." });
    setTimeout(() => {
        setOutput(mockOutput);
        toast({ title: "Execution Complete" });
    }, 1500);
  };
  
  const handleReset = () => {
    setCode(mockCode);
    setOutput('');
  };

  const handleSessionControl = (status: LiveSessionStatus) => {
    updateSubmission(submission.id, { liveSessionStatus: status });
    toast({ title: `Session ${status}`, description: `The live session has been ${status.toLowerCase()}.`});
  };

  // Simulate candidate typing
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsCandidateTyping(true);
    setTimeout(() => setIsCandidateTyping(false), 2000); // Typing indicator lasts 2 seconds
  }

  const sessionStatus = submission.liveSessionStatus || 'Not Started';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Live Coding Workspace
        </CardTitle>
        <CardDescription>
            A real-time collaborative environment for coding tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
            <div className="flex flex-col">
                <h4 className="font-semibold">Session Status</h4>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusVariant(sessionStatus)} className="text-base capitalize">
                      {sessionStatus}
                  </Badge>
                  {sessionStatus === 'Active' && (
                      <div className="flex items-center gap-2 text-sm text-green-500 animate-pulse">
                          <Radio className="h-4 w-4" />
                          <span>Live</span>
                      </div>
                  )}
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSessionControl('Active')} disabled={sessionStatus === 'Active' || sessionStatus === 'Completed'}>
                    <Play className="mr-2 h-4 w-4"/>Resume
                </Button>
                 <Button variant="outline" size="sm" onClick={() => handleSessionControl('Paused')} disabled={sessionStatus !== 'Active'}>
                    <Pause className="mr-2 h-4 w-4"/>Pause
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleSessionControl('Completed')} disabled={!['Active', 'Paused', 'Scheduled'].includes(sessionStatus)}>
                    <Square className="mr-2 h-4 w-4"/>Stop
                </Button>
            </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Candidate is {isCandidateTyping ? 'typing...' : 'viewing'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>You are viewing</span>
          </div>
        </div>

        <div>
            <label className="text-sm font-medium">Shared Code Editor</label>
            <Textarea 
                value={code}
                onChange={handleCodeChange}
                className="font-mono text-xs min-h-[250px] bg-muted"
                placeholder="Candidate's code will appear here in real-time..."
            />
        </div>

        <div>
            <label className="text-sm font-medium">Output Console</label>
            <Textarea 
                readOnly
                value={output}
                className="font-mono text-xs min-h-[100px] bg-muted"
                placeholder="Execution output will appear here..."
            />
        </div>

        <div className="flex gap-2">
            <Button onClick={handleRunCode} className="flex-1">
                <Play className="mr-2 h-4 w-4" /> Run Code
            </Button>
            <Button onClick={handleReset} variant="outline">
                <RotateCw className="mr-2 h-4 w-4" /> Reset
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
