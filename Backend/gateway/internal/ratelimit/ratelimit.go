// Package ratelimit provides Redis-backed concurrency, request-rate, and
// bandwidth controls. All limits are distributed (shared across gateway pods).
package ratelimit

import (
	"context"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// PlanLimits mirrors the control plane's plan tiers.
type PlanLimits struct {
	RequestsPerMin int
	Concurrency    int
}

var plans = map[string]PlanLimits{
	"starter":      {RequestsPerMin: 120, Concurrency: 50},
	"growth":       {RequestsPerMin: 600, Concurrency: 250},
	"professional": {RequestsPerMin: 600, Concurrency: 250},
	"enterprise":   {RequestsPerMin: 6000, Concurrency: 2000},
}

func Limits(plan string) PlanLimits {
	if l, ok := plans[plan]; ok {
		return l
	}
	return plans["starter"]
}

type Limiter struct{ rdb *redis.Client }

func New(rdb *redis.Client) *Limiter { return &Limiter{rdb: rdb} }

// AcquireConcurrency increments the org's live-connection counter and rejects if
// over the plan cap. Pair every successful acquire with ReleaseConcurrency.
func (l *Limiter) AcquireConcurrency(ctx context.Context, org string, max int) (bool, error) {
	k := "cc:org:" + org
	n, err := l.rdb.Incr(ctx, k).Result()
	if err != nil {
		return true, nil // fail open: never block paying traffic on Redis blips
	}
	if n == 1 {
		l.rdb.Expire(ctx, k, time.Hour) // self-heal stuck counters
	}
	if int(n) > max {
		l.rdb.Decr(ctx, k)
		return false, nil
	}
	return true, nil
}

func (l *Limiter) ReleaseConcurrency(ctx context.Context, org string) {
	k := "cc:org:" + org
	if v, err := l.rdb.Decr(ctx, k).Result(); err == nil && v < 0 {
		l.rdb.Set(ctx, k, 0, time.Hour)
	}
}

// AllowRPM is a sliding-window request-rate check (sorted-set log).
func (l *Limiter) AllowRPM(ctx context.Context, key string, limit int, window time.Duration) bool {
	now := time.Now()
	rk := "rl:" + key
	member := strconv.FormatInt(now.UnixNano(), 10)

	pipe := l.rdb.Pipeline()
	pipe.ZRemRangeByScore(ctx, rk, "0", strconv.FormatInt(now.Add(-window).UnixMilli(), 10))
	pipe.ZAdd(ctx, rk, redis.Z{Score: float64(now.UnixMilli()), Member: member})
	card := pipe.ZCard(ctx, rk)
	pipe.PExpire(ctx, rk, window)
	if _, err := pipe.Exec(ctx); err != nil {
		return true // fail open
	}
	if card.Val() > int64(limit) {
		l.rdb.ZRem(ctx, rk, member)
		return false
	}
	return true
}

// AddBandwidth accumulates bytes for an org in a rolling window and reports
// whether the cap (bytes) is still respected. capBytes <= 0 disables the check.
func (l *Limiter) AddBandwidth(ctx context.Context, org string, bytes, capBytes int64, window time.Duration) bool {
	if capBytes <= 0 {
		return true
	}
	k := "bw:org:" + org
	total, err := l.rdb.IncrBy(ctx, k, bytes).Result()
	if err != nil {
		return true
	}
	if total == bytes {
		l.rdb.Expire(ctx, k, window)
	}
	return total <= capBytes
}
