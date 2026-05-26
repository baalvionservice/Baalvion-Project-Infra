
/**
 * @deprecated This file is kept for reference only.
 * All CRM/Lead data is now served by brand-service (:3006) via /api/leads.
 * Use `leadApi` from `@/lib/api-client` instead.
 */

import { Lead, LeadNote, LeadPriority, ScoreBreakdown } from '@/types/crm';

const HIGH_VALUE_NICHES = ["saas", "finance", "health", "fitness", "beauty", "ecommerce", "tech"];

class MockLeadDB {
  private leads: Lead[] = [];
  private notes: LeadNote[] = [];

  constructor() {
    this.seed();
  }

  private calculateScore(lead: Partial<Lead>): { score: number; priority: LeadPriority; breakdown: ScoreBreakdown } {
    // A. Engagement (0-30) - Simulating followers/reach
    const engagement = Math.floor(Math.random() * 20) + 10; 

    // B. Completeness (0-20)
    let completeness = 0;
    if (lead.email) completeness += 10;
    if (lead.website) completeness += 10;

    // C. Niche Value (0-30)
    let nicheValue = 10;
    const firstWord = lead.niche?.toLowerCase().split(' ')[0] || '';
    if (HIGH_VALUE_NICHES.includes(firstWord)) {
      nicheValue = 30;
    }

    // D. Activity (0-20)
    let activity = 10;
    if (lead.status !== 'new') activity += 10;

    const total = engagement + completeness + nicheValue + activity;
    
    let priority: LeadPriority = "low";
    if (total >= 75) priority = "high";
    else if (total >= 40) priority = "medium";

    return {
      score: total,
      priority,
      breakdown: { engagement, completeness, nicheValue, activity }
    };
  }

  private seed() {
    const niches = ['Tech & Gadgets', 'Fashion', 'Fitness', 'Beauty', 'Gaming', 'Education'];
    const statuses: any[] = ['new', 'contacted', 'replied', 'booked', 'closed', 'lost'];
    const users = ['Admin Sarah', 'Admin Alex', 'Root Admin', 'Unassigned'];

    this.leads = Array.from({ length: 35 }).map((_, i) => {
      const niche = niches[i % niches.length];
      const email = `contact@brand${i + 1}.com`;
      const website = `https://brand${i + 1}.com`;
      
      const { score, priority, breakdown } = this.calculateScore({ niche, email, website, status: 'new' });

      return {
        id: `lead_${i + 1}`,
        companyName: `${niche.split(' ')[0]} Brand ${i + 1}`,
        niche,
        email,
        instagramHandle: `@brand_${i + 1}_official`,
        website,
        score,
        priority,
        scoreBreakdown: breakdown,
        status: statuses[i % statuses.length],
        assignedTo: users[i % users.length],
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        updatedAt: new Date().toISOString(),
        lastScoredAt: new Date().toISOString()
      };
    });

    this.notes = [
      { id: 'note_1', leadId: 'lead_1', text: 'Highly interested in Q4 smart home campaign.', createdAt: new Date().toISOString() },
      { id: 'note_2', leadId: 'lead_1', text: 'Follow up scheduled for Monday.', createdAt: new Date().toISOString() },
    ];
  }

  getLeads(status?: string, niche?: string, search?: string, page: number = 1, priority?: string) {
    let filtered = [...this.leads];

    if (status && status !== 'all') filtered = filtered.filter(l => l.status === status);
    if (niche && niche !== 'all') filtered = filtered.filter(l => l.niche === niche);
    if (priority && priority !== 'all') filtered = filtered.filter(l => l.priority === priority);
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(l => 
        l.companyName.toLowerCase().includes(s) || 
        l.email?.toLowerCase().includes(s)
      );
    }

    // Default: Sort by score DESC then date
    filtered.sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pageSize = 10;
    const total = filtered.length;
    const pages = Math.ceil(total / pageSize);
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, pages, page };
  }

  runScoring(ids?: string[]) {
    const targetLeads = ids ? this.leads.filter(l => ids.includes(l.id)) : this.leads;
    targetLeads.forEach(l => {
      const { score, priority, breakdown } = this.calculateScore(l);
      l.score = score;
      l.priority = priority;
      l.scoreBreakdown = breakdown;
      l.lastScoredAt = new Date().toISOString();
    });
    return targetLeads.length;
  }

  getTopLeads(limitCount: number = 5) {
    return [...this.leads]
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);
  }

  getInsights() {
    const total = this.leads.length;
    if (total === 0) return { high: 0, medium: 0, low: 0, avgScore: 0 };

    const high = this.leads.filter(l => l.priority === 'high').length;
    const medium = this.leads.filter(l => l.priority === 'medium').length;
    const low = this.leads.filter(l => l.priority === 'low').length;
    const avgScore = Math.round(this.leads.reduce((acc, curr) => acc + curr.score, 0) / total);

    return { high, medium, low, avgScore };
  }

  getLead(id: string) {
    return this.leads.find(l => l.id === id);
  }

  createLead(data: Partial<Lead>) {
    const { score, priority, breakdown } = this.calculateScore(data);
    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      companyName: data.companyName || 'Untitled',
      niche: data.niche || 'Other',
      email: data.email,
      instagramHandle: data.instagramHandle,
      score,
      priority,
      scoreBreakdown: breakdown,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScoredAt: new Date().toISOString(),
      ...data
    } as Lead;
    this.leads.unshift(newLead);
    return newLead;
  }

  updateLead(id: string, updates: Partial<Lead>) {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) return null;
    this.leads[index] = { ...this.leads[index], ...updates, updatedAt: new Date().toISOString() };
    return this.leads[index];
  }

  addNote(leadId: string, text: string) {
    const note = { id: `note_${Date.now()}`, leadId, text, createdAt: new Date().toISOString() };
    this.notes.unshift(note);
    return note;
  }

  getNotes(leadId: string) {
    return this.notes.filter(n => n.leadId === leadId);
  }
}

export const crmDb = new MockLeadDB();
