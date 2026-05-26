'use client';

import { Globe, Users, FileText, MoreHorizontal, Settings, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Website } from '@/lib/types/cms-website.types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  archived: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
};

interface Props {
  website: Website;
  onDelete?: (id: string) => void;
  onSelect?: (website: Website) => void;
}

export default function WebsiteCard({ website, onDelete, onSelect }: Props) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{website.name}</p>
              <p className="text-xs text-muted-foreground truncate">{website.domain}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/cms/websites/${website.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`https://${website.domain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Site
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(website.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-xs capitalize ${STATUS_COLORS[website.status] ?? ''}`}
          >
            {website.status}
          </Badge>
          <Badge variant="secondary" className="text-xs capitalize">
            {website.plan}
          </Badge>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {website.contentCount} items
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {website.memberCount} members
          </span>
        </div>

        {website.modules.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {website.modules.slice(0, 4).map((m) => (
              <span
                key={m}
                className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium capitalize"
              >
                {m}
              </span>
            ))}
            {website.modules.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{website.modules.length - 4}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => onSelect?.(website)}
          asChild
        >
          <Link href={`/cms/websites/${website.id}/content`}>
            Manage Content
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
