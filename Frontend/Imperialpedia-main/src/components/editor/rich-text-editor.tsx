"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { LinkIcon, Trash2 } from "lucide-react";
import { TextSegment } from "@/lib/data/terms";

interface RichTextEditorProps {
  content: TextSegment[];
  onChange: (content: TextSegment[]) => void;
  placeholder?: string;
  rows?: number;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Enter text...",
  rows = 3,
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [textValue, setTextValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert TextSegment[] to plain text
  const segmentsToText = (segments: TextSegment[]): string => {
    return segments.map((segment) => segment.content).join("");
  };

  // Initialize text value from content
  useEffect(() => {
    setTextValue(segmentsToText(content));
  }, []);

  // Convert plain text to TextSegment[] preserving existing links
  const textToSegments = (text: string): TextSegment[] => {
    if (!text.trim()) return [{ type: "text", content: "" }];

    // Get current links and their positions in the original text
    const currentText = segmentsToText(content);
    const links: Array<{ start: number; end: number; segment: TextSegment }> =
      [];

    let pos = 0;
    content.forEach((segment) => {
      if (segment.type === "link") {
        const start = pos;
        const end = pos + segment.content.length;
        links.push({ start, end, segment });
      }
      pos += segment.content.length;
    });

    // If the text hasn't changed much, preserve links
    if (Math.abs(text.length - currentText.length) <= 10) {
      const segments: TextSegment[] = [];
      let currentPos = 0;

      // Sort links by position
      const sortedLinks = links.sort((a, b) => a.start - b.start);

      for (const link of sortedLinks) {
        // Check if link still exists at expected position
        if (link.start < text.length && link.end <= text.length) {
          const textAtPosition = text.substring(link.start, link.end);

          if (textAtPosition === link.segment.content) {
            // Add text before link
            if (currentPos < link.start) {
              const beforeText = text.substring(currentPos, link.start);
              if (beforeText) {
                segments.push({ type: "text", content: beforeText });
              }
            }

            // Add the preserved link
            segments.push(link.segment);
            currentPos = link.end;
          }
        }
      }

      // Add remaining text
      if (currentPos < text.length) {
        const remainingText = text.substring(currentPos);
        if (remainingText) {
          segments.push({ type: "text", content: remainingText });
        }
      }

      // If we successfully preserved structure, return it
      if (segments.length > 0) {
        return segments;
      }
    }

    // Fallback: return as plain text
    return [{ type: "text", content: text }];
  };

  const handleTextChange = (newText: string) => {
    setTextValue(newText);
    const segments = textToSegments(newText);
    onChange(segments);
  };

  const handleTextSelection = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = textValue.substring(start, end);

    if (selected.trim()) {
      // Check if selection overlaps with existing links
      let pos = 0;
      let overlaps = false;

      for (const segment of content) {
        if (segment.type === "link") {
          const linkStart = pos;
          const linkEnd = pos + segment.content.length;

          if (
            (start >= linkStart && start < linkEnd) ||
            (end > linkStart && end <= linkEnd) ||
            (start <= linkStart && end >= linkEnd)
          ) {
            overlaps = true;
            break;
          }
        }
        pos += segment.content.length;
      }

      if (overlaps) {
        alert("Cannot add link: selection overlaps with existing link");
        return;
      }

      setSelectionStart(start);
      setSelectionEnd(end);
      setLinkText(selected);
      setLinkUrl("");
      setShowLinkDialog(true);
    }
  };

  const addLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) return;

    // Work with current content segments instead of starting from scratch
    const newSegments: TextSegment[] = [];
    let currentPos = 0;
    let linkAdded = false;

    // Process each existing segment
    for (const segment of content) {
      // Skip list segments as they have different content structure
      if (segment.type === "list") {
        newSegments.push(segment);
        continue;
      }

      const segmentStart = currentPos;
      const segmentEnd = currentPos + (segment.content as string).length;

      // Check if the new link should be inserted before this segment
      if (
        !linkAdded &&
        selectionStart >= segmentStart &&
        selectionStart < segmentEnd
      ) {
        // Split this segment if needed
        const beforeLinkText = (segment.content as string).substring(
          0,
          selectionStart - segmentStart
        );
        const afterLinkText = (segment.content as string).substring(
          selectionEnd - segmentStart
        );

        // Add text before the link (if any)
        if (beforeLinkText) {
          if (segment.type === "link") {
            newSegments.push({
              type: "link",
              content: beforeLinkText,
              href: (segment as any).href,
            });
          } else {
            newSegments.push({
              type: "text",
              content: beforeLinkText,
            });
          }
        }

        // Add the new link
        newSegments.push({ type: "link", content: linkText, href: linkUrl });

        // Add text after the link (if any)
        if (afterLinkText) {
          newSegments.push({ type: "text", content: afterLinkText });
        }

        linkAdded = true;
      } else if (!linkAdded && selectionStart === segmentEnd) {
        // Add the current segment first
        newSegments.push(segment);

        // Then add the new link
        newSegments.push({ type: "link", content: linkText, href: linkUrl });
        linkAdded = true;
      } else {
        // Add the segment as-is
        newSegments.push(segment);
      }

      currentPos = segmentEnd;
    }

    // If link wasn't added yet (at the very end), add it now
    if (!linkAdded) {
      newSegments.push({ type: "link", content: linkText, href: linkUrl });
    }

    // Save to localStorage
    localStorage.setItem("test", JSON.stringify(newSegments));

    // Update content
    onChange(newSegments);

    // Update text value
    setTextValue(segmentsToText(newSegments));

    setShowLinkDialog(false);
    setLinkText("");
    setLinkUrl("");
  };

  const removeLink = (targetIndex: number) => {
    const newSegments = content.map((segment, index) => {
      if (index === targetIndex && segment.type === "link") {
        return { type: "text", content: segment.content } as TextSegment;
      }
      return segment;
    });

    // Merge adjacent text segments
    const mergedSegments: TextSegment[] = [];
    newSegments.forEach((segment) => {
      const lastSegment = mergedSegments[mergedSegments.length - 1];
      if (
        lastSegment &&
        lastSegment.type === "text" &&
        segment.type === "text"
      ) {
        lastSegment.content += segment.content;
      } else {
        mergedSegments.push(segment);
      }
    });

    const newText = segmentsToText(mergedSegments);
    setTextValue(newText);
    onChange(mergedSegments);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder={placeholder}
          rows={rows}
          className="resize-none"
        />

        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleTextSelection}
            className="h-6 w-6 p-0"
            title="Select text to add link"
          >
            <LinkIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Show current links */}
      {content.some((segment) => segment.type === "link") && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Current Links:
          </Label>
          <div className="space-y-1">
            {content.map(
              (segment, index) =>
                segment.type === "link" && (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm"
                  >
                    <LinkIcon className="h-3 w-3 text-blue-600" />
                    <span className="font-medium">{segment.content}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-blue-600 truncate">
                      {segment.href}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                      className="h-5 w-5 p-0 ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <Card className="p-4  bg-background    ">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add Link</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Link Text
                </Label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={addLink}
                disabled={!linkText.trim() || !linkUrl.trim()}
              >
                Add Link
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLinkDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        💡 Select text and click the link icon to add inline links. You can add
        multiple links to the same paragraph.
      </div>
    </div>
  );
}
