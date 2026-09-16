
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
import { Play, RotateCw, Server, Cpu, MemoryStick, HardDrive, Terminal } from 'lucide-react';
import type { Submission, SandboxStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const getStatusVariant = (status?: SandboxStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Error': return 'destructive';
        case 'Idle': return 'warning';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

const mockCode = `
function processSubmission(data) {
  // Your code here
  console.log('Processing submission data...');
  const result = data.map(item => item * 2);
  console.log('Finished processing.');
  return result;
}

const input = [1, 2, 3, 4, 5];
processSubmission(input);
`;

const mockOutput = `
Processing submission data...
Finished processing.
Result: [2, 4, 6, 8, 10]
`;

export function SandboxWorkspacePanel({ submission }: { submission: Submission }) {
  const { toast } = useToast();
  const [code, setCode] = useState(mockCode);
  const [output, setOutput] = useState('');

  const handleRunCode = () => {
    toast({ title: "Running Code (Mock)", description: "Simulating code execution in the sandbox." });
    setTimeout(() => {
        setOutput(mockOutput);
        toast({ title: "Execution Complete" });
    }, 1500);
  };
  
  const handleReset = () => {
    setCode(mockCode);
    setOutput('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Sandbox Workspace
        </CardTitle>
        <CardDescription>
            A secure, isolated environment for code execution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-4">
            <div>
                <h4 className="font-semibold">Session Status</h4>
                <p className="text-sm text-muted-foreground">Current state of the execution environment.</p>
            </div>
            <Badge variant={getStatusVariant(submission.sandboxStatus)} className="text-base capitalize">
                {submission.sandboxStatus || 'Not Started'}
            </Badge>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-center">
            <div className="p-2 rounded-md bg-muted">
                <Cpu className="h-5 w-5 mx-auto text-muted-foreground mb-1"/>
                <p>CPU</p>
                <p className="font-bold">15%</p>
            </div>
             <div className="p-2 rounded-md bg-muted">
                <MemoryStick className="h-5 w-5 mx-auto text-muted-foreground mb-1"/>
                <p>Memory</p>
                <p className="font-bold">256MB / 1GB</p>
            </div>
             <div className="p-2 rounded-md bg-muted">
                <HardDrive className="h-5 w-5 mx-auto text-muted-foreground mb-1"/>
                <p>Storage</p>
                <p className="font-bold">1.2GB / 5GB</p>
            </div>
             <div className="p-2 rounded-md bg-muted">
                <Server className="h-5 w-5 mx-auto text-muted-foreground mb-1"/>
                <p>Network</p>
                <p className="font-bold">2.1 Mbps</p>
            </div>
        </div>

        <div>
            <label className="text-sm font-medium">Mock Code Editor</label>
            <Textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-xs min-h-[200px] bg-muted"
                placeholder="Enter code to execute..."
            />
        </div>

        <div>
            <label className="text-sm font-medium">Output</label>
            <Textarea 
                readOnly
                value={output}
                className="font-mono text-xs min-h-[100px] bg-muted"
                placeholder="Execution output will appear here..."
            />
        </div>

        <div className="flex gap-2">
            <Button onClick={handleRunCode} className="flex-1">
                <Play className="mr-2 h-4 w-4" /> Run
            </Button>
            <Button onClick={handleReset} variant="outline">
                <RotateCw className="mr-2 h-4 w-4" /> Reset
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
