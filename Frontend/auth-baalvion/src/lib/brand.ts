import { getTheme, themeForHost, DEFAULT_THEME, type Theme } from './themes';

/**
 * Additional product domains (beyond *.baalvion.com) that are allowed as a return target. These are
 * the non-baalvion.com hostnames in the ecosystem (Amarisé, the proxy stack, …). Configure per
 * deploy via NEXT_PUBLIC_ALLOWED_RETURN_HOSTS (comma-separated); the baseline below covers the
 * known apex domains so the guard is safe out of the box.
 */
const EXTRA_ALLOWED_HOSTS = (process.env.NEXT_PUBLIC_ALLOWED_RETURN_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const BASELINE_ALLOWED = [
  'baalvionstack.com',
  'amarisemaisonavenue.com',
  'controlthemarket.com',
  'lawelitenetwork.com',
  'imperialpedia.com',
];

/** True when a hostname is baalvion.com, a *.baalvion.com subdomain, or an allow-listed apex. */
function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'baalvion.com' || h.endsWith('.baalvion.com')) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  const allowed = [...BASELINE_ALLOWED, ...EXTRA_ALLOWED_HOSTS];
  return allowed.some((a) => h === a || h.endsWith(`.${a}`));
}

/**
 * Validate a caller-supplied return_to into a safe absolute URL string, or null. Prevents open
 * redirects: only https (or http for localhost) to an allow-listed Baalvion host is accepted.
 */
export function safeReturnTo(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const isLocal = url.hostname === 'localhost' || url.hostname.endsWith('.localhost');
  if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) return null;
  if (!isAllowedHost(url.hostname)) return null;
  return url.toString();
}

export interface ResolvedBrand {
  theme: Theme;
  returnTo: string | null;
}

/**
 * Resolve the theme + return target from the page's search params. Brand precedence:
 *   1. explicit ?brand=<slug>
 *   2. inferred from the return_to hostname
 *   3. default (apex Baalvion)
 */
export function resolveBrand(params: { brand?: string; return_to?: string; returnTo?: string }): ResolvedBrand {
  const returnTo = safeReturnTo(params.return_to ?? params.returnTo ?? null);

  let theme = DEFAULT_THEME;
  if (params.brand) {
    theme = getTheme(params.brand);
  } else if (returnTo) {
    try {
      theme = themeForHost(new URL(returnTo).hostname);
    } catch {
      theme = DEFAULT_THEME;
    }
  }

  return { theme, returnTo };
}
