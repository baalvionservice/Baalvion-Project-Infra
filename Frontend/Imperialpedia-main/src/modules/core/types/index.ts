export type ModuleStatus = 'alpha' | 'beta' | 'stable';

export interface SystemModule {
  id: string;
  name: string;
  version: string;
  status: ModuleStatus;
}
