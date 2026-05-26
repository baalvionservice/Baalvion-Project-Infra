/**
 * @fileOverview Lead Service for GeoTrade Nexus.
 * Handles all business logic and data fetching for partnership leads and survey submissions.
 */

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  material: string;
  volume: string;
  supply_type: string;
  challenges: string[];
  budget: string;
  pdfGenerated: boolean;
  emailSent: boolean;
  status: 'Booked' | 'Not Booked' | 'Contacted';
  date: string;
  score: number;
  notes: string;
}

const MOCK_LEADS: Lead[] = [
  { 
    id: "L-1001", 
    name: "John Chen", 
    company: "Atlas Mining", 
    email: "j.chen@atlasmining.com", 
    phone: "+61 400 000 000",
    material: "iron_ore", 
    volume: "500+", 
    supply_type: "both",
    challenges: ["quality", "logistics"],
    budget: "50kplus",
    pdfGenerated: true,
    emailSent: true,
    status: "Booked",
    date: "2h ago",
    score: 92,
    notes: "High priority lead. Interested in long-term supply contract."
  },
  { 
    id: "L-1002", 
    name: "Li Wei", 
    company: "SinoTrade", 
    email: "li.wei@sinotrade.cn", 
    phone: "+86 10 0000 0000",
    material: "granite", 
    volume: "50-200", 
    supply_type: "export",
    challenges: ["pricing"],
    budget: "10k-50k",
    pdfGenerated: true,
    emailSent: true,
    status: "Not Booked",
    date: "5h ago",
    score: 74,
    notes: ""
  },
  { 
    id: "L-1003", 
    name: "Ahmed Al-Farsi", 
    company: "Emirates Minerals", 
    email: "ahmed@emirates.ae", 
    phone: "+971 4 000 0000",
    material: "sand_gravel", 
    volume: "200-500", 
    supply_type: "domestic",
    challenges: ["scaling", "quality"],
    budget: "50kplus",
    pdfGenerated: false,
    emailSent: false,
    status: "Not Booked",
    date: "1d ago",
    score: 88,
    notes: "Awaiting volume verification."
  },
];

export class LeadService {
  static async getLeads(): Promise<Lead[]> {
    // API ENDPOINT: GET /api/admin/leads
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_LEADS), 500);
    });
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    // API ENDPOINT: PATCH /api/admin/leads/:id
    console.log(`[Service] Updating lead ${id}`, updates);
  }

  static async deleteLead(id: string): Promise<void> {
    // API ENDPOINT: DELETE /api/admin/leads/:id
    console.log(`[Service] Deleting lead ${id}`);
  }
}
