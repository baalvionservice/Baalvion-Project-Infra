import type { FeaturedStory } from "@/lib/data/worldRegions";
import { OptimizedImage } from "@/components/common/OptimizedImage";

export default function HeroFeatured({ featured }: { featured: FeaturedStory[] }) {
  const [main, ...secondary] = featured;

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-px bg-border border-b border-border">
      {/* Main hero story */}
      <div className="md:col-span-2 bg-card group cursor-pointer">
        <div className="relative overflow-hidden h-[230px] sm:h-[300px] md:h-[340px] lg:h-[420px]">
          <OptimizedImage
            src={main.image}
            alt={main.headline}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 800px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-3 sm:p-5 text-white">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {main.tag && (
                <span className="world-kicker bg-[hsl(var(--cnbc-red))] text-white text-[9px] sm:text-[10px] font-black tracking-widest px-1.5 sm:px-2 py-0.5">
                  {main.tag}
                </span>
              )}
              <span className="world-kicker text-[10px] sm:text-[11px] font-bold text-[hsl(var(--cnbc-gold))] tracking-widest uppercase">
                {main.category}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight text-white mb-2 max-w-xl">
              {main.headline}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-lg hidden sm:block">
              {main.summary}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[10px] sm:text-xs text-muted-foreground">
              <span>{main.author}</span>
              <span>•</span>
              <span>{main.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stories - Stack on mobile */}
      <div className="bg-card divide-y divide-border">
        {secondary.map((story) => (
          <div
            key={story.id}
            className="group cursor-pointer p-3 sm:p-4 hover:bg-muted transition-colors"
          >
            <span className="world-kicker text-[9px] sm:text-[10px] font-black tracking-widest text-[hsl(var(--cnbc-red))] uppercase">
              {story.category}
            </span>
            <h3 className="text-xs sm:text-sm font-semibold leading-snug mt-1 text-foreground group-hover:text-[hsl(var(--cnbc-red))] transition-colors line-clamp-3">
              {story.headline}
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 line-clamp-2 hidden sm:block">
              {story.summary}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-[11px] text-muted-foreground">
              <span className="truncate">{story.author}</span>
              <span>•</span>
              <span>{story.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
