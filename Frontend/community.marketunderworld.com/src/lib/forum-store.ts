"use client";

import {
  FORUM_CATEGORIES,
  INITIAL_THREADS,
  type ForumCategory,
  type ForumThreadItem,
  type ForumReplyItem,
  type ForumSubNode,
} from "./forum-data";

const THREADS_STORAGE_KEY = "baalvion_forum_threads_v1";

// Helper to get all threads (initial + user created)
export function getAllThreads(): ForumThreadItem[] {
  if (typeof window === "undefined") {
    return INITIAL_THREADS;
  }

  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(INITIAL_THREADS));
      return INITIAL_THREADS;
    }
    const parsed: ForumThreadItem[] = JSON.parse(raw);
    return parsed;
  } catch {
    return INITIAL_THREADS;
  }
}

// Get threads for a specific subforum slug
export function getThreadsForSubforum(subforumSlug: string): ForumThreadItem[] {
  const all = getAllThreads();
  return all.filter((t) => t.subforumSlug === subforumSlug);
}

// Get single thread by tid
export function getThreadById(tid: string): ForumThreadItem | null {
  const all = getAllThreads();
  return all.find((t) => t.tid === tid) || null;
}

// Find subnode info across all categories
export function findSubNode(slug: string): { subNode: ForumSubNode; category: ForumCategory } | null {
  for (const cat of FORUM_CATEGORIES) {
    const found = cat.subNodes.find((n) => n.slug === slug);
    if (found) {
      return { subNode: found, category: cat };
    }
  }
  return null;
}

// Create a new thread
export function createNewThread(params: {
  subforumSlug: string;
  title: string;
  prefix: string;
  content: string;
  authorUsername?: string;
}): ForumThreadItem {
  const all = getAllThreads();
  const tid = `thread-${Date.now()}`;
  const nowStr = "Just now";

  const newThread: ForumThreadItem = {
    tid,
    subforumSlug: params.subforumSlug,
    title: params.title,
    prefix: params.prefix || "DISCUSSION",
    prefixColor: params.prefix === "VIP METHOD" ? "red" : params.prefix === "GUIDE" ? "green" : "gold",
    author: {
      username: params.authorUsername || "CurrentMember",
      avatarColor: "#c0392b",
      avatarLetter: (params.authorUsername || "C")[0].toUpperCase(),
      rank: "MEMBER",
      rankColor: "#3498db",
      joinDate: "Oct 2026",
      messagesCount: 1,
      reactionScore: 0,
      isOnline: true,
    },
    date: nowStr,
    views: 1,
    replies: 0,
    originalPost: {
      content: params.content,
      signature: "New forum member.",
    },
    posts: [],
  };

  const updated = [newThread, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated));
  }
  return newThread;
}

// Add a reply to an existing thread
export function addReplyToThread(
  tid: string,
  content: string,
  quote?: { author: string; text: string }
): ForumReplyItem | null {
  const all = getAllThreads();
  const threadIndex = all.findIndex((t) => t.tid === tid);
  if (threadIndex === -1) return null;

  const thread = all[threadIndex];
  const newPostNumber = (thread.posts?.length || 0) + 2; // +1 for OP, +1 for this reply
  const pid = `post-${Date.now()}`;

  const newReply: ForumReplyItem = {
    pid,
    postNumber: newPostNumber,
    author: {
      username: "CurrentMember",
      avatarColor: "#c0392b",
      avatarLetter: "C",
      rank: "MEMBER",
      rankColor: "#3498db",
      joinDate: "Oct 2026",
      messagesCount: 2,
      reactionScore: 1,
      isOnline: true,
    },
    date: "Just now",
    content,
    quote,
    likes: 0,
  };

  thread.posts = [...(thread.posts || []), newReply];
  thread.replies = thread.posts.length;

  all[threadIndex] = { ...thread };
  if (typeof window !== "undefined") {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(all));
  }

  return newReply;
}

// Toggle like on a reply or original post
export function toggleLikePost(tid: string, pid: string): boolean {
  const all = getAllThreads();
  const thread = all.find((t) => t.tid === tid);
  if (!thread) return false;

  const reply = thread.posts?.find((p) => p.pid === pid);
  if (reply) {
    reply.likes = (reply.likes || 0) + 1;
    if (typeof window !== "undefined") {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(all));
    }
    return true;
  }
  return false;
}
