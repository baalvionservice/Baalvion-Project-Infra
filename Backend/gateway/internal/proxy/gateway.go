package proxy

import (
	"context"
	"errors"
	"net"
	"strconv"
	"time"

	"github.com/baalvion/gateway/internal/auth"
	"github.com/baalvion/gateway/internal/enforce"
	"github.com/baalvion/gateway/internal/metering"
	"github.com/baalvion/gateway/internal/metrics"
	"github.com/baalvion/gateway/internal/model"
	"github.com/baalvion/gateway/internal/orchestrator"
	"github.com/baalvion/gateway/internal/provider"
	"github.com/baalvion/gateway/internal/quota"
	"github.com/baalvion/gateway/internal/ratelimit"
	"github.com/baalvion/gateway/internal/security"
	"github.com/baalvion/gateway/internal/session"
)

var (
	ErrBlockedDest   = errors.New("destination blocked")
	ErrConcurrency   = errors.New("concurrency limit reached")
	ErrRateLimited   = errors.New("rate limit exceeded")
	ErrUpstreamDial  = errors.New("no upstream available")
	ErrQuotaExceeded = errors.New("quota exhausted")
	ErrEnforced      = errors.New("blocked by enforcement")
	ErrGeoRestricted = errors.New("geo restricted")
)

// Gateway holds the shared data-plane dependencies used by both the HTTP/CONNECT
// and SOCKS5 servers.
type Gateway struct {
	Auth         *auth.Authenticator
	Orchestrator *orchestrator.Orchestrator
	Sessions     *session.Allocator
	Meter        *metering.Emitter
	Limiter      *ratelimit.Limiter
	Guard        *security.Guard
	Quota        *quota.Checker
	Enforce      *enforce.Checker
	Idle         time.Duration
}

// authorizeAndDial runs SSRF, concurrency, rate, geo-session and routing checks
// and returns a live upstream connection plus a release func to call when done.
func (g *Gateway) authorizeAndDial(ctx context.Context, ac model.AuthContext, dirs model.Directives, host string, port int, clientIP string) (*provider.UpstreamConnection, func(), error) {
	if err := g.Guard.CheckDestination(host); err != nil {
		return nil, nil, ErrBlockedDest
	}

	// Threat intelligence — block known malware/phishing/botnet/sanctioned dests.
	if cat, blocked := g.Enforce.DestinationBlocked(ctx, host); blocked {
		metrics.BlockedDestinations.WithLabelValues(cat).Inc()
		return nil, nil, ErrBlockedDest
	}

	// Quota gate — consulted BEFORE any upstream connection (Redis flag set by
	// the billing/metering service). Fails open on Redis trouble.
	if g.Quota.Blocked(ctx, ac.OrgID) {
		metrics.QuotaDenials.Inc()
		return nil, nil, ErrQuotaExceeded
	}

	// Trust & Safety enforcement — org sanctions (suspend/ban/geo).
	if d := g.Enforce.Org(ctx, ac.OrgID); d.Blocked {
		metrics.EnforcementBlocks.WithLabelValues("org_blocked").Inc()
		return nil, nil, ErrEnforced
	} else if !d.GeoAllowed(dirs.Country) {
		metrics.EnforcementBlocks.WithLabelValues("geo_restricted").Inc()
		return nil, nil, ErrGeoRestricted
	}

	limits := ratelimit.Limits(ac.Plan)

	if !g.Limiter.AllowRPM(ctx, "proxy:"+ac.OrgID, limits.RequestsPerMin, time.Minute) {
		return nil, nil, ErrRateLimited
	}

	ok, _ := g.Limiter.AcquireConcurrency(ctx, ac.OrgID, limits.Concurrency)
	if !ok {
		return nil, nil, ErrConcurrency
	}
	release := func() { g.Limiter.ReleaseConcurrency(context.Background(), ac.OrgID) }

	req := model.ProxyRequest{
		Auth:       ac,
		Directives: dirs,
		DestHost:   host,
		DestPort:   port,
		Network:    "tcp",
		ClientIP:   clientIP,
	}

	preferred := ""
	if dirs.Rotation == "sticky" {
		if alloc, ok := g.Sessions.Get(ctx, ac.OrgID, dirs.Session); ok {
			preferred = alloc.Provider
		}
	}

	upstream, err := g.Orchestrator.Dial(ctx, req, preferred)
	if err != nil {
		release()
		return nil, nil, ErrUpstreamDial
	}

	if dirs.Rotation == "sticky" && dirs.Session != "" {
		g.Sessions.Pin(ctx, ac.OrgID, dirs.Session, session.Allocation{
			Provider: upstream.Provider, Country: dirs.Country, ExitIP: upstream.ExitIP,
		})
	}
	return upstream, release, nil
}

// finishTunnel streams data, records metrics, emits a metering event, and
// releases resources. It takes ownership of both connections.
func (g *Gateway) finishTunnel(client net.Conn, upstream *provider.UpstreamConnection, ac model.AuthContext, dirs model.Directives, host string, protocol string, start time.Time, release func()) {
	metrics.ActiveConnections.Inc()
	defer metrics.ActiveConnections.Dec()
	defer release()
	defer upstream.Conn.Close()

	bytesOut, bytesIn := Tunnel(client, upstream.Conn, g.Idle)

	metrics.BytesTransferred.WithLabelValues("out", upstream.Provider).Add(float64(bytesOut))
	metrics.BytesTransferred.WithLabelValues("in", upstream.Provider).Add(float64(bytesIn))
	metrics.ProxyRequests.WithLabelValues(upstream.Provider, protocol, "success").Inc()

	g.Limiter.AddBandwidth(context.Background(), ac.OrgID, bytesIn+bytesOut, 0, time.Hour)
	g.Sessions.Refresh(context.Background(), ac.OrgID, dirs.Session)

	g.Meter.Emit(model.MeterEvent{
		Ts:        time.Now(),
		OrgID:     ac.OrgID,
		APIKeyID:  ac.APIKeyID,
		SessionID: dirs.Session,
		Provider:  upstream.Provider,
		Country:   dirs.Country,
		DestHost:  host,
		BytesIn:   bytesIn,
		BytesOut:  bytesOut,
		LatencyMs: time.Since(start).Milliseconds(),
		Success:   true,
	})
}

func clientIPOf(conn net.Conn) string {
	if h, _, err := net.SplitHostPort(conn.RemoteAddr().String()); err == nil {
		return h
	}
	return ""
}

func atoiPort(s string, def int) int {
	if n, err := strconv.Atoi(s); err == nil && n > 0 && n < 65536 {
		return n
	}
	return def
}
