import type { Metadata } from 'next';
import Link from 'next/link';
import { leadershipTeam, globalLeaders, VicePersidents } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { slugify } from '@/utils/slug-generator';

export const metadata: Metadata = {
  title: 'Global Leadership | Executive Committee',
  description: 'Meet the executive leadership team driving Baalvion’s vision for the future of global B2B trade infrastructure.',
};

export default function LeadershipPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-sm font-bold text-primary tracking-[0.2em] mb-4 uppercase">About Us</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Global Executive Committee</h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl">
              Strategic execution at scale, led by a committee of industry pioneers in technology, finance, and logistics.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white text-black">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-16 mb-12 ">
            {leadershipTeam.map((member) => {
              const img = PlaceHolderImages.find(p => p.id === member.imageId);
              return (
                <Link href={`/governance/leadership/${slugify(member.name)}` || ''} key={member.name} className="group space-y-2">
                  <div className="aspect-square w-full rounded-xl bg-gray-100 mb-4 overflow-hidden transition-all duration-500">
                    {img && (
                      <Image
                        src={img.imageUrl}
                        alt={`Photo of ${member.name}`}
                        data-ai-hint={img.imageHint}
                        width={320}
                        height={320}
                        className="h-full w-full object-cover object-top scale-100  transition-transform duration-700"
                      />
                    )}
                  </div>
                  <h4 className="text-[17px] font-medium group-hover:underline  leading-tight text-blue-500">{member.name}</h4>
                  <p className="text-[12px] text-black uppercase font-medium tracking-wide">{member.title}</p>

                </Link>
              );
            })}
          </div>

          <div className="border-t border-gray-200  pt-20 mb-12">
            <h2 className="text-2xl font-bold mb-12 uppercase tracking-widest text-gray-400 text-center">
              Global Functional Leadership
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
              {globalLeaders.map((member) => {

                const img = PlaceHolderImages.find(p => p.id === member.imageId);
                return (
                  <Link href={`/governance/leadership/${slugify(member.name)}` || ''} key={member.name} className="group space-y-2 cursor-pointer">
                    <div className="aspect-square w-full rounded-xl bg-gray-100 mb-4 overflow-hidden transition-all duration-500">
                      {img && (
                        <Image
                          src={img.imageUrl}
                          alt={`Photo of ${member.name}`}
                          data-ai-hint={img.imageHint}
                          width={320}
                          height={320}
                          className="h-full w-full object-top object-cover scale-100  transition-transform duration-700"
                        />
                      )}
                    </div>
                    <h4 className="text-[17px] font-medium group-hover:underline  leading-snug text-blue-500">{member.name}</h4>
                    <p className="text-[12px] text-black uppercase font-medium tracking-wide">{member.title}</p>

                  </Link>
                )
              })}
            </div>
          </div>



          <div className="border-t border-gray-200 pt-20 mb-12">
            <h2 className="text-2xl font-bold mb-12 uppercase tracking-widest text-gray-400 text-center">
              Our VicePresidents
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
              {VicePersidents.map((member) => {

                const img = PlaceHolderImages.find(p => p.id === member.imageId);
                return (
                  <Link href={`/governance/leadership/${slugify(member.name)}` || ''} key={member.name} className="group space-y-2">
                    <div className="aspect-square w-full rounded-xl bg-gray-100 mb-4 overflow-hidden transition-all duration-500">
                      {img && (
                        <Image
                          src={img.imageUrl}
                          alt={`Photo of ${member.name}`}
                          data-ai-hint={img.imageHint}
                          width={320}
                          height={320}
                          className="h-full w-full object-top object-cover scale-100  transition-transform duration-700"
                        />
                      )}
                    </div>
                    <h4 className="text-[17px] font-medium group-hover:underline  leading-snug text-blue-500">{member.name}</h4>
                    <p className="text-[12px] text-black uppercase font-medium tracking-wide">{member.title}</p>
                    {member.position && <p className="text-[12px] text-black uppercase font-medium tracking-wide">{member.position}</p>}

                  </Link>
                )
              })}
            </div>
          </div>



          <div className="mt-24 p-12 bg-gray-50 text-center">
            <h3 className="text-xl font-bold mb-4 italic">"Leadership is the capacity to translate vision into reality."</h3>
            <p className="text-gray-500 text-sm">— Baalvion Operational Excellence Charter</p>
          </div>
        </div>
      </section >
    </div >
  );
}



