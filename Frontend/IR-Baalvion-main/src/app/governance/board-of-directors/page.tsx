"use client";

import { useState } from 'react';
import Link from 'next/link';
import { boardOfDirectors } from '@/lib/data';
import BoardMemberBioDialog from '@/components/shared/BoardMemberBioDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

type BoardMember = (typeof boardOfDirectors)[0];

export default function BoardOfDirectorsPage() {
    const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);

    return (
        <>
            <section className="bg-black text-white py-12 md:py-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm font-bold text-primary tracking-widest mb-2">GOVERNANCE</p>
                    <h1 className="text-4xl md:text-5xl font-bold">Board of Directors</h1>
                </div>
            </section>
            <section className="py-16 md:py-24 bg-white text-black">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Link href="#" className="text-sm text-gray-600 hover:underline">
                            Click here to read about Baalvion's approach to Board diversity
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16 max-w-7xl mx-auto">
                        {boardOfDirectors.map((member) => {
                            const memberImage = PlaceHolderImages.find((p) => p.id === member.imageId);

                            return (

                                <div
                                    key={member.name}
                                    className="text-center flex flex-col items-center cursor-pointer group"
                                    onClick={() => setSelectedMember(member)}
                                >
                                    {memberImage && (
                                        <Image
                                            src={memberImage.imageUrl}
                                            alt={`Photo of ${member.name}`}
                                            data-ai-hint={memberImage.imageHint}
                                            width={120}
                                            height={120}
                                            className="size-32 rounded-full object-cover mb-4"
                                        />
                                    )}
                                    <p className="text-sm text-gray-600 mt-1">{member.title}</p>
                                </div>
                            )
                        })}


                    </div>
                </div>
            </section>
            <BoardMemberBioDialog
                isOpen={!!selectedMember}
                onOpenChange={() => setSelectedMember(null)}
                member={selectedMember}
            />
        </>
    );
}
