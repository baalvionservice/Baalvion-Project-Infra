"use client";

import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { addMockEvent } from "@/lib/events";
import { cn } from "@/lib/utils";
import { ZoomIn, Calendar as CalendarIcon, Clock } from "lucide-react";

type MeetingSchedulerModalProps = {
  closeModal: () => void;
};

export default function MeetingSchedulerModal({ closeModal }: MeetingSchedulerModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { toast } = useToast();
  
  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];

  const handleSchedule = () => {
    if (!date || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Incomplete Selection",
        description: "Please select a date and time for the meeting.",
      });
      return;
    }
    
    addMockEvent({
        user: 'Investor',
        action: `Scheduled meeting for ${date.toLocaleDateString()} at ${selectedTime}`,
        phase: 'P1',
    });

    toast({
      title: "Meeting Scheduled",
      description: `Your meeting is confirmed for ${date.toLocaleDateString()} at ${selectedTime}.`,
    });

    closeModal();
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Schedule a Meeting</DialogTitle>
        <DialogDescription>
          Select a date and time to speak with our investor relations team.
        </DialogDescription>
      </DialogHeader>
      <div className="grid md:grid-cols-2 gap-8 py-4">
        <div className="flex justify-center">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(date) => date < new Date() }
            />
        </div>
        <div className="space-y-4">
            <h4 className="font-semibold text-center md:text-left">Available Time Slots</h4>
            <div className="grid grid-cols-2 gap-2">
                {timeSlots.map(time => (
                    <Button 
                        key={time}
                        variant="outline"
                        className={cn(selectedTime === time && "bg-primary text-primary-foreground")}
                        onClick={() => setSelectedTime(time)}
                    >
                       <Clock className="mr-2 h-4 w-4" /> {time}
                    </Button>
                ))}
            </div>
             <div className="text-sm text-muted-foreground pt-4 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                   <CalendarIcon className="h-4 w-4"/> An invitation will be sent to your registered email address.
                </div>
                <div className="flex items-center gap-2">
                    <ZoomIn className="h-4 w-4"/> Meetings will be held via Zoom.
                </div>
            </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={closeModal}>Cancel</Button>
        <Button onClick={handleSchedule} disabled={!date || !selectedTime}>Confirm Schedule</Button>
      </DialogFooter>
    </DialogContent>
  );
}
