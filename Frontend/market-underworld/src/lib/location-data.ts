
/**
 * @fileOverview Hierarchical Location Database for Marketplace.
 */

export const REGIONS = [
  { id: 'nam', name: 'North America', icon: '🗽' },
  { id: 'sas', name: 'South Asia', icon: '🌿' },
  { id: 'eap', name: 'East Asia & Pacific', icon: '🌏' },
  { id: 'eca', name: 'Europe & Central Asia', icon: '🌍' },
  { id: 'mena', name: 'Middle East & North Africa', icon: '🕌' },
  { id: 'lac', name: 'Latin America & Caribbean', icon: '🌎' },
  { id: 'ssa', name: 'Sub-Saharan Africa', icon: '🌍' },
];

export const COUNTRIES = [
  { id: 'in', name: 'India', code: 'IN', regionId: 'sas' },
  { id: 'us', name: 'United States', code: 'US', regionId: 'nam' },
  { id: 'de', name: 'Germany', code: 'DE', regionId: 'eca' },
  { id: 'jp', name: 'Japan', code: 'JP', regionId: 'eap' },
  { id: 'ae', name: 'UAE', code: 'AE', regionId: 'mena' },
  { id: 'br', name: 'Brazil', code: 'BR', regionId: 'lac' },
  { id: 'ng', name: 'Nigeria', code: 'NG', regionId: 'ssa' },
];

export const STATES: Record<string, { id: string, name: string }[]> = {
  'in': [
    { id: 'mh', name: 'Maharashtra' },
    { id: 'ka', name: 'Karnataka' },
    { id: 'dl', name: 'Delhi' }
  ],
  'us': [
    { id: 'ca', name: 'California' },
    { id: 'ny', name: 'New York' },
    { id: 'tx', name: 'Texas' }
  ],
  'de': [
    { id: 'by', name: 'Bavaria' },
    { id: 'be', name: 'Berlin' }
  ]
};

export const CITIES: Record<string, string[]> = {
  'mh': ['Mumbai', 'Pune', 'Nagpur'],
  'ca': ['Los Angeles', 'San Francisco', 'San Diego'],
  'by': ['Munich', 'Nuremberg']
};
