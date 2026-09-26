import { BaseEntity } from './entity';

export interface Dataset extends BaseEntity {
  type: 'dataset';
  category: string;
  records: number;
  source: string;
}
