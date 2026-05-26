import { OptimizedImage } from "@/components/common/OptimizedImage";
import { newsGridSections } from "@/lib/data/worldData";

export default function NewsGrid() {
  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-2 sm:px-4">
      {newsGridSections.map((section) => (
        <div key={section.section} className="space-y-3 sm:space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
            {section.section}
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {section.items.map((item) => (
              <article
                key={item.id}
                className="group cursor-pointer border-b border-gray-100 pb-3 sm:pb-4 last:border-b-0"
              >
                {item.image ? (
                  <div className="flex items-start justify-between w-full gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold leading-snug text-gray-900 group-hover:underline mt-0.5 line-clamp-3">
                        {item.headline}
                      </h3>
                      <span className="text-[9px] sm:text-[10px] font-black text-gray-400 tracking-wide mt-1 block">
                        {item.time}
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-sm aspect-square w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex-shrink-0">
                      <OptimizedImage
                        src={item.image}
                        alt={item.headline}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <h3 className="text-sm sm:text-lg font-bold leading-snug text-gray-900 group-hover:underline line-clamp-3">
                      {item.headline}
                    </h3>
                    <span className="text-[9px] sm:text-[10px] font-black text-gray-400 tracking-wide mt-1 block">
                      {item.time}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
