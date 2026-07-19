import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Persisted, save-time entity-mention detection from imperialpedia-service's
 * entityMentionDetectionService (via cms-service's cms_content_entity_mentions
 * table) — see Backend/services/knowledge/imperialpedia-service/service/
 * entityMentionDetectionService.js. Never fabricated: every entry here is a
 * real whole-word mention of a real knowledge-graph entity's canonical name
 * or an explicitly-configured alias, found in the article's own prose.
 */
export interface EntityMention {
  entityType: string;
  entitySlug: string;
  entityName: string;
  entityUrl: string;
  matchedText: string;
}

export interface EntityLinkerState {
  mentions: EntityMention[];
  linked: Set<string>;
}

/**
 * One linker per article render — tracks which entities have already been
 * linked so the *first* occurrence across the whole article (not per block)
 * gets linked, and every later mention of the same entity stays plain text.
 * Cheap to run on every request: the mention list is already small and
 * pre-resolved server-side, so this is just splitting a handful of short
 * paragraph strings, not re-scanning the article against the full catalog.
 */
export function createEntityLinker(mentions: EntityMention[] | undefined | null): EntityLinkerState {
  return { mentions: mentions ?? [], linked: new Set() };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitOnce(text: string, mention: EntityMention): { nodes: ReactNode[]; matched: boolean } {
  const pattern = new RegExp(`\\b${escapeRegExp(mention.matchedText)}\\b`, "i");
  const match = pattern.exec(text);
  if (!match) return { nodes: [text], matched: false };
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  const link = (
    <Link key={`${mention.entityType}:${mention.entitySlug}`} href={mention.entityUrl} className="entity-link">
      {match[0]}
    </Link>
  );
  return { nodes: [before, link, after].filter((n) => n !== ""), matched: true };
}

/**
 * Renders `text` as plain text with at most one entity turned into a real
 * internal link — the first not-yet-linked mention (across the whole
 * article, via `state.linked`) found in this text. Every other block that
 * mentions the same entity again renders it as plain text, satisfying the
 * first-occurrence-only anti-spam rule. Returns `text` unchanged (a plain
 * string, still valid ReactNode) when nothing in this block matches.
 */
export function linkEntitiesInText(text: string, state: EntityLinkerState): ReactNode {
  if (!text || state.mentions.length === 0) return text;

  let nodes: ReactNode[] = [text];
  for (const mention of state.mentions) {
    const key = `${mention.entityType}:${mention.entitySlug}`;
    if (state.linked.has(key)) continue;

    let matchedThisMention = false;
    nodes = nodes.flatMap((node) => {
      if (matchedThisMention || typeof node !== "string") return [node];
      const { nodes: split, matched } = splitOnce(node, mention);
      if (matched) matchedThisMention = true;
      return split;
    });
    if (matchedThisMention) state.linked.add(key);
  }
  return nodes;
}
