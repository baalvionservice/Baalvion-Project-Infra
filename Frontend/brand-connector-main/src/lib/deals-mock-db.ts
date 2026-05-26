
/**
 * @deprecated This file is kept for reference only.
 * All deal data is now served by brand-service (:3006) via /api/deals.
 * Use `dealApi` from `@/lib/api-client` instead.
 */

import { Deal, DealStage, DealNote } from '@/types/deal';

class MockDealDB {
  private deals: Deal[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const companies = ["Lumina Tech", "EcoVibe", "FitFlow", "PureHydrate", "CloudScale", "UrbanEdge"];
    const stages: DealStage[] = ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won"];
    const users = ["Admin Sarah", "Admin Alex", "Root Admin"];

    this.deals = Array.from({ length: 15 }).map((_, i) => ({
      id: `deal_${i + 1}`,
      leadId: `lead_${i + 1}`,
      companyName: companies[i % companies.length],
      value: Math.floor(Math.random() * 10000) + 500,
      stage: stages[i % stages.length],
      assignedTo: users[i % users.length],
      source: "outreach",
      notes: [
        { id: `dn_${i}_1`, text: "Interested in Q4 roadmap.", createdAt: new Date().toISOString() }
      ],
      createdAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  getDeals() {
    return this.deals;
  }

  getDeal(id: string) {
    return this.deals.find(d => d.id === id);
  }

  createDeal(data: Partial<Deal>) {
    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      leadId: data.leadId || '',
      companyName: data.companyName || 'Untitled Deal',
      value: data.value || 0,
      stage: data.stage || 'new',
      source: data.source || 'manual',
      assignedTo: data.assignedTo || 'Unassigned',
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.deals.unshift(newDeal);
    return newDeal;
  }

  updateDeal(id: string, updates: Partial<Deal>) {
    const index = this.deals.findIndex(d => d.id === id);
    if (index === -1) return null;
    this.deals[index] = { ...this.deals[index], ...updates, updatedAt: new Date().toISOString() };
    return this.deals[index];
  }

  addNote(id: string, text: string) {
    const deal = this.getDeal(id);
    if (!deal) return null;
    const note: DealNote = { id: `dn_${Date.now()}`, text, createdAt: new Date().toISOString() };
    deal.notes.unshift(note);
    return note;
  }
}

export const dealsDb = new MockDealDB();
