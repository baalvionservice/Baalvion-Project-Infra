package orchestrator

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	providerSuccess = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "provider_success_rate", Help: "EWMA success rate by provider (0-1).",
	}, []string{"provider"})
	providerLatency = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "provider_latency_ms", Help: "EWMA upstream connect latency by provider.",
	}, []string{"provider"})
	providerBanRate = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "provider_ban_rate", Help: "EWMA ban rate by provider (0-1).",
	}, []string{"provider"})
	providerStateG = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "provider_state", Help: "Provider state (0=HEALTHY,1=DEGRADED,2=UNHEALTHY,3=OFFLINE).",
	}, []string{"provider"})
	providerFailures = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "provider_failures_total", Help: "Upstream failures by provider.",
	}, []string{"provider"})
	failoverEvents = promauto.NewCounter(prometheus.CounterOpts{
		Name: "failover_events_total", Help: "Times routing failed over to another provider.",
	})
	geoAllocations = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "geo_allocations_total", Help: "Allocations by target country.",
	}, []string{"country"})
)
