import type { Block } from '@/content/guides';

/**
 * The article renderer.
 *
 * Guides are structured blocks rather than a string of HTML, so there is no
 * `dangerouslySetInnerHTML` anywhere on a public reading page and no markdown pipeline to
 * keep patched. Adding a new kind of block means adding a case here, which is the point:
 * the set of things a guide can do stays small and reviewable.
 */
export function GuideBody({ blocks }: { blocks: Block[] }) {
    return (
        <div className="space-y-6">
            {blocks.map((b, i) => {
                switch (b.t) {
                    case 'h':
                        return (
                            <h2 key={i} className="heading pt-4 text-2xl tracking-[-0.01em]">
                                {b.text}
                            </h2>
                        );

                    case 'p':
                        return (
                            <p key={i} className="text-lg leading-[1.75] text-muted">
                                {b.text}
                            </p>
                        );

                    case 'ul':
                        return (
                            <ul key={i} className="space-y-3">
                                {b.items.map((item) => (
                                    <li key={item} className="flex gap-3 text-lg leading-[1.7] text-muted">
                                        <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        );

                    case 'steps':
                        return (
                            <ol key={i} className="space-y-4">
                                {b.items.map((item, n) => (
                                    <li key={item.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                                        <span
                                            aria-hidden="true"
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marigold font-display font-semibold text-white"
                                        >
                                            {n + 1}
                                        </span>
                                        <div>
                                            <h3 className="heading text-base">
                                                <span className="sr-only">Step {n + 1}: </span>
                                                {item.title}
                                            </h3>
                                            <p className="mt-1.5 leading-relaxed text-muted">{item.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        );

                    case 'note':
                        return (
                            <aside
                                key={i}
                                className={
                                    b.tone === 'warn'
                                        ? 'rounded-2xl border-l-4 border-rose bg-rose-soft p-6'
                                        : 'rounded-2xl border border-line bg-surface-2 p-6'
                                }
                            >
                                {b.title && <p className="heading text-base">{b.title}</p>}
                                <p className={b.title ? 'mt-2 leading-relaxed text-muted' : 'leading-relaxed text-muted'}>{b.text}</p>
                            </aside>
                        );

                    case 'sources':
                        return (
                            <div key={i} className="border-t border-line pt-6">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-2">Sources</h2>
                                <ul className="mt-3 space-y-1.5">
                                    {b.items.map((s) => (
                                        <li key={s} className="text-sm text-muted">
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                }
            })}
        </div>
    );
}
