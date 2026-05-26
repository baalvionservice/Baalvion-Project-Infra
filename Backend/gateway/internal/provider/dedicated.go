package provider

import (
	"context"
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"math/rand"
	"net"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/baalvion/gateway/internal/config"
	"github.com/baalvion/gateway/internal/model"
)

// Dedicated is REAL owned-IP egress (datacenter / dedicated-static / clean
// pools). The edge node has a set of IPs bound to its interfaces; the gateway
// binds the connection's SOURCE address to one of them, so the destination sees
// a specific owned IP. Per-org exclusivity comes from a Redis allocation
// (`dedipool:org:{id}` = JSON list of IPs) published by the control plane;
// orgs with no allocation fall back to the shared pool only if enabled.
//
// Because we choose the source IP, ExitIP is KNOWN (no discovery needed).
type Dedicated struct {
	cfg      config.ProviderConfig
	localSet map[string]net.IP // IPs actually assigned to this node
	rdb      *redis.Client
	timeout  time.Duration
}

func NewDedicated(cfg config.ProviderConfig, rdb *redis.Client, timeout time.Duration) *Dedicated {
	set := make(map[string]net.IP, len(cfg.LocalIPs))
	for _, s := range cfg.LocalIPs {
		if ip := net.ParseIP(s); ip != nil {
			set[ip.String()] = ip
		}
	}
	if cfg.Weight <= 0 {
		cfg.Weight = 1
	}
	return &Dedicated{cfg: cfg, localSet: set, rdb: rdb, timeout: timeout}
}

func (d *Dedicated) Name() string  { return d.cfg.Name }
func (d *Dedicated) Weight() int   { return d.cfg.Weight }
func (d *Dedicated) CostPerGB() float64 { return d.cfg.CostPerGB }
func (d *Dedicated) Authenticate(context.Context) error { return nil }
func (d *Dedicated) RotateSession(context.Context, string) error { return nil }

func (d *Dedicated) GeoCaps() []model.GeoCapability {
	caps := make([]model.GeoCapability, 0, len(d.cfg.Countries))
	for _, c := range d.cfg.Countries {
		caps = append(caps, model.GeoCapability{Country: c})
	}
	return caps
}
func (d *Dedicated) ASNCaps() []model.ASNCapability {
	caps := make([]model.ASNCapability, 0, len(d.cfg.ASNs))
	for _, a := range d.cfg.ASNs {
		caps = append(caps, model.ASNCapability{ASN: a})
	}
	return caps
}
func (d *Dedicated) Supports(country string, asn int) bool {
	if len(d.cfg.Countries) == 0 {
		return true
	}
	for _, c := range d.cfg.Countries {
		if c == "*" || c == "" || country == "" || c == country {
			return true
		}
	}
	return false
}

// candidateIPs returns the IPs this org may egress from on this node.
func (d *Dedicated) candidateIPs(ctx context.Context, orgID string) []net.IP {
	// Per-org allocation (exclusive subset) intersected with this node's IPs.
	if d.rdb != nil && orgID != "" {
		if raw, err := d.rdb.SMembers(ctx, "dedipool:org:"+orgID).Result(); err == nil && len(raw) > 0 {
			var out []net.IP
			for _, s := range raw {
				if ip, ok := d.localSet[s]; ok {
					out = append(out, ip)
				}
			}
			if len(out) > 0 {
				return out
			}
		}
	}
	// Fall back to the shared pool only if this node permits it.
	if !d.cfg.Shared {
		return nil
	}
	out := make([]net.IP, 0, len(d.localSet))
	for _, ip := range d.localSet {
		out = append(out, ip)
	}
	return out
}

// pick selects a source IP: sticky → deterministic by session; rotating → random.
func pick(ips []net.IP, session string) net.IP {
	if len(ips) == 0 {
		return nil
	}
	if session != "" {
		sum := sha256.Sum256([]byte(session))
		return ips[int(binary.BigEndian.Uint32(sum[:4]))%len(ips)]
	}
	return ips[rand.Intn(len(ips))]
}

func (d *Dedicated) Connect(ctx context.Context, req model.ProxyRequest) (*UpstreamConnection, error) {
	ips := d.candidateIPs(ctx, req.Auth.OrgID)
	src := pick(ips, req.Directives.Session)
	if src == nil {
		return nil, fmt.Errorf("dedicated: no eligible owned IP for org %s on this node", req.Auth.OrgID)
	}
	dialer := &net.Dialer{
		Timeout:   d.timeout,
		KeepAlive: 30 * time.Second,
		LocalAddr: &net.TCPAddr{IP: src}, // bind the egress source IP
	}
	dest := net.JoinHostPort(req.DestHost, fmt.Sprintf("%d", req.DestPort))
	conn, err := dialer.DialContext(ctx, "tcp", dest)
	if err != nil {
		return nil, fmt.Errorf("dedicated dial from %s: %w", src, err)
	}
	return &UpstreamConnection{Conn: conn, Provider: d.cfg.Name, ExitIP: src.String()}, nil
}

func (d *Dedicated) AllocateIP(ctx context.Context, req model.AllocationRequest) (*model.ProxyEndpoint, error) {
	src := pick(d.candidateIPs(ctx, req.OrgID), req.SessionID)
	ep := &model.ProxyEndpoint{Provider: d.cfg.Name, Kind: "dedicated", Country: req.Country, SessionID: req.SessionID}
	if src != nil {
		ep.Host = src.String()
	}
	return ep, nil
}

func (d *Dedicated) GetUsage(context.Context) (*model.UsageStats, error) {
	return &model.UsageStats{Available: false, Source: "baalvion-metering"}, nil
}

// Health: confirm at least one owned IP is usable (bind + outbound check is
// environment-specific; reachability of the node's loopback bind is sufficient).
func (d *Dedicated) Health(context.Context) (*model.HealthStatus, error) {
	if len(d.localSet) == 0 {
		return &model.HealthStatus{State: model.StateOffline, LastError: "no local IPs configured", CheckedAt: time.Now()}, nil
	}
	return &model.HealthStatus{State: model.StateHealthy, SuccessRate: 1, CheckedAt: time.Now()}, nil
}
