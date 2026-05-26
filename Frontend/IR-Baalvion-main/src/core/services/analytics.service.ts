'use client';

import { auditService } from "./audit.service";
import { votingService } from "./voting.service";
import { pageService } from "./page.service";
import { notificationService } from "./notification.service";
import { settingsService } from "./settings.service";
import { ModuleName, UserRole } from "../content/schemas";

export interface GovernanceMetrics {
  totalActions: number;
  roleDistribution: Record<UserRole, number>;
  avgApprovalTimeHours: number;
  moduleActivity: Record<string, number>;
  freezeEvents: number;
}

export interface VotingAnalytics {
  avgParticipationRate: number;
  quorumComplianceRate: number;
  approvalConsistency: number;
  stabilityScore: number;
  topVotingGroup: UserRole;
}

export interface RiskProfile {
  score: number; // 0-100
  level: 'Low' | 'Moderate' | 'High';
  flaggedIssues: string[];
}

export interface IntelligenceSnapshot {
  timestamp: string;
  metrics: GovernanceMetrics;
  voting: VotingAnalytics;
  risk: RiskProfile;
  trends: { date: string; activity: number; risk: number }[];
}

export const analyticsService = {
  getGovernanceMetrics: async (): Promise<GovernanceMetrics> => {
    const logs = await auditService.getLogs();
    const settings = await settingsService.getSettings();
    
    const roleDist: Record<any, number> = {};
    const moduleAct: Record<any, number> = {};
    
    logs.forEach(log => {
      roleDist[log.userRole] = (roleDist[log.userRole] || 0) + 1;
      moduleAct[log.module] = (moduleAct[log.module] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      roleDistribution: roleDist as any,
      avgApprovalTimeHours: 4.2, // Mock calculated average
      moduleActivity: moduleAct,
      freezeEvents: settings.features.freezePublishing ? 1 : 0
    };
  },

  getVotingAnalytics: async (): Promise<VotingAnalytics> => {
    const votes = await votingService.getVotes();
    const totalVotes = votes.length;
    
    if (totalVotes === 0) return { avgParticipationRate: 0, quorumComplianceRate: 0, approvalConsistency: 0, stabilityScore: 0, topVotingGroup: 'BoardMember' };

    const avgParticipation = votes.reduce((acc, v) => acc + (v.results?.participationRate || 0), 0) / totalVotes;
    const quorumMet = votes.filter(v => v.results?.isQuorumMet).length;
    
    return {
      avgParticipationRate: Math.round(avgParticipation),
      quorumComplianceRate: Math.round((quorumMet / totalVotes) * 100),
      approvalConsistency: 88,
      stabilityScore: Math.round((avgParticipation * 0.88) / 1.1), // Mock stability formula
      topVotingGroup: 'BoardMember'
    };
  },

  getRiskProfile: async (): Promise<RiskProfile> => {
    const metrics = await analyticsService.getGovernanceMetrics();
    const voting = await analyticsService.getVotingAnalytics();
    
    const issues: string[] = [];
    let score = 15; // Base risk baseline

    if (voting.avgParticipationRate < 60) {
      score += 25;
      issues.push("Low average voting participation detected (< 60%).");
    }
    if (metrics.freezeEvents > 0) {
      score += 10;
      issues.push("System-wide publishing freeze currently active.");
    }
    if (metrics.avgApprovalTimeHours > 24) {
      score += 15;
      issues.push("Workflow bottleneck: Average approval time exceeds 24h.");
    }

    return {
      score: Math.min(score, 100),
      level: score > 60 ? 'High' : score > 30 ? 'Moderate' : 'Low',
      flaggedIssues: issues
    };
  },

  getTrendData: async (days: number = 30): Promise<any[]> => {
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activity: Math.floor(Math.random() * 50) + 10,
        risk: Math.floor(Math.random() * 20) + 10
      });
    }
    return data;
  },

  getExecutiveSummary: async (): Promise<string> => {
    const risk = await analyticsService.getRiskProfile();
    const voting = await analyticsService.getVotingAnalytics();
    
    return `Governance Intelligence Summary: The platform currently maintains a '${risk.level}' risk profile with a Stability Score of ${voting.stabilityScore}/100. Voting participation remains healthy at ${voting.avgParticipationRate}%, with quorum met in ${voting.quorumComplianceRate}% of institutional resolutions. Critical focus areas include resolving ${risk.flaggedIssues.length} flagged compliance flags related to workflow throughput.`;
  },

  getForecast: async (): Promise<any[]> => {
    const data = [];
    const labels = ['Q1 26', 'Q2 26', 'Q3 26', 'Q4 26'];
    let base = 65;
    for (const label of labels) {
      base += Math.floor(Math.random() * 10);
      data.push({ quarter: label, maturity: base });
    }
    return data;
  }
};
