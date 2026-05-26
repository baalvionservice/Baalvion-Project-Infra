// Package intel reads the AI routing signals published by the control plane's
// network-intelligence engine (Node) and exposes them to the orchestrator's
// scorer. The control plane computes per-provider routing WEIGHTS (blending
// success, latency, ban probability, margin and forecast/anomaly signals) and
// publishes them to Redis `ai:route:weights` (a single JSON snapshot) plus
// per-route ban probabilities to `ban:prob:{provider|country|class}`.
//
// This package is read-only and fail-open: if Redis is unavailable or no weights
// have been published, Weight() returns 1.0 (neutral) so routing degrades to the
// gateway's own EWMA scoring. It is the data-plane half of the autonomous
// routing loop; the brain lives in service/aiRoutingEngine.js.
package intel

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type snapshot struct {
	Weights map[string]float64 `json:"weights"`
	Ts      int64              `json:"ts"`
}

// Cache holds the latest AI weights with a short TTL so we make at most one Redis
// read per refresh interval regardless of request volume. Thread-safe.
type Cache struct {
	rdb        *redis.Client
	ttl        time.Duration
	mu         sync.RWMutex
	weights    map[string]float64
	refreshed  time.Time
	refreshing bool
}

func NewCache(rdb *redis.Client, ttl time.Duration) *Cache {
	if ttl <= 0 {
		ttl = 30 * time.Second
	}
	return &Cache{rdb: rdb, ttl: ttl, weights: map[string]float64{}}
}

// Weight returns the AI routing weight for a provider in (0,1], or 1.0 when no
// signal is available. Triggers a lazy refresh when the cache is stale and Redis
// is configured; otherwise it serves whatever weights are already cached.
func (c *Cache) Weight(name string) float64 {
	if c == nil {
		return 1.0
	}
	if c.rdb != nil {
		c.maybeRefresh()
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	if w, ok := c.weights[name]; ok && w > 0 {
		return w
	}
	return 1.0
}

func (c *Cache) maybeRefresh() {
	c.mu.RLock()
	stale := time.Since(c.refreshed) > c.ttl && !c.refreshing
	c.mu.RUnlock()
	if !stale {
		return
	}
	c.mu.Lock()
	if c.refreshing || time.Since(c.refreshed) <= c.ttl {
		c.mu.Unlock()
		return
	}
	c.refreshing = true
	c.mu.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 250*time.Millisecond)
	defer cancel()
	raw, err := c.rdb.Get(ctx, "ai:route:weights").Result()

	c.mu.Lock()
	c.refreshing = false
	c.refreshed = time.Now()
	if err == nil && raw != "" {
		var s snapshot
		if json.Unmarshal([]byte(raw), &s) == nil && s.Weights != nil {
			c.weights = s.Weights
		}
	}
	c.mu.Unlock()
}

// BanProbability returns the published ban probability for a route key, or 0 when
// unknown. routeKey is "provider|country|target_class".
func (c *Cache) BanProbability(ctx context.Context, routeKey string) float64 {
	if c == nil || c.rdb == nil {
		return 0
	}
	v, err := c.rdb.Get(ctx, "ban:prob:"+routeKey).Float64()
	if err != nil {
		return 0
	}
	return v
}
