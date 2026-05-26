import { Accordion } from "@/app/terms/[letter]/[slug]/components/AccordationComponent";
import { ExpandableText } from "@/app/terms/[letter]/[slug]/components/ExpandableParagraph";
import { TermsBodyBlock } from "@/lib/data/terms";
import { slugify } from "@/modules/content-engine/utils/slugify";
import { Zap } from "lucide-react";
import Image from "next/image";

export default function BodyBlock({ block }: { block: TermsBodyBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <div className="text-foreground text-[1.0625rem] leading-[1.85] mb-5">
          {block.content.map((seg, i) => {
            switch (seg.type) {
              case "text":
                return <span key={i}>{seg.content}</span>;
              case "link":
                return (
                  <a
                    key={i}
                    href={seg.href}
                    className="text-primary underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {seg.content}
                  </a>
                );
              case "list":
                return (
                  <ol
                    key={i}
                    className="list-decimal list-inside space-y-1 my-2"
                  >
                    {seg.content.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        {item.type === "text" ? (
                          item.content
                        ) : (
                          <a
                            href={item.href}
                            className="text-primary underline hover:no-underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.content}
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                );
              default:
                return null;
            }
          })}
        </div>
      );
    case "accordion":
      return <Accordion title={block.title} children={block.content} />;

    case "expandable":
      return <ExpandableText content={block.content} />;

    case "heading":
      return (
        <h2
          id={slugify(block.id)}
          className="text-foreground text-2xl font-bold mt-12 mb-4 leading-snug"
        >
          {block.text}
        </h2>
      );

    case "subheading":
      return (
        <h3 className="text-foreground text-lg font-semibold mt-7 mb-3 leading-snug">
          {block.text}
        </h3>
      );

    case "quote":
      return (
        <blockquote className="my-8 pl-6 border-l-4 border-foreground">
          <p className="text-foreground text-xl font-medium leading-relaxed italic mb-2">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.attribution && (
            <footer className="text-sm text-muted-foreground not-italic font-medium">
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      );

    case "callout":
      return (
        <div className="my-7 space-y-3 rounded-md bg-white dark:bg-black border border-border px-6 py-5">
          <div>
            <span className="flex gap-3">
              <Zap fill="yellow" />
              IMPORTANT
            </span>
          </div>
          <div>
            {block.content.map((seg, i) => {
              switch (seg.type) {
                case "text":
                  return <span key={i}>{seg.content}</span>;
                case "link":
                  return (
                    <a
                      key={i}
                      href={seg.href}
                      className="text-primary underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {seg.content}
                    </a>
                  );
                case "list":
                  return (
                    <ol
                      key={i}
                      className="list-decimal list-inside space-y-1 my-2"
                    >
                      {seg.content.map((item, itemIndex) => (
                        <li key={itemIndex}>
                          {item.type === "text" ? (
                            item.content
                          ) : (
                            <a
                              href={item.href}
                              className="text-primary underline hover:no-underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.content}
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>
      );

    case "list":
      return (
        <ul className="my-5 space-y-2 pl-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-foreground text-[1.0625rem] leading-relaxed"
            >
              <span className="mt-[0.4rem] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              {item}
            </li>
          ))}
        </ul>
      );

    case "image":
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={block.url}
              alt={block.caption ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-xs text-muted-foreground text-center leading-relaxed">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}
