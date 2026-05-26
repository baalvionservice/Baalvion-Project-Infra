import { TextSegment } from "../data/terms";

/**
 * Parses text containing HTML anchor tags and converts them to TextSegment array
 * Example: "Text with <a href='url'>link</a> more text"
 * Returns: [{ type: "text", content: "Text with " }, { type: "link", content: "link", href: "url" }, { type: "text", content: " more text" }]
 */
export function parseLinksInText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const linkRegex = /<a\s+href=['"]([^'"]*)['"]\s*>([^<]*)<\/a>/gi;

  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) {
        segments.push({ type: "text", content: beforeText });
      }
    }

    // Add the link
    segments.push({
      type: "link",
      content: match[2], // Link text
      href: match[1].startsWith("http") ? match[1] : `https://${match[1]}`, // Ensure proper URL format
    });

    lastIndex = linkRegex.lastIndex;
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      segments.push({ type: "text", content: remainingText });
    }
  }

  // If no links found, return the original text as a single segment
  if (segments.length === 0) {
    segments.push({ type: "text", content: text });
  }

  return segments;
}
