'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CategoryTree as CategoryTreeType } from '@/lib/types/cms-taxonomy.types';

interface TreeNodeProps {
  node: CategoryTreeType;
  depth: number;
  onEdit: (node: CategoryTreeType) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

function TreeNode({ node, depth, onEdit, onDelete, onAddChild }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          className="flex h-4 w-4 shrink-0 items-center justify-center"
          onClick={() => setExpanded(!expanded)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>

        {expanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-amber-500" />
        )}

        <span className="flex-1 text-sm truncate">{node.name}</span>

        <span className="text-xs text-muted-foreground mr-2">
          {node.contentCount}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddChild(node.id)}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Subcategory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <Edit2 className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && hasChildren && (
        <div>
          {(node.children ?? []).map((child) => (
            <TreeNode
              key={child.id}
              node={child as CategoryTreeType}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  tree: CategoryTreeType[];
  onEdit: (node: CategoryTreeType) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  isLoading?: boolean;
}

export default function CategoryTree({ tree, onEdit, onDelete, onAddChild, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No categories yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-1">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}
