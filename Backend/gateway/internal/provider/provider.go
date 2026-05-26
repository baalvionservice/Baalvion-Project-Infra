// Package provider defines the upstream proxy provider abstraction and the real
// (config-driven) adapters that dial commercial proxy networks.
package provider

import (
	"context"
	"net"

	"github.com/baalvion/gateway/internal/model"
)

// UpstreamConnection is a live TCP stream to the destination, tunneled through
// an upstream provider (or directly, for the `direct` egress).
type UpstreamConnection struct {
	Conn     net.Conn
	Provider string
	ExitIP   string // populated only if cheaply known; never fabricated
}

// Region advertises a provider's geo coverage.
type Region struct {
	Country string
	States  []string
	Cities  []string
}

// Provider is the upstream routing contract (as specified).
type Provider interface {
	Name() string
	Connect(ctx context.Context, req model.ProxyRequest) (*UpstreamConnection, error)
	HealthCheck(ctx context.Context) error
	GetRegions() []Region
	GetASNCapabilities() []int
	Weight() int
	// Supports reports whether this provider can serve the requested geo/ASN.
	Supports(country string, asn int) bool
}
