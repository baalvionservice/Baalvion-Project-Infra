export const SITE = {
  name: 'CanWeMarry',

  /**
   * The public origin. Every canonical URL, the sitemap, robots.txt, Open Graph and all the
   * JSON-LD are built from this, so getting it wrong does not break the site — it publishes a
   * site that tells search engines it lives at localhost.
   *
   * Read from `SITE_URL` FIRST, and only then from the NEXT_PUBLIC copy. The difference is
   * when each is resolved: a `NEXT_PUBLIC_*` value is inlined into the bundle at BUILD time,
   * so setting it on the running container does nothing at all — measured, and it silently
   * produced `rel="canonical" href="http://localhost:3071/..."` on a server started with the
   * production origin in its environment. `SITE_URL` is an ordinary server variable and is
   * read per process at runtime, which is what a container expects.
   *
   * Every reader of this field is server-side (metadata, sitemap, robots, JSON-LD), so the
   * client bundle — where `SITE_URL` compiles to undefined — is unaffected.
   *
   * The `/guides/[slug]` pages are prerendered, so THEIR canonicals are fixed at build time
   * whatever this resolves to later. next.config.ts refuses a production build with a
   * localhost origin for that reason.
   */
  url: process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3071',
  tagline: 'Support for people facing opposition to their relationship',
  description:
    'A community platform for people whose families or communities oppose their relationship or marriage — offering support, constructive discussion, mediation-oriented help and trusted resources.',
} as const;

/**
 * What this platform is and is not. These are product boundaries, not marketing copy, and
 * they are stated plainly on the site because a visitor who arrives expecting something
 * else should find out immediately.
 */
export const BOUNDARIES = {
  is: [
    'A place to find people who understand what you are going through',
    'Support in thinking through a difficult family situation',
    'A route to mediators, counsellors and legal information',
    'A community that participates only when invited',
  ],
  isNot: [
    'A dating or matchmaking service',
    'A way to pressure, confront or expose anyone',
    'A substitute for legal advice or emergency help',
    'A place to publish information about people who have not agreed to it',
  ],
} as const;
