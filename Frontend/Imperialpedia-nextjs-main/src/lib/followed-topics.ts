const STORAGE_KEY = "imperialpedia:followed-topics";

function readAll(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeAll(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // localStorage unavailable — follow state just won't persist.
  }
}

export function isFollowingTopic(categorySlug: string): boolean {
  return readAll().includes(categorySlug);
}

export function getFollowedTopics(): string[] {
  return readAll();
}

/** Toggles follow state for a topic, returns the new state. */
export function toggleFollowTopic(categorySlug: string): boolean {
  const current = readAll();
  const following = current.includes(categorySlug);
  writeAll(following ? current.filter((s) => s !== categorySlug) : [...current, categorySlug]);
  return !following;
}
