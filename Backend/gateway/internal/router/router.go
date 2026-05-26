// Package router selects an upstream provider for each request using geo/ASN
// capability filtering, health scoring, weighted balancing, and failover.
package router

import (
	"context"
	"errors"
	"math"
	"math/rand"
	"sort"
	"time"

	"github.com/baalvion/gateway/internal/health"
	"github.com/baalvion/gateway/internal/metrics"
	"github.com/baalvion/gateway/internal/model"
	"github.com/baalvion/gateway/internal/provider"
)

var ErrNoProvider = errors.New("no healthy provider can serve this request")

type Router struct {
	providers []provider.Provider
	health    *health.Tracker
	retries   int
}

func New(providers []provider.Provider, h *health.Tracker, retries int) *Router {
	if retries <= 0 {
		retries = 2
	}
	return &Router{providers: providers, health: h, retries: retries}
}

func (r *Router) Providers() []provider.Provider { return r.providers }

// candidates returns providers that can serve the request, ordered with
// `preferred` first (sticky affinity), then weighted-random by weight*score.
func (r *Router) candidates(req model.ProxyRequest, preferred string) []provider.Provider {
	type scored struct {
		p   provider.Provider
		key float64
	}
	var pool []scored
	var pinned provider.Provider

	for _, p := range r.providers {
		if !p.Supports(req.Directives.Country, req.Directives.ASN) {
			continue
		}
		if !r.health.Healthy(p.Name()) {
			continue
		}
		if preferred != "" && p.Name() == preferred {
			pinned = p
			continue
		}
		// A-Res weighted sampling: key = rand^(1/weight*scoreFactor).
		w := float64(p.Weight()) * (r.health.Score(p.Name()) / 100.0)
		if w <= 0 {
			w = 0.01
		}
		key := math.Pow(rand.Float64(), 1.0/w)
		pool = append(pool, scored{p, key})
	}

	sort.Slice(pool, func(i, j int) bool { return pool[i].key > pool[j].key })

	ordered := make([]provider.Provider, 0, len(pool)+1)
	if pinned != nil {
		ordered = append(ordered, pinned)
	}
	for _, s := range pool {
		ordered = append(ordered, s.p)
	}
	return ordered
}

// Dial picks a provider and opens an upstream connection, failing over to the
// next candidate on error. Returns the live connection and the provider used.
func (r *Router) Dial(ctx context.Context, req model.ProxyRequest, preferred string) (*provider.UpstreamConnection, error) {
	cands := r.candidates(req, preferred)
	if len(cands) == 0 {
		return nil, ErrNoProvider
	}

	var lastErr error
	attempts := 0
	for _, p := range cands {
		if attempts >= r.retries+1 {
			break
		}
		attempts++

		start := time.Now()
		conn, err := p.Connect(ctx, req)
		latency := time.Since(start)
		metrics.ConnectLatency.WithLabelValues(p.Name()).Observe(float64(latency.Milliseconds()))

		if err != nil {
			r.health.RecordFailure(p.Name())
			metrics.UpstreamFailures.WithLabelValues(p.Name(), "connect_error").Inc()
			lastErr = err
			continue
		}
		r.health.RecordSuccess(p.Name(), latency)
		return conn, nil
	}
	if lastErr == nil {
		lastErr = ErrNoProvider
	}
	return nil, lastErr
}
