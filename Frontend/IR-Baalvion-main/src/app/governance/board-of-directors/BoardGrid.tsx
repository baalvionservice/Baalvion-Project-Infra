"use client";

import { useState } from 'react';
import Image from 'next/image';
import BoardMemberBioDialog from '@/components/shared/BoardMemberBioDialog';
import type { LeadershipMember } from '@/lib/cms';

export default function BoardGrid({ members }: { members: LeadershipMember[] }) {
  const [selectedMember, setSelectedMember] = useState<LeadershipMember | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16 max-w-7xl mx-auto">
        {members.map((member) => (
          <div
            key={member.slug}
            className="text-center flex flex-col items-center cursor-pointer group"
            onClick={() => setSelectedMember(member)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? setSelectedMember(member) : undefined)}
            aria-label={`View bio for ${member.name}`}
          >
            {member.imageUrl && (
              <Image
                src={member.imageUrl}
                alt={`Photo of ${member.name}`}
                width={120}
                height={120}
                className="size-32 rounded-full object-cover mb-4"
              />
            )}
            <p className="text-base font-semibold text-black">{member.name}</p>
            <p className="text-sm text-gray-600 mt-1">{member.title}</p>
          </div>
        ))}
      </div>
      <BoardMemberBioDialog
        isOpen={!!selectedMember}
        onOpenChange={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </>
  );
}
