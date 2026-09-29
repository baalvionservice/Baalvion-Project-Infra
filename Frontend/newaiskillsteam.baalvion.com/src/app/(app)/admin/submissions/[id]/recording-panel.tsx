
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
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Rewind, FastForward, Volume2, Maximize, Video } from 'lucide-react';
import type { Submission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type RecordingStatus = 'Recording' | 'Paused' | 'Completed' | 'Not Started';

const getStatusVariant = (status?: RecordingStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Recording': return 'default';
        case 'Paused': return 'warning';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

export function RecordingPanel({ submission }: { submission: Submission }) {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(30); // in seconds, mock
  const totalTime = 120; // in seconds, mock

  const handlePlayPause = () => {
    if (submission.recordingStatus !== 'Completed') {
        toast({ title: 'Recording not available', description: 'This session has not been completed yet.', variant: 'destructive'});
        return;
    }
    setIsPlaying(!isPlaying);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Session Recording
        </CardTitle>
        <CardDescription>
            A mock playback of the candidate's session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-4">
            <div>
                <h4 className="font-semibold">Recording Status</h4>
            </div>
            <Badge variant={getStatusVariant(submission.recordingStatus)} className="text-base capitalize">
                {submission.recordingStatus || 'Not Started'}
            </Badge>
        </div>

        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <Video className="h-16 w-16 text-muted-foreground" />
        </div>

        <div className="space-y-2">
            <Slider
                value={[playbackTime]}
                max={totalTime}
                step={1}
                onValueChange={(value) => setPlaybackTime(value[0])}
                disabled={submission.recordingStatus !== 'Completed'}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{new Date(playbackTime * 1000).toISOString().substr(14, 5)}</span>
                <span>{new Date(totalTime * 1000).toISOString().substr(14, 5)}</span>
            </div>
        </div>
        
        <div className="flex justify-between items-center">
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" disabled={submission.recordingStatus !== 'Completed'}><Rewind /></Button>
                <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={submission.recordingStatus !== 'Completed'}>
                    {isPlaying ? <Pause /> : <Play />}
                </Button>
                <Button variant="ghost" size="icon" disabled={submission.recordingStatus !== 'Completed'}><FastForward /></Button>
            </div>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" size="icon" disabled={submission.recordingStatus !== 'Completed'}><Volume2 /></Button>
                 <Button variant="ghost" size="icon" disabled={submission.recordingStatus !== 'Completed'}><Maximize /></Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
