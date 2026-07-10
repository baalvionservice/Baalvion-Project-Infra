export interface TocEntry {
  id: string;
  text: string;
}

export function Toc({ items }: { items: TocEntry[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page" className="sticky top-24 hidden max-h-[calc(100vh-8rem)] w-56 shrink-0 overflow-y-auto nav-scroll xl:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">On this page</p>
      <ul className="flex flex-col gap-2 border-l border-line pl-4 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-muted transition hover:text-foreground">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
