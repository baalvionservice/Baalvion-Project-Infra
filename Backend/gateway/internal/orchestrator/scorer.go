package orchestrator

import (
	"sync"
	"time"
)

// scorer maintains EWMA health signals per provider and per (provider,target),
// and derives the 4-state health from them. Thread-safe.
type scorer struct {
	mu        sync.RWMutex
	providers map[string]*provGauge
	targets   map[string]float64 // key "provider|target" -> ban EWMA (0..1)
}

type provGauge struct {
	success    float64 // EWMA success rate 0..1
	latencyMs  float64 // EWMA latency
	ban        float64 // EWMA ban rate 0..1
	consecFail int
	lastErr    string
	updated    time.Time
}

func newScorer() *scorer {
	return &scorer{providers: map[string]*provGauge{}, targets: map[string]float64{}}
}

func (s *scorer) gauge(name string) *provGauge {
	g, ok := s.providers[name]
	if !ok {
		g = &provGauge{success: 1, latencyMs: 0, ban: 0}
		s.providers[name] = g
	}
	return g
}

func ewma(prev, sample, alpha float64) float64 { return (1-alpha)*prev + alpha*sample }

// RecordConnect records the outcome of an upstream dial attempt.
func (s *scorer) RecordConnect(name string, latency time.Duration, ok bool, errStr string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	g := s.gauge(name)
	g.success = ewma(g.success, boolf(ok), 0.2)
	if ok {
		ms := float64(latency.Milliseconds())
		if g.latencyMs == 0 {
			g.latencyMs = ms
		} else {
			g.latencyMs = ewma(g.latencyMs, ms, 0.2)
		}
		g.consecFail = 0
	} else {
		g.consecFail++
		g.lastErr = errStr
	}
	g.updated = time.Now()
}

// RecordProbe folds an active health probe result in.
func (s *scorer) RecordProbe(name string, latency time.Duration, ok bool, errStr string) {
	s.RecordConnect(name, latency, ok, errStr)
}

// RecordBan records a per-target ban signal (e.g. 403/429 on plain HTTP).
func (s *scorer) RecordBan(name, target string, banned bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := name + "|" + target
	s.targets[key] = ewma(s.targets[key], boolf(banned), 0.3)
	g := s.gauge(name)
	g.ban = ewma(g.ban, boolf(banned), 0.1)
}

func (s *scorer) snapshot(name string) HealthStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	g := s.providers[name]
	if g == nil {
		return HealthStatus{State: StateHealthy, SuccessRate: 1, CheckedAt: time.Now()}
	}
	return HealthStatus{
		State:       deriveState(g),
		SuccessRate: g.success,
		LatencyMs:   g.latencyMs,
		BanRate:     g.ban,
		LastError:   g.lastErr,
		CheckedAt:   g.updated,
	}
}

func (s *scorer) targetBan(name, target string) float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.targets[name+"|"+target]
}

func deriveState(g *provGauge) ProviderState {
	switch {
	case g.consecFail >= 5:
		return StateOffline
	case g.success < 0.5 || g.ban > 0.5:
		return StateUnhealthy
	case g.success < 0.9 || g.ban > 0.2 || g.latencyMs > 3000:
		return StateDegraded
	default:
		return StateHealthy
	}
}

func boolf(b bool) float64 {
	if b {
		return 1
	}
	return 0
}
