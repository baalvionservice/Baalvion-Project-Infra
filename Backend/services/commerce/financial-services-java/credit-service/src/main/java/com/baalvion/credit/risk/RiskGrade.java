package com.baalvion.credit.risk;

/** Credit risk grade, derived from the composite score. E is non-approvable. */
public enum RiskGrade {
  A, B, C, D, E;

  public static RiskGrade fromScore(int score) {
    if (score >= 800) return A;
    if (score >= 700) return B;
    if (score >= 600) return C;
    if (score >= 500) return D;
    return E;
  }
}
