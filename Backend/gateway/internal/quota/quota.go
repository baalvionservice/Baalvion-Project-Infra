// Package quota provides a sub-millisecond, Redis-backed quota gate consulted by
// the data plane BEFORE opening an upstream connection. The billing/metering
// service publishes the enforcement flag (quota:block:{org}); the gateway only
// reads it, so quota math never sits on the hot path.
package quota

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type Checker struct {
	rdb *redis.Client
	ttl time.Duration
}

func New(rdb *redis.Client) *Checker {
	return &Checker{rdb: rdb, ttl: 50 * time.Millisecond}
}

// Blocked reports whether the org is hard-blocked. Fails OPEN on Redis error or
// missing flag (a metering outage must not take paying customers offline).
func (c *Checker) Blocked(ctx context.Context, org string) bool {
	if c == nil || c.rdb == nil || org == "" {
		return false
	}
	cctx, cancel := context.WithTimeout(ctx, c.ttl)
	defer cancel()
	v, err := c.rdb.Get(cctx, "quota:block:"+org).Result()
	if err != nil {
		return false
	}
	return v == "1"
}
