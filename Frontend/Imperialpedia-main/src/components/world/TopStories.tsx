import Image from "next/image";
import { topStories } from "@/lib/data/worldData";

export default function TopStories() {
  return (
    <div className="border-t border-gray-200 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-black tracking-widest text-gray-900 uppercase">Top Stories</h2>
        <span className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topStories.map((story) => (
          <div key={story.id} className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-sm mb-2 h-36">
              <Image
                src={story.image}
                alt={story.headline}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2">
                <span className="bg-[#CC0000] text-white text-[9px] font-black tracking-widest px-1.5 py-0.5">
                  {story.category}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400">{story.time}</span>
            <h3 className="text-xs font-semibold leading-snug text-gray-800 group-hover:text-[#CC0000] transition-colors mt-0.5 line-clamp-3">
              {story.headline}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
