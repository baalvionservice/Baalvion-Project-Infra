import Image from 'next/image';
import type { Category, Guide } from '@/content/guides';
import { cn } from '@/components/ui/cn';

/**
 * Each category gets its own colour, and the colours are the warm set rather than the
 * product accent: these are reading pages, and the teal that keeps case screens calm makes
 * an article index look like a settings menu.
 */
const TONE: Record<Category, { chip: string; wash: string }> = {
    Law: { chip: 'bg-saffron text-white', wash: 'from-saffron to-marigold' },
    Safety: { chip: 'bg-rose-deep text-white', wash: 'from-rose-deep to-rose' },
    Family: { chip: 'bg-rose text-white', wash: 'from-rose to-marigold' },
    // The one deliberately cool card in the set. Money is the practical, unromantic corner of
    // this subject, and the product accent is the right register for it.
    Money: { chip: 'bg-accent text-on-accent', wash: 'from-accent to-accent-strong' },
    Community: { chip: 'bg-marigold text-white', wash: 'from-marigold to-saffron' },
};

export function CategoryChip({ category }: { category: Category }) {
    return (
        <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', TONE[category].chip)}>
            {category}
        </span>
    );
}

/**
 * A guide's picture — or, where no photograph is honestly apt, a typographic tile.
 *
 * The alternative was to put a stock image on every guide for the sake of a tidy grid, which
 * on the page about being threatened or reported missing would have meant decorating it with
 * a wedding. A coloured tile says nothing untrue.
 */
export function GuideVisual({ guide, sizes, priority = false, className }: {
    guide: Guide;
    sizes: string;
    priority?: boolean;
    className?: string;
}) {
    if (guide.image) {
        return (
            <div className={cn('relative overflow-hidden bg-surface-2', className)}>
                <Image src={guide.image.src} alt={guide.image.alt} fill sizes={sizes} priority={priority} className="object-cover" />
            </div>
        );
    }
    return (
        <div
            aria-hidden="true"
            className={cn('relative overflow-hidden bg-gradient-to-br', TONE[guide.category].wash, className)}
        >
            <span className="absolute bottom-4 left-5 font-display text-3xl font-semibold text-white/85 sm:text-4xl">
                {guide.category}
            </span>
        </div>
    );
}
