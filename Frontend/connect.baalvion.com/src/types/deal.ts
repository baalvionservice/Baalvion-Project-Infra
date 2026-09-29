
export type DealStage = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export interface Deal {
  id: string;
  leadId: string;
  companyName: string;
  value: number;
  stage: DealStage;
  assignedTo?: string;
  source: "outreach" | "manual";
  notes: DealNote[];
  createdAt: string;
  updatedAt: string;
}

export interface DealNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface PipelineStage {
  id: DealStage;
  name: string;
  order: number;
  color: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "new", name: "New Lead", order: 1, color: "bg-slate-100 text-slate-600" },
  { id: "contacted", name: "Contacted", order: 2, color: "bg-blue-100 text-blue-600" },
  { id: "qualified", name: "Qualified", order: 3, color: "bg-indigo-100 text-indigo-600" },
  { id: "proposal", name: "Proposal Sent", order: 4, color: "bg-purple-100 text-purple-600" },
  { id: "negotiation", name: "Negotiation", order: 5, color: "bg-orange-100 text-orange-600" },
  { id: "closed_won", name: "Closed Won", order: 6, color: "bg-emerald-100 text-emerald-600" },
  { id: "closed_lost", name: "Closed Lost", order: 7, color: "bg-red-100 text-red-600" },
];
