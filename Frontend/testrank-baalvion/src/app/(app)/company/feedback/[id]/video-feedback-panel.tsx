
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Video, Mic, StopCircle, Radio, Download, UploadCloud, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type RecordingStatus = 'idle' | 'recording' | 'recorded' | 'uploading';

export function VideoFeedbackPanel() {
    const { toast } = useToast();
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        return () => {
            // Cleanup stream on component unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const getPermissionsAndStream = async () => {
        if (stream) return stream;
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            return mediaStream;
        } catch (error) {
            console.error("Error accessing media devices.", error);
            toast({
                title: "Permissions Denied",
                description: "Camera and microphone access is required to record video feedback.",
                variant: "destructive",
            });
            return null;
        }
    };
    
    const startRecording = async () => {
        const mediaStream = await getPermissionsAndStream();
        if (!mediaStream) return;

        setRecordedBlob(null);
        chunksRef.current = [];
        const options = { mimeType: 'video/webm; codecs=vp8,opus' };
        const mediaRecorder = new MediaRecorder(mediaStream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setRecordedBlob(blob);
            setStatus('recorded');
            toast({ title: "Recording finished", description: "You can now review and upload your video." });
            // Stop the camera/mic tracks
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setStream(null);
        };

        mediaRecorder.start();
        setStatus('recording');
        toast({ title: "Recording started..." });
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleUpload = async () => {
        if (!recordedBlob) return;

        setStatus('uploading');
        toast({ title: "Uploading video...", description: "This is a mock upload and will complete shortly." });

        const formData = new FormData();
        formData.append('file', recordedBlob, 'session-recording.webm');
        
        // Mocking the fetch call
        console.log("Mock upload started with FormData:", formData.get('file'));
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock server response
        const mockResponse = {
            success: true,
            url: `/uploads/session-recording-${Date.now()}.webm`,
        };
        console.log("Mock upload complete:", mockResponse);
        
        setStatus('idle');
        setRecordedBlob(null);
        toast({ title: "Upload complete!", description: "Your video feedback has been saved." });
    };
    
    const handleReset = () => {
        setRecordedBlob(null);
        setStatus('idle');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Video Feedback</CardTitle>
                <CardDescription>Record a video message to provide more personal and detailed feedback to the candidate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                    {status === 'idle' && !stream && <p className="text-sm text-muted-foreground">Camera is off</p>}
                    {status === 'recording' && (
                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs">
                            <Radio className="h-3 w-3 animate-pulse" />
                            REC
                        </div>
                    )}
                </div>

                <div className="flex justify-center gap-4">
                    {status === 'idle' && (
                        <Button onClick={startRecording} size="lg">
                            <Mic className="mr-2 h-4 w-4"/> Start Recording
                        </Button>
                    )}
                    {status === 'recording' && (
                        <Button onClick={stopRecording} size="lg" variant="destructive">
                            <StopCircle className="mr-2 h-4 w-4"/> Stop Recording
                        </Button>
                    )}
                     {status === 'recorded' && recordedBlob && (
                         <div className="w-full space-y-2">
                             <video src={URL.createObjectURL(recordedBlob)} controls className="w-full rounded-md"/>
                             <div className="flex gap-2">
                                 <Button onClick={handleUpload} className="w-full">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Video
                                </Button>
                                <Button variant="outline" onClick={handleReset} className="w-full">
                                    Record Again
                                </Button>
                                 <Button asChild variant="secondary" className="w-full">
                                     <a href={URL.createObjectURL(recordedBlob)} download="feedback.webm">
                                        <Download className="mr-2 h-4 w-4"/> Download
                                     </a>
                                </Button>
                             </div>
                         </div>
                     )}
                     {status === 'uploading' && (
                         <Button disabled size="lg">
                             <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Uploading...
                         </Button>
                     )}
                </div>
            </CardContent>
        </Card>
    )
}
