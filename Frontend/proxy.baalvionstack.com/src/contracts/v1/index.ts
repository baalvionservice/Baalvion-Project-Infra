/**
 * Contracts v1 - Public API
 * 
 * All canonical data contracts for backend integration
 */

// Base types
export * from "./base";

// Identity (User, Org, Role, Permission)
export * from "./identity";

// Billing (Plan, Feature, Invoice, Subscription)
export * from "./billing";

// Proxy (Proxy, IPPool, Provider, Routing)
export * from "./proxy";

// Events (System events, Audit, Alerts)
export * from "./events";

// Errors (Error taxonomy, failure states)
export * from "./errors";

// Feature Flags
export * from "./feature-flags";

// Contract version
export { CONTRACT_VERSION } from "./base";
