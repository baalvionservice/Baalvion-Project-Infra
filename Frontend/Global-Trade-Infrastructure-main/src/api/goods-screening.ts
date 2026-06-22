/**
 * @file src/api/goods-screening.ts
 * @description React Query hook for restricted-goods screening. Unlike the rest of `@/api`
 * (which targets the `/trade-bff` gateway via `tradeApi`), this calls the same-origin GTI
 * route `/api/compliance/goods-screening` through `goods-screening-client` — the same
 * pattern as the sanctions screening flow.
 *
 * Modeled as a query (auto-runs, cached) rather than a mutation, but because every
 * evaluation writes an audit row server-side we keep it from re-firing on focus/mount.
 */
import { useQuery } from '@tanstack/react-query';
import { screenGoods, type GoodsDecision, type GoodsScreeningInput, type GoodsScreeningResult } from '@/lib/goods-screening-client';

export type { GoodsDecision, GoodsScreeningInput, GoodsScreeningResult };

function hasScreenableInput(input: GoodsScreeningInput): boolean {
  return Boolean(input.hsCode?.trim() || input.productCategory?.trim());
}

/**
 * Screen goods against the live rule engine. Disabled until there is something to screen
 * (an HS code or a product category). Cached aggressively so a console view does not spam
 * the audited evaluation endpoint.
 */
export function useGoodsScreening(input: GoodsScreeningInput, options: { enabled?: boolean } = {}) {
  const enabled = (options.enabled ?? true) && hasScreenableInput(input);
  return useQuery<GoodsScreeningResult>({
    queryKey: [
      'goods-screening',
      input.hsCode ?? null,
      input.productCategory ?? null,
      input.originCountry ?? null,
      input.destinationCountry ?? null,
      input.direction ?? null,
    ],
    queryFn: () => screenGoods(input),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}
