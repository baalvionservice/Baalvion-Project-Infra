// Package metrics exposes the gateway's Prometheus instrumentation.
package metrics

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	ActiveConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "active_connections", Help: "Currently open proxy connections.",
	})
	ProxyRequests = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "proxy_requests_total", Help: "Proxy requests by provider and outcome.",
	}, []string{"provider", "protocol", "outcome"})
	BytesTransferred = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "bytes_transferred_total", Help: "Bytes proxied by direction and provider.",
	}, []string{"direction", "provider"})
	UpstreamFailures = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "upstream_failures_total", Help: "Upstream connection failures.",
	}, []string{"provider", "reason"})
	AuthFailures = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "auth_failures_total", Help: "Authentication failures by reason.",
	}, []string{"reason"})
	QuotaDenials = promauto.NewCounter(prometheus.CounterOpts{
		Name: "quota_denials_total", Help: "Connections refused because the org is quota-blocked.",
	})
	BlockedDestinations = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "blocked_destinations_total", Help: "Connections blocked by destination threat-intel.",
	}, []string{"category"})
	EnforcementBlocks = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "enforcement_blocks_total", Help: "Connections blocked by Trust & Safety enforcement.",
	}, []string{"reason"})
	ConnectLatency = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "proxy_connect_latency_ms",
		Help:    "Upstream connect latency (ms).",
		Buckets: []float64{5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000},
	}, []string{"provider"})
	ProviderHealth = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "provider_health_score", Help: "Provider health score (0-100).",
	}, []string{"provider"})
)

// Handler returns the Prometheus scrape handler.
func Handler() http.Handler { return promhttp.Handler() }
