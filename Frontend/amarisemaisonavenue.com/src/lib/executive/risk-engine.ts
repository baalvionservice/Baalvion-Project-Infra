/**
 * @fileOverview Institutional Risk Scoring Engine
 * Calculates a 0-100 score representing the platform's current risk exposure.
 */

import { MaisonAlert, MaisonError, FraudLog, Transaction } from '../types';

export interface RiskScorecard {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    financial: number;
    technical: number;
    security: number;
    operational: number;
  };
}

export class ExecutiveRiskEngine {
  /**
   * Generates the Institutional Risk Score.
   * Logic: High scores indicate high system danger.
   */
  static calculatePlatformRisk(
    transactions: Transaction[],
    errors: MaisonError[],
    fraudLogs: FraudLog[],
    alerts: MaisonAlert[]
  ): RiskScorecard {
    // 1. Financial Risk (Payment Failures & Refunds)
    const recentTrans = transactions.slice(0, 50);
    const failureRate = (recentTrans.filter(t => t.status === 'Refunded').length / (recentTrans.length || 1)) * 100;
    const financialRisk = Math.min(100, failureRate * 5);

    // 2. Technical Risk (Unresolved Errors & Critical Alerts)
    const activeErrors = errors.filter(e => !e.resolved).length;
    const technicalRisk = Math.min(100, activeErrors * 15);

    // 3. Security Risk (High-Risk Fraud Logs)
    const highRiskFraud = fraudLogs.filter(f => f.riskLevel === 'high').length;
    const securityRisk = Math.min(100, highRiskFraud * 25);

    // 4. Operational Risk (Active Alerts)
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const operationalRisk = Math.min(100, activeAlerts * 10);

    // Weighted Aggregate Score
    const score = Math.round(
      (financialRisk * 0.4) + 
      (technicalRisk * 0.3) + 
      (securityRisk * 0.2) + 
      (operationalRisk * 0.1)
    );

    let level: RiskScorecard['level'] = 'low';
    if (score > 75) level = 'critical';
    else if (score > 50) level = 'high';
    else if (score > 25) level = 'medium';

    return {
      score,
      level,
      factors: {
        financial: financialRisk,
        technical: technicalRisk,
        security: securityRisk,
        operational: operationalRisk
      }
    };
  }
}
