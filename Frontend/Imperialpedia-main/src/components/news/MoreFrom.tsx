import Image from "next/image";
import Link from "next/link";

/**
 * The "MORE FROM …" blocks that close a Imperialpedia article, rebuilt from measurements
 * of the live page rather than by eye:
 *
 *   gold rule      rgb(252,183,0), 110 x 7px, sitting on top of the heading
 *   section head   40px / weight 900 / rgb(0,47,108)
 *   grid           one lead card beside a secondary, then a three-across row
 *   byline         small, in the same navy, under each headline
 *
 * Deliberately no "FROM THE WEB" equivalent. That block on Imperialpedia is paid
 * placement — chumbox ads dressed as editorial — and the instruction here was to
 * leave sponsored content out.
 */

export interface MoreFromItem {
  title: string;
  href: string;
  image?: string | null;
  byline?: string | null;
  eyebrow?: string | null;
}

const NAVY = "text-[#002f6c]";

/** Gold rule + heading. Shared by every block so they cannot drift apart. */
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="h-[7px] w-[110px] bg-[#fcb700]" />
      <h2
        className={`!font-news ${NAVY} mt-4 text-[1.75rem] sm:text-[2.5rem] font-black leading-[1.2] tracking-tight uppercase`}
      >
        {children}
      </h2>
    </div>
  );
}

function Card({
  item,
  size = "sm",
}: {
  item: MoreFromItem;
  /** lead = the wide opener, md = the column beside it, sm = the bottom row. */
  size?: "lead" | "md" | "sm";
}) {
  const titleSize =
    size === "lead" ? "text-[1.5rem] sm:text-[1.75rem]" : size === "md" ? "text-[1.25rem]" : "text-[1.0625rem]";

  return (
    <article className="group">
      <Link href={item.href} className="block">
        {item.image && (
          <div
            className={`relative w-full overflow-hidden bg-gray-100 ${
              size === "lead" ? "aspect-[16/9]" : "aspect-[16/10]"
            }`}
          >
            <Image
              src={item.image}
              alt=""
              fill
              className="object-cover transition-opacity group-hover:opacity-90"
              sizes={size === "lead" ? "(max-width: 768px) 100vw, 620px" : "(max-width: 768px) 100vw, 320px"}
            />
          </div>
        )}
        <h3
          className={`!font-news mt-3 font-bold leading-[1.22] text-[#111] group-hover:underline ${titleSize}`}
        >
          {item.title}
        </h3>
      </Link>
      {item.byline && (
        <p className={`!font-news mt-2 text-[0.8125rem] font-semibold ${NAVY}`}>{item.byline}</p>
      )}
    </article>
  );
}

/**
 * The image grid: a lead card and a secondary side by side, then the rest three
 * across. Falls back gracefully — with two items it is simply two cards, and
 * with none the section does not render at all rather than showing an empty rule.
 */
export function MoreFromGrid({ title, items }: { title: string; items: MoreFromItem[] }) {
  if (!items.length) return null;
  const [lead, second, ...rest] = items;

  return (
    <section className="mt-14 border-t border-gray-200 pt-10">
      <SectionHead>{title}</SectionHead>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card item={lead} size="lead" />
        </div>
        {second && <Card item={second} size="md" />}
      </div>

      {rest.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, 3).map((item) => (
            <Card key={item.href} item={item} size="sm" />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The headline-only list Imperialpedia runs beside the article — no images, dotted rules
 * between rows.
 */
export function MoreFromList({ title, items }: { title: string; items: MoreFromItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className={`!font-news ${NAVY} mb-4 text-[1.0625rem] font-black uppercase tracking-tight`}>
        {title}
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.href} className="border-b border-dotted border-gray-300 last:border-0">
            <Link
              href={item.href}
              className="!font-news block py-3.5 text-[1.0625rem] font-bold leading-[1.3] text-[#111] hover:underline"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
