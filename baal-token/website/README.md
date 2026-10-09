# website

Static informational skeleton. `src/pages.ts` defines the 12 pages plus the home page; `src/render.ts` is the layout; `pnpm run build` writes `website/dist/`.

Rules enforced by `tests/website.test.ts`: no JavaScript, forms or buttons; no wallet connection; no buy/sale calls to action; no token address (the only base58 string allowed is the public SPL Token program id); no price or return promises; every page states that BAAL has not launched; Mainnet-dependent values are explicit placeholders; tokenomics figures come from `token/allocation.json`.

Not yet decided: domain, hosting, canonical URLs, sitemap, contact channels. Deployment of the site is out of scope for Phase 1.
