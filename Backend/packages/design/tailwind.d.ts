/**
 * Type declaration reachable by classic ("node") moduleResolution, which ignores the
 * package's exports map. Several apps in this monorepo still use it, so the subpath
 * `@baalvion/design/tailwind` needs a declaration at this exact path as well as the one
 * the exports map points to.
 */
import type { Config } from 'tailwindcss';

declare const preset: Partial<Config>;
export = preset;
