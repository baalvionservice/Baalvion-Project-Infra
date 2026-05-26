package orchestrator

import (
	"context"

	"github.com/baalvion/gateway/internal/model"
	"github.com/baalvion/gateway/internal/provider"
)

// Provider is the orchestrated provider contract (Prompt-5). It is a superset of
// the data-path provider.Provider; method names that would collide with the
// existing interface use distinct names (Health, GeoCaps, ASNCaps) so a single
// adapter (Upstream/Direct) satisfies both.
//
// Real-provider note: AllocateIP/RotateSession encode geo + sticky session into
// the upstream username — this is exactly how Bright Data/Oxylabs/SOAX/Smartproxy/
// IPRoyal residential & mobile products work. GetUsage hits the provider's own
// usage API only when configured; otherwise Baalvion's metering is authoritative.
type Provider interface {
	Name() string
	Authenticate(ctx context.Context) error
	AllocateIP(ctx context.Context, req AllocationRequest) (*ProxyEndpoint, error)
	Connect(ctx context.Context, req model.ProxyRequest) (*provider.UpstreamConnection, error)
	RotateSession(ctx context.Context, sessionID string) error
	GetUsage(ctx context.Context) (*UsageStats, error)
	Health(ctx context.Context) (*HealthStatus, error)
	GeoCaps() []GeoCapability
	ASNCaps() []ASNCapability
	Weight() int
	CostPerGB() float64
	Supports(country string, asn int) bool
}
