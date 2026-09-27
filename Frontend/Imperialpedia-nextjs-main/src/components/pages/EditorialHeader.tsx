import Link from "next/link";

interface EditorialHeaderProps {
  eyebrow?: { label: string; href: string };
  title: string;
  description: string;
}

/**
 * Imperialpedia Style Category Taxonomy Header:
 * Features slanted crimson red badge, massive bold serif H1 title,
 * and high-contrast red left-bordered editorial description deck.
 */
export default function EditorialHeader({
  eyebrow,
  title,
  description,
}: EditorialHeaderProps) {
  return (
    <header className="pt-10 pb-8 px-4 text-center max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-center gap-2">
        <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-tighter px-3 py-1 -skew-x-12 inline-block shadow-sm">
          IMPERIALPEDIA HUB
        </span>
        {eyebrow && (
          <Link
            href={eyebrow.href}
            className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e] hover:underline"
          >
            // {eyebrow.label.toUpperCase()}
          </Link>
        )}
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black dark:text-white tracking-tighter uppercase font-serif leading-tight">
        {title}
      </h1>

      {description && (
        <div className="mt-6 text-left border-l-6 border-[#c8102e] bg-white dark:bg-slate-900 p-5 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] max-w-3xl mx-auto">
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
            {description}
          </p>
        </div>
      )}
    </header>
  );
}

