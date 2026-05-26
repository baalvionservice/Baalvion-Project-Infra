'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BellPlus } from 'lucide-react';

export default function PushNotificationPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const preference = localStorage.getItem('notification_prompt');
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (preference === 'never' || Notification.permission !== 'default') {
                setIsVisible(false);
            } else {
                // Show after a small delay
                setTimeout(() => setIsVisible(true), 2000);
            }
        }
    }, []);

    const handleEnable = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const permission = await Notification.requestPermission();
            setIsVisible(false);
            if (permission === 'granted') {
                toast({
                    title: 'Notifications Enabled!',
                    description: "You'll now get alerts for critical events."
                });
            } else {
                 toast({
                    title: 'Notifications Blocked',
                    description: "You can enable them from your browser settings later.",
                    variant: 'destructive'
                });
            }
        }
    };
    
    const handleNotNow = () => {
        setIsVisible(false);
    };

    const handleNever = () => {
        localStorage.setItem('notification_prompt', 'never');
        setIsVisible(false);
    };
    
    if (!isVisible) {
        return null;
    }
    
    return (
        <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BellPlus />
                    Get Real-Time Alerts
                </CardTitle>
                <CardDescription>
                    Enable push notifications to get instant alerts when revenue drops or critical tasks need your attention.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Button onClick={handleEnable}>Enable Notifications</Button>
                    <Button variant="ghost" onClick={handleNotNow}>Not Now</Button>
                    <Button variant="link" className="text-muted-foreground" onClick={handleNever}>Never Ask Again</Button>
                </div>
            </CardContent>
        </Card>
    );
}
