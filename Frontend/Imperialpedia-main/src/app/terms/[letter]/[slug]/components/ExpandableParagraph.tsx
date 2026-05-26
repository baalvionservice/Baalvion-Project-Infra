"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { TextSegment } from "@/lib/data/terms";

// Component to render individual TextSegment
function renderTextSegment(
  segment: TextSegment,
  index: number
): React.ReactNode {
  switch (segment.type) {
    case "text":
      return <span key={index}>{segment.content}</span>;

    case "link":
      return (
        <a
          key={index}
          href={segment.href}
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {segment.content}
        </a>
      );

    case "list":
      // Group consecutive items into single list items
      const groupedItems: React.ReactNode[] = [];
      let currentGroup: React.ReactNode[] = [];

      segment.content.forEach((item, itemIndex) => {
        const element =
          item.type === "text" ? (
            <span key={`text-${itemIndex}`}>{item.content} </span>
          ) : (
            <a
              key={`link-${itemIndex}`}
              href={item.href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.content}
            </a>
          );

        currentGroup.push(element);

        // If this is a link or the last item, close the current group
        if (item.type === "link" || itemIndex === segment.content.length - 1) {
          groupedItems.push(
            <li key={`group-${groupedItems.length}`}>{currentGroup}</li>
          );
          currentGroup = [];
        }
      });

      return (
        <ol key={index} className="list-decimal list-inside space-y-1 my-2">
          {groupedItems}
        </ol>
      );

    default:
      return null;
  }
}

export function ExpandableText({ content }: { content: TextSegment[] }) {
  const [expanded, setExpanded] = useState(false);

  // Process content to merge consecutive list items into a single ordered list
  const processedContent = React.useMemo(() => {
    const result: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];
    let listCounter = 0;

    content.forEach((segment, segmentIndex) => {
      if (segment.type === "list") {
        // Combine text and link into a single list item
        const listItem = (
          <li key={`list-item-${listCounter++}`}>
            {segment.content.map((item, itemIndex) => {
              if (item.type === "text") {
                return <span key={`text-${itemIndex}`}>{item.content} </span>;
              } else {
                return (
                  <a
                    key={`link-${itemIndex}`}
                    href={item.href}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.content}
                  </a>
                );
              }
            })}
          </li>
        );
        currentListItems.push(listItem);
      } else {
        // If we have accumulated list items, create the ordered list
        if (currentListItems.length > 0) {
          result.push(
            <ol
              key={`ol-${result.length}`}
              className="list-decimal list-inside space-y-1 my-2"
            >
              {currentListItems}
            </ol>
          );
          currentListItems = [];
        }

        // Add the non-list segment
        result.push(renderTextSegment(segment, segmentIndex));
      }
    });

    // Handle any remaining list items
    if (currentListItems.length > 0) {
      result.push(
        <ol
          key={`ol-${result.length}`}
          className="list-decimal list-inside space-y-1 my-2"
        >
          {currentListItems}
        </ol>
      );
    }

    return result;
  }, [content]);

  return (
    <div className="my-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2  border-t-2 border-l-2 p-4 border-neutral-400 text-black dark:text-white font-semibold tracking-wide"
      >
        ARTICLE SOURCES
        <ChevronDown
          className={cn(
            "transition-transform duration-200 text-primary",
            expanded && "rotate-180"
          )}
          size={18}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          expanded ? "max-h-[500px] mt-4" : "max-h-0"
        )}
      >
        <div className="text-[1.0625rem] leading-[1.85] text-foreground space-y-2">
          {processedContent}
        </div>
      </div>
    </div>
  );
}
