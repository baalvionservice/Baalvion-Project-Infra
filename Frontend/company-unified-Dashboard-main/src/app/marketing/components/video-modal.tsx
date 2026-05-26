'use client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface VideoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function VideoModal({ isOpen, onOpenChange }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <div className="aspect-video">
           <iframe 
            className="w-full h-full" 
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
}
