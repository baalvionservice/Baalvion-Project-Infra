import { BaseEntity } from './entity';

export interface Technology extends BaseEntity {
  type: 'technology';
  industry: string;
  applications: string[];
  invented_year: number;
  key_companies: string[];
  related_technologies: string[];
}
