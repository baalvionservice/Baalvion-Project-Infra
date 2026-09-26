import { BaseEntity } from './entity';

export interface Industry extends BaseEntity {
  type: 'industry';
  global_market_size: string;
  growth_rate: string;
  top_countries: string[];
  related_technologies: string[];
  key_companies: string[];
}
