import { ID, Status } from './common';

/**
 * @fileOverview Platform and configuration related types.
 */

export interface PlatformConfig {
  name: string;
  description: string;
  defaultLanguage: string;
  defaultPaginationSize: number;
  contactEmail: string;
}

export interface EnvironmentConfig {
  appName: string;
  siteUrl: string;
  environment: 'development' | 'production' | 'test';
  apiBaseUrl: string;
}

export interface RouteConfig {
  public: {
    home: string;
    outline: string;
    glossary: string;
    calculators: string;
    creators: string;
  };
  platform: {
    dashboard: string;
  };
  creator: {
    dashboard: string;
    publishing: string;
    monetization: string;
  };
  admin: {
    dashboard: string;
    analytics: string;
  };
}
