import Link from "next/link";

interface EditorialHeaderProps {
  eyebrow?: { label: string; href: string };
  title: string;
  description: string;
}

/**
 * Exact Investopedia Taxonomy Header (matching screenshot 4):
 * Centered layout with blue uppercase category eyebrow,
 * bold authoritative title, and lead summary paragraph.
 */
export default function EditorialHeader({
  eyebrow,
  title,
  description,
}: EditorialHeaderProps) {
  return (
    <header className="pt-10 pb-8 px-4 text-center max-w-4xl mx-auto space-y-3">
      {eyebrow && (
        <div>
          <Link
            href={eyebrow.href}
            className="text-xs font-bold uppercase tracking-widest text-[#1d4fc4] hover:underline"
          >
            {eyebrow.label}
          </Link>
        </div>
      )}

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
        {title}
      </h1>

      {description && (
        <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </header>
  );
}
