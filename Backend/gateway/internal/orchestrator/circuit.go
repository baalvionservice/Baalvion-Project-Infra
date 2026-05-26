package orchestrator

import (
	"sync"
	"time"
)

// circuitState for a provider breaker.
type circuitState int

const (
	cbClosed   circuitState = iota // normal
	cbOpen                         // tripped — provider excluded
	cbHalfOpen                     // probing recovery
)

// breaker is a per-provider circuit breaker. It trips after consecutive
// failures, stays open for a cooldown, then allows a single half-open probe.
type breaker struct {
	mu           sync.Mutex
	state        circuitState
	failures     int
	threshold    int
	openedAt     time.Time
	cooldown     time.Duration
}

func newBreaker(threshold int, cooldown time.Duration) *breaker {
	if threshold <= 0 {
		threshold = 5
	}
	if cooldown <= 0 {
		cooldown = 30 * time.Second
	}
	return &breaker{threshold: threshold, cooldown: cooldown}
}

// Allow reports whether a request may be attempted right now.
func (b *breaker) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	switch b.state {
	case cbClosed:
		return true
	case cbOpen:
		if time.Since(b.openedAt) >= b.cooldown {
			b.state = cbHalfOpen
			return true // single trial
		}
		return false
	default: // half-open: allow trial
		return true
	}
}

func (b *breaker) Success() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.failures = 0
	b.state = cbClosed
}

func (b *breaker) Failure() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.failures++
	if b.state == cbHalfOpen || b.failures >= b.threshold {
		b.state = cbOpen
		b.openedAt = time.Now()
	}
}

func (b *breaker) State() circuitState {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.state == cbOpen && time.Since(b.openedAt) >= b.cooldown {
		return cbHalfOpen
	}
	return b.state
}
