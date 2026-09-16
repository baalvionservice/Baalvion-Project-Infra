/**
 * @file src/api/keys.ts
 * @description Centralized React Query key factory for the Trade Operations domain. Keeping every
 * key here means cache invalidation after a mutation is precise and never drifts from the hooks.
 */
export type ListParams = Record<string, unknown>;

const root = ['trade-ops'] as const;

export const qk = {
  shipments: {
    all: [...root, 'shipments'] as const,
    list: (params: ListParams) => [...root, 'shipments', 'list', params] as const,
    detail: (id: string) => [...root, 'shipments', 'detail', id] as const,
    track: (id: string) => [...root, 'shipments', 'track', id] as const,
  },
  workflows: {
    all: [...root, 'workflows'] as const,
    definition: [...root, 'workflows', 'definition'] as const,
    list: (params: ListParams) => [...root, 'workflows', 'list', params] as const,
    detail: (id: string) => [...root, 'workflows', 'detail', id] as const,
    transitions: (id: string) => [...root, 'workflows', 'transitions', id] as const,
  },
  documents: {
    all: [...root, 'documents'] as const,
    capabilities: [...root, 'documents', 'capabilities'] as const,
    list: (params: ListParams) => [...root, 'documents', 'list', params] as const,
    detail: (id: string) => [...root, 'documents', 'detail', id] as const,
    events: (id: string) => [...root, 'documents', 'events', id] as const,
  },
  validation: {
    all: [...root, 'validation'] as const,
    list: (params: ListParams) => [...root, 'validation', 'list', params] as const,
    detail: (id: string) => [...root, 'validation', 'detail', id] as const,
  },
  compliance: {
    all: [...root, 'compliance'] as const,
    screeningDefinition: [...root, 'compliance', 'screening', 'definition'] as const,
    screenings: (params: ListParams) => [...root, 'compliance', 'screenings', params] as const,
    lists: (params: ListParams) => [...root, 'compliance', 'lists', params] as const,
    agentDefinition: [...root, 'compliance', 'agent', 'definition'] as const,
    assessments: (params: ListParams) => [...root, 'compliance', 'assessments', params] as const,
    shipmentAssessment: (shipmentId: string) => [...root, 'compliance', 'agent', 'shipment', shipmentId] as const,
  },
  readiness: {
    all: [...root, 'readiness'] as const,
    definition: [...root, 'readiness', 'definition'] as const,
    list: (params: ListParams) => [...root, 'readiness', 'list', params] as const,
    forShipment: (shipmentId: string) => [...root, 'readiness', 'shipment', shipmentId] as const,
  },
  hscodes: {
    all: [...root, 'hscodes'] as const,
    search: (q: string) => [...root, 'hscodes', 'search', q] as const,
    classifications: (params: ListParams) => [...root, 'hscodes', 'classifications', params] as const,
    code: (code: string) => [...root, 'hscodes', 'code', code] as const,
  },
  logistics: {
    all: [...root, 'logistics'] as const,
    network: [...root, 'logistics', 'network'] as const,
    list: (params: ListParams) => [...root, 'logistics', 'list', params] as const,
    detail: (id: string) => [...root, 'logistics', 'detail', id] as const,
  },
  customs: {
    all: [...root, 'customs'] as const,
    channels: [...root, 'customs', 'channels'] as const,
    list: (params: ListParams) => [...root, 'customs', 'list', params] as const,
    detail: (id: string) => [...root, 'customs', 'detail', id] as const,
    events: (id: string) => [...root, 'customs', 'events', id] as const,
  },
  dispatch: {
    all: [...root, 'dispatch'] as const,
    config: [...root, 'dispatch', 'config'] as const,
    list: (params: ListParams) => [...root, 'dispatch', 'list', params] as const,
    detail: (id: string) => [...root, 'dispatch', 'detail', id] as const,
    events: (id: string) => [...root, 'dispatch', 'events', id] as const,
  },
  warehouse: {
    all: [...root, 'warehouse'] as const,
    zones: (params: ListParams) => [...root, 'warehouse', 'zones', params] as const,
    zoneDetail: (id: string) => [...root, 'warehouse', 'zone', id] as const,
    bins: (params: ListParams) => [...root, 'warehouse', 'bins', params] as const,
    binDetail: (id: string) => [...root, 'warehouse', 'bin', id] as const,
    grns: (params: ListParams) => [...root, 'warehouse', 'grns', params] as const,
    grnDetail: (id: string) => [...root, 'warehouse', 'grn', id] as const,
    putawayTasks: (params: ListParams) => [...root, 'warehouse', 'putaway', params] as const,
    putawayDetail: (id: string) => [...root, 'warehouse', 'putaway-task', id] as const,
  },
  freightCarriers: {
    all: [...root, 'freight-carriers'] as const,
    list: (params: ListParams) => [...root, 'freight-carriers', 'list', params] as const,
    detail: (id: string) => [...root, 'freight-carriers', 'detail', id] as const,
    performance: (carrierId: string) => [...root, 'freight-carriers', 'performance', carrierId] as const,
    performanceList: (params: ListParams) => [...root, 'freight-carriers', 'performance-list', params] as const,
  },
  freightQuotes: {
    all: [...root, 'freight-quotes'] as const,
    list: (params: ListParams) => [...root, 'freight-quotes', 'list', params] as const,
    detail: (id: string) => [...root, 'freight-quotes', 'detail', id] as const,
    rateRules: (params: ListParams) => [...root, 'freight-quotes', 'rate-rules', params] as const,
    rateRule: (id: string) => [...root, 'freight-quotes', 'rate-rule', id] as const,
  },
  freightBookings: {
    all: [...root, 'freight-bookings'] as const,
    marketplaceCarriers: [...root, 'freight-bookings', 'marketplace-carriers'] as const,
    list: (params: ListParams) => [...root, 'freight-bookings', 'list', params] as const,
    detail: (id: string) => [...root, 'freight-bookings', 'detail', id] as const,
    events: (id: string) => [...root, 'freight-bookings', 'events', id] as const,
  },
  // The party-scoped shipment surface (/dashboard/shipments) — kept separate from
  // `shipments` above, which keys the tenant-scoped legacy collection.
  tradeShipments: {
    all: [...root, 'trade-shipments'] as const,
    list: (params: ListParams) => [...root, 'trade-shipments', 'list', params] as const,
    detail: (id: string) => [...root, 'trade-shipments', 'detail', id] as const,
    timeline: (id: string) => [...root, 'trade-shipments', 'timeline', id] as const,
    schedule: (id: string) => [...root, 'trade-shipments', 'schedule', id] as const,
    clearance: (id: string) => [...root, 'trade-shipments', 'clearance', id] as const,
    documents: (id: string) => [...root, 'trade-shipments', 'documents', id] as const,
    readiness: (id: string) => [...root, 'trade-shipments', 'readiness', id] as const,
    bottlenecks: (params: ListParams) => [...root, 'trade-shipments', 'bottlenecks', params] as const,
  },
  trackingPlatform: {
    all: [...root, 'tracking-platform'] as const,
    dashboardSummary: [...root, 'tracking-platform', 'dashboard', 'summary'] as const,
    dashboardMap: [...root, 'tracking-platform', 'dashboard', 'map'] as const,
    dashboardAlerts: [...root, 'tracking-platform', 'dashboard', 'alerts'] as const,
    dashboardRecentEvents: [...root, 'tracking-platform', 'dashboard', 'recent-events'] as const,
    dashboardCarrierPerformance: [...root, 'tracking-platform', 'dashboard', 'carrier-performance'] as const,
    search: (q: string) => [...root, 'tracking-platform', 'search', q] as const,
    geofences: (params: ListParams) => [...root, 'tracking-platform', 'geofences', params] as const,
    alerts: (params: ListParams) => [...root, 'tracking-platform', 'alerts', params] as const,
    checkpoints: (shipmentId: string) => [...root, 'tracking-platform', 'checkpoints', shipmentId] as const,
    iotDevices: (params: ListParams) => [...root, 'tracking-platform', 'iot-devices', params] as const,
    iotReadings: (deviceId: string) => [...root, 'tracking-platform', 'iot-readings', deviceId] as const,
    proofOfDelivery: (params: ListParams) => [...root, 'tracking-platform', 'pod', params] as const,
    etaLatest: (shipmentId: string) => [...root, 'tracking-platform', 'eta', 'latest', shipmentId] as const,
    etaHistory: (shipmentId: string) => [...root, 'tracking-platform', 'eta', 'history', shipmentId] as const,
    delayEvents: (params: ListParams) => [...root, 'tracking-platform', 'delay-events', params] as const,
    routes: (shipmentId: string) => [...root, 'tracking-platform', 'routes', shipmentId] as const,
    timeline: (shipmentId: string) => [...root, 'tracking-platform', 'timeline', shipmentId] as const,
  },
} as const;
