package provider

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/baalvion/gateway/internal/model"
)

// Direct is a REAL egress that connects to the destination directly from the
// gateway's own IP (a datacenter-direct egress). It is not a simulated upstream:
// traffic genuinely flows. It exists so the full data path (auth → tunnel →
// metering) can run without third-party provider credentials, and as a valid
// datacenter offering. Enable with ALLOW_DIRECT=true. It ignores geo targeting.
type Direct struct {
	dialer *net.Dialer
}

func NewDirect(dialTimeout time.Duration) *Direct {
	return &Direct{dialer: &net.Dialer{Timeout: dialTimeout, KeepAlive: 30 * time.Second}}
}

func (d *Direct) Name() string              { return "direct" }
func (d *Direct) Weight() int               { return 1 }
func (d *Direct) GetASNCapabilities() []int { return nil }
func (d *Direct) GetRegions() []Region      { return nil }
func (d *Direct) Supports(string, int) bool { return true }
func (d *Direct) HealthCheck(context.Context) error { return nil }

func (d *Direct) Connect(ctx context.Context, req model.ProxyRequest) (*UpstreamConnection, error) {
	dest := net.JoinHostPort(req.DestHost, fmt.Sprintf("%d", req.DestPort))
	conn, err := d.dialer.DialContext(ctx, "tcp", dest)
	if err != nil {
		return nil, fmt.Errorf("direct dial %s: %w", dest, err)
	}
	return &UpstreamConnection{Conn: conn, Provider: "direct"}, nil
}
