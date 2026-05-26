"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NewsBodyBlock } from "@/lib/data.news";
import { Trash2, Plus, GripVertical } from "lucide-react";

interface NewsBodyBlockEditorProps {
  blocks: NewsBodyBlock[];
  onChange: (blocks: NewsBodyBlock[]) => void;
}

interface SingleBlockProps {
  block: NewsBodyBlock;
  index: number;
  onUpdate: (index: number, block: NewsBodyBlock) => void;
  onDelete: (index: number) => void;
}

const SingleBlockEditor: React.FC<SingleBlockProps> = ({
  block,
  index,
  onUpdate,
  onDelete,
}) => {
  const updateBlock = (updates: Partial<NewsBodyBlock>) => {
    onUpdate(index, { ...block, ...updates } as NewsBodyBlock);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (draggedIndex !== index) {
      // This will be handled by the parent component
      e.currentTarget.dispatchEvent(
        new CustomEvent("blockReorder", {
          detail: { from: draggedIndex, to: index },
          bubbles: true,
        })
      );
    }
  };

  const renderBlockEditor = () => {
    switch (block.type) {
      case "paragraph":
        return (
          <div className="space-y-2">
            <Label>Paragraph Text</Label>
            <Textarea
              value={block.text}
              onChange={(e) => updateBlock({ text: e.target.value })}
              placeholder="Enter paragraph text..."
              rows={3}
            />
          </div>
        );

      case "heading":
        return (
          <div className="space-y-2">
            <Label>Heading Text</Label>
            <Input
              value={block.text}
              onChange={(e) => updateBlock({ text: e.target.value })}
              placeholder="Enter heading text..."
            />
          </div>
        );

      case "subheading":
        return (
          <div className="space-y-2">
            <Label>Subheading Text</Label>
            <Input
              value={block.text}
              onChange={(e) => updateBlock({ text: e.target.value })}
              placeholder="Enter subheading text..."
            />
          </div>
        );

      case "quote":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quote Text</Label>
              <Textarea
                value={block.text}
                onChange={(e) => updateBlock({ text: e.target.value })}
                placeholder="Enter quote text..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Attribution (Optional)</Label>
              <Input
                value={block.attribution || ""}
                onChange={(e) => updateBlock({ attribution: e.target.value })}
                placeholder="Quote attribution..."
              />
            </div>
          </div>
        );

      case "callout":
        return (
          <div className="space-y-2">
            <Label>Callout Text</Label>
            <Textarea
              value={block.text}
              onChange={(e) => updateBlock({ text: e.target.value })}
              placeholder="Enter callout text..."
              rows={2}
            />
          </div>
        );

      case "list":
        return (
          <div className="space-y-2">
            <Label>List Items (one per line)</Label>
            <Textarea
              value={block.items.join("\n")}
              onChange={(e) =>
                updateBlock({
                  items: e.target.value
                    .split("\n")
                    .filter((item) => item.trim()),
                })
              }
              placeholder="Enter list items, one per line..."
              rows={4}
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={block.url}
                onChange={(e) => updateBlock({ url: e.target.value })}
                placeholder="Enter image URL..."
              />
            </div>
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                value={block.caption || ""}
                onChange={(e) => updateBlock({ caption: e.target.value })}
                placeholder="Image caption..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      className="border border-border/50"
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
            <Badge variant="outline" className="text-xs">
              {block.type}
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(index)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {renderBlockEditor()}
      </CardContent>
    </Card>
  );
};

export const NewsBodyBlockEditor: React.FC<NewsBodyBlockEditorProps> = ({
  blocks,
  onChange,
}) => {
  const addBlock = (type: NewsBodyBlock["type"]) => {
    let newBlock: NewsBodyBlock;

    switch (type) {
      case "paragraph":
      case "heading":
      case "subheading":
      case "callout":
        newBlock = { type, text: "" };
        break;
      case "quote":
        newBlock = { type, text: "", attribution: "" };
        break;
      case "list":
        newBlock = { type, items: [] };
        break;
      case "image":
        newBlock = { type, url: "", caption: "" };
        break;
      default:
        return;
    }

    onChange([...blocks, newBlock]);
  };

  const updateBlock = (index: number, block: NewsBodyBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    onChange(newBlocks);
  };

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    onChange(newBlocks);
  };

  const reorderBlocks = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    onChange(newBlocks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Article Body</Label>
        <Select
          onValueChange={(value) => addBlock(value as NewsBodyBlock["type"])}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Add block..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="heading">Heading</SelectItem>
            <SelectItem value="subheading">Subheading</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
            <SelectItem value="callout">Callout</SelectItem>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={index}
            onDrop={(e) => {
              e.preventDefault();
              const draggedIndex = parseInt(
                e.dataTransfer.getData("text/plain")
              );
              if (draggedIndex !== index) {
                reorderBlocks(draggedIndex, index);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
          >
            <SingleBlockEditor
              block={block}
              index={index}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
            />
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No content blocks yet</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => addBlock("paragraph")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Block
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
