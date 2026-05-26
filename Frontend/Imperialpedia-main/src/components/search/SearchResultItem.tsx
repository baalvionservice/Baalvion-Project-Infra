import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import { SearchResult } from "@/types/search";
import {
  ArrowRight,
  Globe,
  Building,
  Factory,
  Cpu,
  FileText,
  User,
  Calculator,
  BookOpen,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultItemProps extends SearchResult {
  onClick?: () => void;
  className?: string;
}

const typeConfig = {
  country: { icon: Globe, color: "text-primary bg-primary/10" },
  company: { icon: Building, color: "text-secondary bg-secondary/10" },
  industry: { icon: Factory, color: "text-emerald-500 bg-emerald-500/10" },
  technology: { icon: Cpu, color: "text-amber-500 bg-amber-500/10" },
  article: { icon: FileText, color: "text-blue-500 bg-blue-500/10" },
  author: { icon: User, color: "text-purple-500 bg-purple-500/10" },
  calculator: { icon: Calculator, color: "text-orange-500 bg-orange-500/10" },
  glossary: { icon: BookOpen, color: "text-teal-500 bg-teal-500/10" },
  topic: { icon: Tag, color: "text-pink-500 bg-pink-500/10" },
};

export const SearchResultItem = ({
  id,
  type,
  title,
  snippet,
  route,
  onClick,
  className,
}: SearchResultItemProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Link
      href={route}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            config.color
          )}
        >
          <Icon size={20} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Text
              variant="bodySmall"
              weight="bold"
              className="group-hover:text-primary transition-colors"
            >
              {title}
            </Text>
            <Badge
              variant="outline"
              className="text-[8px] font-bold uppercase tracking-widest h-4 px-1.5 opacity-60"
            >
              {type}
            </Badge>
          </div>
          <Text
            variant="caption"
            className="text-muted-foreground line-clamp-1 max-w-sm"
          >
            {snippet}
          </Text>
        </div>
      </div>
      <ArrowRight
        size={16}
        className="text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"
      />
    </Link>
  );
};
