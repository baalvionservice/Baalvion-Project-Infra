// The article body is a small markdown subset — ## headings, **bold**, - bullets, paragraphs.
// A full markdown library is not worth the bundle for content we author ourselves, and a
// dangerouslySetInnerHTML pass over authored text is a habit worth not forming.
export default function Prose({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  const inline = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>);

  return (
    <div className="max-w-2xl">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return <h2 key={i} className="text-xl font-semibold mt-10 mb-3 first:mt-0">{block.slice(3)}</h2>;
        }
        if (block.startsWith("- ")) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 my-4 text-[15px] leading-relaxed text-foreground/90">
              {block.split("\n").map((li, j) => <li key={j}>{inline(li.replace(/^- /, ""))}</li>)}
            </ul>
          );
        }
        return <p key={i} className="text-[15px] leading-relaxed my-4 text-foreground/90">{inline(block)}</p>;
      })}
    </div>
  );
}
