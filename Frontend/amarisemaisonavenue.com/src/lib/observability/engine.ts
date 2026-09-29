/**
 * @fileOverview Institutional Observability Engine (Mock SRE)
 * Handles metrics calculation, alert triggering, and health scoring.
 * Enhanced for Category-level monitoring and Threshold-based logic.
 */

import { MaisonMetric, MaisonAlert, SystemHealthScore, CountryCode } from '../types';

export class ObservabilityEngine {
  private static instance: ObservabilityEngine;
  private metrics: MaisonMetric[] = [];
  private alerts: MaisonAlert[] = [];

  private constructor() {}

  public static getInstance(): ObservabilityEngine {
    if (!ObservabilityEngine.instance) {
      ObservabilityEngine.instance = new ObservabilityEngine();
    }
    return ObservabilityEngine.instance;
  }

  /**
   * Records a new system metric with typed categorization
   */
  public recordMetric(params: Omit<MaisonMetric, 'id' | 'timestamp'>) {
    const metric: MaisonMetric = {
      ...params,
      id: `met_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    this.metrics.unshift(metric);
    if (this.metrics.length > 5000) this.metrics.pop();

    this.evaluateAlerts(metric);
    return metric;
  }

  /**
   * Evaluates if a metric should trigger an institutional alert
   */
  private evaluateAlerts(metric: MaisonMetric) {
    // 1. Payment Success Rate Monitor (Critical Threshold: < 85%)
    if (metric.name === 'payment_success_rate' && metric.value < 85) {
      this.triggerAlert({
        type: 'payment',
        severity: 'critical',
        message: `High Payment Failure Detected: ${metric.value.toFixed(1)}% success rate in ${metric.country.toUpperCase()} Hub.`,
        country: metric.country
      });
    }

    // 2. Latency Monitor (Warning: > 500ms)
    if (metric.name === 'api_response_time' && metric.value > 500) {
      this.triggerAlert({
        type: 'api',
        severity: 'medium',
        message: `Degraded API Performance: ${metric.value.toFixed(0)}ms avg response time.`,
        country: metric.country
      });
    }

    // 3. Inventory Contention Monitor (Alert: > 10 failures)
    if (metric.name === 'stock_lock_fail_count' && metric.value > 10) {
      this.triggerAlert({
        type: 'inventory',
        severity: 'high',
        message: `Critical Stock Contention: ${metric.value} failed locks detected. Possible bot activity.`,
        country: metric.country
      });
    }

    // 4. Logistics Delay Monitor
    if (metric.name === 'shipment_delay_count' && metric.value > 5) {
      this.triggerAlert({
        type: 'operational',
        severity: 'medium',
        message: `Dispatch Lag: ${metric.value} shipments exceeded 24h prep window.`,
        country: metric.country
      });
    }
  }

  /**
   * Triggers an institutional alert
   */
  public triggerAlert(params: Omit<MaisonAlert, 'id' | 'triggeredAt' | 'status'>) {
    const alert: MaisonAlert = {
      ...params,
      id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      triggeredAt: new Date().toISOString(),
      status: 'active'
    };
    
    // Prevent duplicate active alerts for the same issue
    const isDuplicate = this.alerts.some(a => 
      a.status === 'active' && 
      a.type === alert.type && 
      a.country === alert.country &&
      a.severity === alert.severity
    );

    if (!isDuplicate) {
      this.alerts.unshift(alert);
      if (this.alerts.length > 500) this.alerts.pop();
      console.warn(`%c[SRE ALERT] 🚨 ${alert.severity.toUpperCase()} | ${alert.message}`, 'color: #ef4444; font-weight: bold;');
    }
    
    return alert;
  }

  /**
   * Calculates the overall System Health Score (0-100)
   * Formula: (Payments * 0.4) + (API * 0.3) + (Inventory * 0.2) + (AI/Ops * 0.1)
   */
  public calculateHealth(country: CountryCode | 'global' = 'global'): SystemHealthScore {
    const filter = (m: MaisonMetric) => country === 'global' ? true : m.country === country;
    
    const getAvg = (name: string, fallback = 100) => {
      const relevant = this.metrics.filter(m => m.name === name && filter(m));
      if (relevant.length === 0) return fallback;
      return relevant.reduce((a, b) => a + b.value, 0) / relevant.length;
    };

    // Subsystem Scores
    const paymentScore = getAvg('payment_success_rate');
    const apiScore = Math.max(0, 100 - (getAvg('api_response_time', 50) / 10));
    const inventoryScore = Math.max(0, 100 - (getAvg('stock_lock_fail_count', 0) * 5));
    const aiScore = getAvg('ai_decision_confidence', 95);
    const operationalScore = Math.max(0, 100 - (getAvg('shipment_delay_count', 0) * 10));

    // Weighted Overall Score
    const overall = (paymentScore * 0.4) + (apiScore * 0.3) + (inventoryScore * 0.2) + (operationalScore * 0.1);

    return {
      overall: Math.round(overall),
      subsystems: {
        payments: Math.round(paymentScore),
        api: Math.round(apiScore),
        inventory: Math.round(inventoryScore),
        ai: Math.round(aiScore),
        operational: Math.round(operationalScore)
      },
      lastUpdated: new Date().toISOString()
    };
  }

  public getRegistry() {
    return {
      metrics: this.metrics,
      alerts: this.alerts
    };
  }
}

export const obsEngine = ObservabilityEngine.getInstance();
