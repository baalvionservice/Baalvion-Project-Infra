import { BaseEntity } from './entity';

export interface University extends BaseEntity {
  type: 'university';
  country: string;
  city: string;
  founded_year: number;
  students: number;
  website: string;
  fields_of_study: string[];
}
