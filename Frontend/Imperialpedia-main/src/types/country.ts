import { BaseEntity } from './entity';

export interface Country extends BaseEntity {
  type: 'country';
  capital: string;
  region: string;
  population: number;
  gdp: string;
  currency: string;
  official_language: string;
  industries: string[]; // List of industry slugs
  technologies: string[]; // List of technology slugs
}
