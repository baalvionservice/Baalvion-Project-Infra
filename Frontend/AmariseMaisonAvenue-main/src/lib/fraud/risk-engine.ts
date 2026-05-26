/**
 * @fileOverview Institutional Fraud Detection & Risk Scoring Engine
 * Implements weighted heuristic logic for high-value acquisition security.
 */

import {
  VipClient,
  CartItem,
  CountryCode,
  RiskLevel,
  FraudLog,
} from "../types";

export interface RiskAnalysis {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  reason: string;
  action: "allow" | "flag" | "block";
}

export class RiskEngine {
  /**
   * Performs a real-time risk audit on a potential acquisition intent.
   */
  static evaluateAcquisitionRisk(
    user: VipClient | null,
    cart: CartItem[],
    hub: CountryCode,
    metadata: {
      attemptCount: number;
      ipHub: string;
    }
  ): RiskAnalysis {
    let score = 0;
    const reasons: string[] = [];

    // 1. Magnitude Check (Luxury Magnitude)
    const totalValue = cart.reduce((acc, i) => acc + i.basePrice, 0);
    if (totalValue > 50000) {
      score += 20;
      reasons.push("High-magnitude acquisition ($50k+).");
    }

    // 2. Persona Verification (History Weight)
    if (!user || user.totalSpend === 0) {
      score += 30;
      reasons.push("First-time collector node.");
    } else if (user.tier === "Diamond") {
      score -= 40; // Trusted VIP discount
    }

    // 3. Jurisdictional Mismatch
    if (metadata.ipHub !== hub.toUpperCase()) {
      score += 40;
      reasons.push(
        `Jurisdictional mismatch: IP Hub (${
          metadata.ipHub
        }) vs Market Hub (${hub.toUpperCase()}).`
      );
    }

    // 4. Velocity Tracking
    if (metadata.attemptCount > 3) {
      score += 50;
      reasons.push("Excessive settlement attempts detected.");
    }

    // Final Normalization
    const finalScore = Math.min(100, Math.max(0, score));

    let level: "low" | "medium" | "high" | "critical" = "low";
    let action: "allow" | "flag" | "block" = "allow";

    if (finalScore >= 71) {
      level = "high";
      action = "block";
    } else if (finalScore >= 31) {
      level = "medium";
      action = "flag";
    }

    return {
      score: finalScore,
      level,
      reason:
        reasons.length > 0
          ? reasons.join(" ")
          : "Transaction behavior optimal.",
      action,
    };
  }

  /**
   * Generates an immutable Fraud Log entry.
   */
  static createLog(
    userId: string,
    analysis: RiskAnalysis,
    orderId?: string
  ): Omit<FraudLog, "id"> {
    return {
      userId,
      orderId,
      riskScore: analysis.score,
      riskLevel: analysis.level === "critical" ? "high" : analysis.level,
      reason: analysis.reason,
      actionTaken: analysis.action,
      timestamp: new Date().toISOString(),
      metadata: {},
    };
  }
}
