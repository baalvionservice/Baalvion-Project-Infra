"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, User, Calendar } from "lucide-react";
import { getTopicColor } from "@/lib/topic-colors";

interface ArticleCardProps {
  id: string;
  title: string;
  description?: string;
  category: string;
  featuredImage?: string;
  href: string;
  author: {
    name: string;
    profileUrl: string;
    credentials?: string;
  };
  publishedAt: Date;
  updatedAt: Date;
  readingTimeMinutes: number;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function ArticleCard({
  id,
  title,
  description,
  category,
  featuredImage,
  href,
  author,
  publishedAt,
  updatedAt,
  readingTimeMinutes,
}: ArticleCardProps) {
  const isRecent = new Date().getTime() - updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000;
  const topicColor = getTopicColor(category);

  return (
    <article
      className="group flex flex-col h-full rounded-lg border border-border overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300"
      key={id}
    >
      {/* Featured Image */}
      <Link href={href} className="relative aspect-[16/9] w-full overflow-hidden bg-muted block">
        {featuredImage && (
          <Image
            src={featuredImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4">
        {/* Category & Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-widest rounded-full"
            style={{ backgroundColor: `${topicColor}1a`, color: topicColor }}
          >
            {category}
          </span>
          {isRecent && (
            <span className="inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-widest rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Updated
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-3 mb-2">
          <Link href={href}>{title}</Link>
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Author & Metadata */}
        <div className="mt-auto pt-3 border-t border-border/50">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-shrink-0">
                <Link
                  href={author.profileUrl}
                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block"
                >
                  By {author.name}
                </Link>
                {author.credentials && (
                  <span className="text-xs text-muted-foreground truncate block">
                    {author.credentials}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Date & Reading Time */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={updatedAt.toISOString()}>
                {isRecent ? "Updated" : "Published"} {formatDate(isRecent ? updatedAt : publishedAt)}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{readingTimeMinutes} min read</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
