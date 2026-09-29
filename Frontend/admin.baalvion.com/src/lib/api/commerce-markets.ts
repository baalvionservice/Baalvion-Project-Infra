import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

const client = serviceClients.commerce;

export type TaxType = 'GST' | 'VAT' | 'SALES_TAX';

/** A supported storefront market (currency / tax / FX), from commerce-service config/markets. */
export interface Market {
  country: string;
  name: string;
  currency: string;
  locale: string;
  taxType: TaxType;
  taxRate: number;
  taxInclusive: boolean;
  fxRate: number;
  roundTo: number;
}

export interface MarketsResponse {
  baseCurrency: string;
  defaultMarket: string;
  markets: Market[];
}

export const commerceMarketsApi = {
  list: () => client.get<ApiResponse<MarketsResponse>>('/commerce/markets'),
};
