export type Environment = "mock" | "production";

export const ENV_CONFIG = {
  mode: "mock" as Environment,
  enableMockLatency: true,
  mockLatencyMs: 400,
  enableFailureSimulation: false, // Set to true to test UI error handling
  failureRate: 0.05, // 5% chance of failure if simulation is on
  enableConsoleAudit: true,
  storageKey: "baalvion-ir-platform-v1"
};
