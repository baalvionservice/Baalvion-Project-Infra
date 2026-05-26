// Package health scores upstream providers from live results + active probing,
// ejects unhealthy providers, and recovers them when probes succeed again.
package health

import (
	"context"
	"sync"
	"time"

	"github.com/baalvion/gateway/internal/metrics"
	"github.com/baalvion/gateway/internal/provider"
)

const (
	startScore     = 100.0
	maxScore       = 100.0
	minScore       = 0.0
	successDelta   = 5.0
	failureDelta   = 25.0
	ejectThreshold = 25.0 // below this a provider is removed from rotation
)

type state struct {
	score       float64
	ewmaLatency float64 // ms
	failures    int
}

type Tracker struct {
	mu sync.RWMutex
	m  map[string]*state
}

func New() *Tracker { return &Tracker{m: make(map[string]*state)} }

func (t *Tracker) get(name string) *state {
	if s, ok := t.m[name]; ok {
		return s
	}
	s := &state{score: startScore}
	t.m[name] = s
	return s
}

func (t *Tracker) RecordSuccess(name string, latency time.Duration) {
	t.mu.Lock()
	defer t.mu.Unlock()
	s := t.get(name)
	s.score = clampMax(maxScore, s.score+successDelta)
	s.failures = 0
	ms := float64(latency.Milliseconds())
	if s.ewmaLatency == 0 {
		s.ewmaLatency = ms
	} else {
		s.ewmaLatency = 0.8*s.ewmaLatency + 0.2*ms
	}
	metrics.ProviderHealth.WithLabelValues(name).Set(s.score)
}

func (t *Tracker) RecordFailure(name string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	s := t.get(name)
	s.score = clampMin(minScore, s.score-failureDelta)
	s.failures++
	metrics.ProviderHealth.WithLabelValues(name).Set(s.score)
}

func (t *Tracker) Score(name string) float64 {
	t.mu.RLock()
	defer t.mu.RUnlock()
	if s, ok := t.m[name]; ok {
		return s.score
	}
	return startScore
}

func (t *Tracker) Healthy(name string) bool { return t.Score(name) >= ejectThreshold }

// StartProbing actively health-checks providers until ctx is cancelled.
func (t *Tracker) StartProbing(ctx context.Context, providers []provider.Provider, interval time.Duration) {
	go func() {
		tick := time.NewTicker(interval)
		defer tick.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-tick.C:
				for _, p := range providers {
					start := time.Now()
					pctx, cancel := context.WithTimeout(ctx, interval/2)
					err := p.HealthCheck(pctx)
					cancel()
					if err != nil {
						t.RecordFailure(p.Name())
					} else {
						t.RecordSuccess(p.Name(), time.Since(start))
					}
				}
			}
		}
	}()
}

// clampMax returns the smaller of a, b (upper bound on score growth).
func clampMax(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

// clampMin returns the larger of a, b (lower bound on score decay).
func clampMin(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}
