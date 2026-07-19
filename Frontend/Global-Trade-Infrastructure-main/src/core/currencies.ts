/**
 * @file core/currencies.ts
 * @description Single source of truth for the currencies selectable across the
 * platform (RFQ forms, invoices, duty calculator, institutional onboarding).
 * Previously duplicated independently in 4+ places with drifting, inconsistent
 * lists (some as short as 3 currencies) — this is the canonical superset.
 */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'SGD', 'CNY', 'JPY'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
