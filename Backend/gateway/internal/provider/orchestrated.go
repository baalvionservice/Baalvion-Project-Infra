package provider

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/baalvion/gateway/internal/model"
)

// This file makes Upstream and Direct satisfy the richer orchestrator.Provider
// interface using neutral model.* types (no orchestrator import → no cycle).
//
// Real-provider semantics: for residential/ISP/mobile products, "allocating an
// IP" and "rotating a session" are done by encoding targeting + a session id in
// the upstream username — there is no per-IP allocation API to call. So
// AllocateIP builds the concrete endpoint the gateway will dial, and
// RotateSession is a no-op at the provider (the caller issues a new session id).

// ── Upstream ──────────────────────────────────────────────────────────────────

func (u *Upstream) Authenticate(ctx context.Context) error {
	// Data-path credentials (username/password) are validated by the upstream on
	// CONNECT/SOCKS auth. If a mgmt API token is configured we trust it here.
	return nil
}

func (u *Upstream) CostPerGB() float64 { return u.cfg.CostPerGB }

func (u *Upstream) GeoCaps() []model.GeoCapability {
	caps := make([]model.GeoCapability, 0, len(u.cfg.Countries))
	for _, c := range u.cfg.Countries {
		caps = append(caps, model.GeoCapability{Country: c})
	}
	return caps
}

func (u *Upstream) ASNCaps() []model.ASNCapability {
	caps := make([]model.ASNCapability, 0, len(u.cfg.ASNs))
	for _, a := range u.cfg.ASNs {
		caps = append(caps, model.ASNCapability{ASN: a})
	}
	return caps
}

func (u *Upstream) AllocateIP(ctx context.Context, req model.AllocationRequest) (*model.ProxyEndpoint, error) {
	dirs := model.Directives{
		Country: req.Country, State: req.State, City: req.City, ASN: req.ASN, Session: req.SessionID,
	}
	host, port := splitHostPort(u.cfg.Address)
	return &model.ProxyEndpoint{
		Provider:  u.cfg.Name,
		Host:      host,
		Port:      port,
		Username:  formatUsername(u.cfg.UsernameTemplate, dirs),
		Password:  u.cfg.Password,
		Kind:      u.cfg.Kind,
		Country:   req.Country,
		SessionID: req.SessionID,
	}, nil
}

func (u *Upstream) RotateSession(ctx context.Context, sessionID string) error {
	// Stateless for these providers — the caller allocates a new session id.
	return nil
}

func (u *Upstream) Health(ctx context.Context) (*model.HealthStatus, error) {
	start := time.Now()
	err := u.HealthCheck(ctx) // real TCP/TLS reachability probe (Prompt 3)
	st := &model.HealthStatus{LatencyMs: float64(time.Since(start).Milliseconds()), CheckedAt: time.Now()}
	if err != nil {
		st.State = model.StateOffline
		st.LastError = err.Error()
		st.SuccessRate = 0
		return st, nil
	}
	st.State = model.StateHealthy
	st.SuccessRate = 1
	return st, nil
}

func (u *Upstream) GetUsage(ctx context.Context) (*model.UsageStats, error) {
	if u.cfg.UsageAPIURL == "" {
		// No provider usage API configured — Baalvion's own metering is the
		// authoritative source for this provider's consumption/cost.
		return &model.UsageStats{Available: false, Source: "baalvion-metering"}, nil
	}
	reqHTTP, err := http.NewRequestWithContext(ctx, http.MethodGet, u.cfg.UsageAPIURL, nil)
	if err != nil {
		return &model.UsageStats{Available: false, Source: "error"}, err
	}
	if u.cfg.APIToken != "" {
		reqHTTP.Header.Set("Authorization", "Bearer "+u.cfg.APIToken)
	}
	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(reqHTTP)
	if err != nil {
		return &model.UsageStats{Available: false, Source: "error"}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return &model.UsageStats{Available: false, Source: "http_" + strconv.Itoa(resp.StatusCode)}, nil
	}
	// Best-effort generic parse; provider-specific mapping is operator config.
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	var generic struct {
		Bytes    int64 `json:"bytes"`
		Requests int64 `json:"requests"`
	}
	_ = json.Unmarshal(body, &generic)
	return &model.UsageStats{Available: true, Bytes: generic.Bytes, Requests: generic.Requests, Source: u.cfg.Name}, nil
}

// ── Direct ────────────────────────────────────────────────────────────────────

func (d *Direct) Authenticate(context.Context) error { return nil }
func (d *Direct) CostPerGB() float64                 { return 0 }
func (d *Direct) GeoCaps() []model.GeoCapability     { return nil }
func (d *Direct) ASNCaps() []model.ASNCapability     { return nil }
func (d *Direct) RotateSession(context.Context, string) error { return nil }

func (d *Direct) AllocateIP(ctx context.Context, req model.AllocationRequest) (*model.ProxyEndpoint, error) {
	return &model.ProxyEndpoint{Provider: "direct", Country: req.Country, SessionID: req.SessionID, Kind: "direct"}, nil
}

func (d *Direct) Health(context.Context) (*model.HealthStatus, error) {
	return &model.HealthStatus{State: model.StateHealthy, SuccessRate: 1, CheckedAt: time.Now()}, nil
}

func (d *Direct) GetUsage(context.Context) (*model.UsageStats, error) {
	return &model.UsageStats{Available: false, Source: "baalvion-metering"}, nil
}

func splitHostPort(addr string) (string, int) {
	h, p, err := net.SplitHostPort(addr)
	if err != nil {
		return addr, 0
	}
	port, _ := strconv.Atoi(p)
	return h, port
}
