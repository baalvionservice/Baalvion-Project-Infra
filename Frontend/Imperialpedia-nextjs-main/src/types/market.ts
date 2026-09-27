import { BaseEntity } from './entity';

export interface Market extends BaseEntity {
  type: 'market';
  industry: string;
  market_size: string;
  growth_rate: string;
  key_companies: string[];
  regions: string[];
}
