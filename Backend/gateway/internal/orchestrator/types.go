// Package orchestrator is the routing brain of the proxy network: provider
// health state machine, circuit breakers, capability-aware + cost-aware
// selection, failover, ban scoring and session affinity.
//
// The shared value types live in internal/model (to avoid a provider<->orchestrator
// import cycle) and are aliased here for ergonomic in-package use.
package orchestrator

import "github.com/baalvion/gateway/internal/model"

type (
	ProviderState     = model.ProviderState
	AllocationRequest = model.AllocationRequest
	ProxyEndpoint     = model.ProxyEndpoint
	HealthStatus      = model.HealthStatus
	GeoCapability     = model.GeoCapability
	ASNCapability     = model.ASNCapability
	UsageStats        = model.UsageStats
)

const (
	StateHealthy   = model.StateHealthy
	StateDegraded  = model.StateDegraded
	StateUnhealthy = model.StateUnhealthy
	StateOffline   = model.StateOffline
)

// RoutingStrategy selects how candidates are ranked.
type RoutingStrategy string

const (
	StrategyWeighted     RoutingStrategy = "weighted"
	StrategyLeastLatency RoutingStrategy = "least_latency"
	StrategyLeastFailure RoutingStrategy = "least_failure"
	StrategyCostAware    RoutingStrategy = "cost_aware"
	StrategyPremium      RoutingStrategy = "premium"
)
