package metering

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	dropped = promauto.NewCounter(prometheus.CounterOpts{
		Name: "metering_events_dropped_total",
		Help: "Metering events dropped because the ingestion buffer was full.",
	})
	failed = promauto.NewCounter(prometheus.CounterOpts{
		Name: "metering_events_failed_total",
		Help: "Metering events that failed to write to the stream after retry.",
	})
)
