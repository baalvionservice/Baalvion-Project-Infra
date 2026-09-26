import { BaseEntity } from './entity';

export interface Person extends BaseEntity {
  type: 'person';
  birth_year: number;
  nationality: string;
  occupation: string;
  known_for: string[];
  companies: string[];
  technologies: string[];
}
