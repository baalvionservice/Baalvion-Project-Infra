
import { ProductExtended, MaisonService, MaisonReport, PrivateInquiry } from './types';

/**
 * HIGH-TICKET MONETIZATION MOCK DATA
 * Assigning Elite status to selected artifacts for ₹10L+ trust simulation.
 */

export const PRODUCTS_EXTENDED: Record<string, Partial<ProductExtended>> = {
  'prod-1': {
    collectorValue: 'Exceptional',
    marketRange: '$12,000 - $15,000',
    investmentInsight: 'Artifacts from the 1924 founding series show a consistent 12% annual appreciation in the secondary market.',
    scarcityTag: 'Final Archive Piece',
    priceVisible: false
  },
  'prod-10': {
    collectorValue: 'Museum Grade',
    marketRange: '$45,000 - $55,000',
    investmentInsight: 'This piece represents a one-of-a-kind collaboration between our Parisian atelier and the 1924 archives.',
    scarcityTag: 'Privately Sourced',
    priceVisible: false
  },
  'prod-50': {
    collectorValue: 'Strategic',
    marketRange: '$8,000 - $10,000',
    investmentInsight: 'Exotic series within the Heritage line maintain higher resale liquidity than seasonal counterparts.',
    scarcityTag: 'Only 1 available globally',
    priceVisible: true
  }
};

export const MAISON_SERVICES: MaisonService[] = [
  {
    id: 'concierge',
    name: 'Maison Concierge',
    tagline: 'The Ultimate Acquisition Partner',
    description: 'A private concierge service dedicated to sourcing rare artifacts globally, managing international logistics, and providing white-glove delivery.',
    priceRange: 'On Commission',
    features: ['Global Sourcing Network', 'Tax & Duty Optimization', 'Private Viewings', 'Bespoke Logistics'],
    imageUrl: 'https://picsum.photos/seed/maison-concierge/1600/900',
    brandId: 'amarise-luxe',
    isGlobal: true
  },
  {
    id: 'advisory',
    name: 'Investment Advisory',
    tagline: 'Strategic Portfolio Curation',
    description: 'Bespoke advisory for collectors seeking to build high-value artisanal portfolios with long-term capital appreciation.',
    priceRange: 'Annual Retainer',
    features: ['Market Performance Reports', 'Private Auction Access', 'Provenance Verification', 'Exit Strategy Planning'],
    imageUrl: 'https://picsum.photos/seed/maison-advisory/1600/900',
    brandId: 'amarise-luxe',
    isGlobal: true
  },
  {
    id: 'authentication',
    name: 'Heritage Registry',
    tagline: 'Absolute Provenance Verification',
    description: 'Official Maison authentication service for high-value artifacts, including digital NFC certification and archival documentation.',
    priceRange: '$1,500 per Artifact',
    features: ['Atelier Inspection', 'Digital Heritage Seal', 'Blockchain Tracking', 'Official Appraisal'],
    imageUrl: 'https://picsum.photos/seed/maison-auth/1600/900',
    brandId: 'amarise-luxe',
    isGlobal: true
  }
];

export const MAISON_REPORTS: MaisonReport[] = [
  {
    id: 'global-artifact-report',
    title: 'The 2024 Global Artifact Appreciation Study',
    summary: 'A 45-page deep dive into the performance of heritage luxury goods in the 2024 economic climate.',
    date: 'March 2024',
    author: 'Elena Vance, Head of Curation',
    isPremium: true,
    previewImage: 'https://picsum.photos/seed/report-preview/800/1200',
    brandId: 'amarise-luxe'
  }
];

export const MOCK_REVENUE_METRICS = {
  totalAcquisitionValue: 12450000,
  highIntentLeads: 142,
  servicePullThrough: 28,
  conversionRate: 4.2,
  topRegions: [
    { name: 'USA', value: 4500000 },
    { name: 'UAE', value: 3800000 },
    { name: 'UK', value: 2100000 },
    { name: 'Singapore', value: 1200000 },
    { name: 'India', value: 850000 }
  ]
};
