
import { MaisonService, MaisonReport } from './types';

/**
 * Maison service/report catalog copy. Note: per-product collector-value/investment-insight
 * claims (formerly a fabricated PRODUCTS_EXTENDED lookup table here) are now real,
 * admin-authored fields on the product itself (commerce-service custom_fields, surfaced via
 * storefrontSerializer.js) — see Product.collectorValue/marketRange/investmentInsight/
 * scarcityTag/priceVisible in lib/types.ts. Nothing here fabricates a per-artifact claim.
 */

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

