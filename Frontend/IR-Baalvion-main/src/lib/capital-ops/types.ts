
export type CapOpsRole = 'Admin' | 'Investor' | 'Board Viewer';

export type WireStatus = 'Not Initiated' | 'Initiated' | 'Confirmed';

export interface Investor {
  id: string;
  name: string;
  commitmentAmount: number;
  calledToDate: number;
  remainingCommitment: number;
  pendingCallAmount: number;
  wireStatus: WireStatus;
}

export interface CapitalCall {
  id: string;
  percentage: number;
  totalAmount: number;
  createdAt: string;
  dueDate: string;
  status: 'Open' | 'Closed';
}

export interface SPV {
  id: string;
  name: string;
  allocatedAmount: number;
  targetPercentage: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  role: CapOpsRole;
  message: string;
}
