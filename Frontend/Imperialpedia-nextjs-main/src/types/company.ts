import { BaseEntity } from './entity';

export interface Company extends BaseEntity {
  type: 'company';
  industry: string;
  country: string;
  founded_year: number;
  headquarters: string;
  employees: number;
  website: string;
  technologies: string[];
  competitors: string[];
}
