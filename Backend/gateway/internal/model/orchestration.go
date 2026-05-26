package model

import "time"

// Orchestration value types live here (the neutral, dependency-free package) so
// both the provider adapters and the orchestrator can share them without an
// import cycle.

type ProviderState int

const (
	StateHealthy ProviderState = iota
	StateDegraded
	StateUnhealthy
	StateOffline
)

func (s ProviderState) String() string {
	switch s {
	case StateHealthy:
		return "HEALTHY"
	case StateDegraded:
		return "DEGRADED"
	case StateUnhealthy:
		return "UNHEALTHY"
	default:
		return "OFFLINE"
	}
}

// AllocationRequest is the normalized targeting + context for a routing decision.
type AllocationRequest struct {
	OrgID     string
	Country   string
	State     string
	City      string
	ASN       int
	SessionID string
	Rotation  string
	Plan      string
	Target    string
}

// ProxyEndpoint is a concrete upstream the gateway will dial.
type ProxyEndpoint struct {
	Provider  string
	Host      string
	Port      int
	Username  string
	Password  string
	Kind      string
	Country   string
	SessionID string
}

type HealthStatus struct {
	State       ProviderState
	SuccessRate float64
	LatencyMs   float64
	BanRate     float64
	LastError   string
	CheckedAt   time.Time
}

type GeoCapability struct {
	Country string
	States  []string
	Cities  []string
}

type ASNCapability struct {
	ASN  int
	Name string
}

type UsageStats struct {
	Available bool
	Bytes     int64
	Requests  int64
	Source    string
}
