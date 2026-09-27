'use client';

import { useEffect, useState } from 'react';

export type ShortcutPlatform = 'mac' | 'windows' | 'touch';

/**
 * Detects which search-shortcut affordance to show: ⌘K on macOS/iOS, Ctrl+K on
 * Windows/Linux, or nothing (a plain tap/search icon) on touch devices. Pointer
 * type (coarse vs. fine), not OS sniffing alone, decides the touch case — iPadOS
 * reports `platform: "MacIntel"` (desktop-Mac spoofing), so a fine-pointer check
 * has to come first or every iPad would be misread as a Mac with a keyboard.
 * Returns null during SSR/first paint to avoid a hydration mismatch; consumers
 * should render their default (non-shortcut) state until this resolves.
 */
function detectPlatform(): ShortcutPlatform {
  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  if (isCoarsePointer) return 'touch';

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || navigator.platform || '';
  const ua = navigator.userAgent || '';
  if (/Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X|iPhone OS/i.test(ua)) return 'mac';
  return 'windows';
}

export function useShortcutHint(): ShortcutPlatform | null {
  const [platform, setPlatform] = useState<ShortcutPlatform | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return platform;
}

/** Short label for the shortcut kbd hint — null means "show no hint" (touch). */
export function shortcutLabel(platform: ShortcutPlatform | null): string | null {
  if (platform === 'mac') return '⌘K';
  if (platform === 'windows') return 'Ctrl+K';
  return null;
}
