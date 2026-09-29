
import { Investor, SPV, CapitalCall } from "./types";

export const INITIAL_INVESTORS: Investor[] = [
  {
    id: 'INV-001',
    name: 'North Atlantic Pension Fund',
    commitmentAmount: 50000000,
    calledToDate: 10000000,
    remainingCommitment: 40000000,
    pendingCallAmount: 0,
    wireStatus: 'Not Initiated',
  },
  {
    id: 'INV-002',
    name: 'Global Sovereign Wealth',
    commitmentAmount: 75000000,
    calledToDate: 15000000,
    remainingCommitment: 60000000,
    pendingCallAmount: 0,
    wireStatus: 'Not Initiated',
  },
  {
    id: 'INV-003',
    name: 'Helios Capital Partners',
    commitmentAmount: 25000000,
    calledToDate: 5000000,
    remainingCommitment: 20000000,
    pendingCallAmount: 0,
    wireStatus: 'Not Initiated',
  }
];

export const INITIAL_SPVS: SPV[] = [
  { id: 'SPV-A', name: 'SPV Alpha (Growth Tech)', allocatedAmount: 15000000, targetPercentage: 50 },
  { id: 'SPV-B', name: 'SPV Beta (Energy Infra)', allocatedAmount: 9000000, targetPercentage: 30 },
  { id: 'RES-01', name: 'Liquidity Reserve', allocatedAmount: 6000000, targetPercentage: 20 }
];
