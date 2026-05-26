// Package session implements sticky-session affinity: a session token pins to a
// provider (and geo) for its TTL so sequential requests reuse the same exit.
package session

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

type Allocation struct {
	Provider string `json:"provider"`
	Country  string `json:"country"`
	ExitIP   string `json:"exitIp,omitempty"`
}

type Allocator struct {
	rdb *redis.Client
	ttl time.Duration
}

func New(rdb *redis.Client, ttl time.Duration) *Allocator {
	if ttl <= 0 {
		ttl = 10 * time.Minute
	}
	return &Allocator{rdb: rdb, ttl: ttl}
}

func key(org, token string) string { return "proxysess:" + org + ":" + token }

// Get returns the pinned allocation for a sticky session, if present.
func (a *Allocator) Get(ctx context.Context, org, token string) (Allocation, bool) {
	if token == "" {
		return Allocation{}, false
	}
	raw, err := a.rdb.Get(ctx, key(org, token)).Result()
	if err != nil {
		return Allocation{}, false
	}
	var alloc Allocation
	if json.Unmarshal([]byte(raw), &alloc) != nil {
		return Allocation{}, false
	}
	return alloc, true
}

// Pin stores the allocation for a sticky session and (re)sets its TTL.
func (a *Allocator) Pin(ctx context.Context, org, token string, alloc Allocation) {
	if token == "" {
		return
	}
	b, err := json.Marshal(alloc)
	if err != nil {
		return
	}
	a.rdb.Set(ctx, key(org, token), b, a.ttl)
}

// Refresh extends a live session's TTL on activity.
func (a *Allocator) Refresh(ctx context.Context, org, token string) {
	if token != "" {
		a.rdb.Expire(ctx, key(org, token), a.ttl)
	}
}
