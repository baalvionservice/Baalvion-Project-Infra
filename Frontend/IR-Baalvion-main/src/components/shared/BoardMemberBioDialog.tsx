"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { boardOfDirectors } from '@/lib/data';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

type BoardMember = (typeof boardOfDirectors)[0];

type BoardMemberBioDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    member: BoardMember | null;
};

export default function BoardMemberBioDialog({ isOpen, onOpenChange, member }: BoardMemberBioDialogProps) {
    if (!member) {
        return null;
    }
    const memberImage = PlaceHolderImages.find((p) => p.id === member.imageId);
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl bg-white text-black p-10 rounded-lg">
                <div className="flex flex-col items-center text-center gap-6">
                    {memberImage && (
                        <Image
                            src={memberImage.imageUrl}
                            alt={`Photo of ${member.name}`}
                            data-ai-hint={memberImage.imageHint}
                            width={200}
                            height={200}
                            className="size-40 rounded-full object-cover mb-4"
                        />
                    )}
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-3xl font-bold">{member.name}</DialogTitle>
                        <p className="text-base text-gray-600 pt-1">
                            {member.title}
                        </p>
                    </DialogHeader>
                    <p className="text-sm text-gray-700 max-w-2xl mx-auto text-left leading-relaxed">
                        {member.bio}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
