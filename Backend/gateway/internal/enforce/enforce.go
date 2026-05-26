// Package enforce applies Trust & Safety decisions at the data plane: org
// sanctions (suspend/ban/geo) published by the control plane to
// `enforce:org:{id}`, and destination threat-intel denylist
// (`denydest:{ip|domain}:{indicator}`). Sub-ms Redis reads; fails OPEN so a
// Trust-service/Redis blip never takes down paying traffic.
package enforce

import (
	"context"
	"encoding/json"
	"net"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type Decision struct {
	Blocked          bool     `json:"blocked"`
	GeoDeny          []string `json:"geoDeny"`
	GeoAllow         []string `json:"geoAllow"`
	ThrottleRpm      int      `json:"throttleRpm"`
	BandwidthCapGb   float64  `json:"bandwidthCapGb"`
	IsolateProviders []string `json:"isolateProviders"`
}

type Checker struct {
	rdb *redis.Client
	ttl time.Duration
}

func New(rdb *redis.Client) *Checker { return &Checker{rdb: rdb, ttl: 50 * time.Millisecond} }

// Org returns the live enforcement decision for an org (empty if none / on error).
func (c *Checker) Org(ctx context.Context, org string) Decision {
	var d Decision
	if c == nil || c.rdb == nil || org == "" {
		return d
	}
	cctx, cancel := context.WithTimeout(ctx, c.ttl)
	defer cancel()
	raw, err := c.rdb.Get(cctx, "enforce:org:"+org).Result()
	if err != nil || raw == "" {
		return d
	}
	_ = json.Unmarshal([]byte(raw), &d)
	return d
}

// GeoAllowed applies the org's geo allow/deny lists to a requested country.
func (d Decision) GeoAllowed(country string) bool {
	country = strings.ToLower(country)
	for _, c := range d.GeoDeny {
		if strings.ToLower(c) == country {
			return false
		}
	}
	if len(d.GeoAllow) > 0 {
		for _, c := range d.GeoAllow {
			if strings.ToLower(c) == country {
				return true
			}
		}
		return false
	}
	return true
}

// DestinationBlocked checks threat-intel denylist; returns the category if blocked.
func (c *Checker) DestinationBlocked(ctx context.Context, host string) (string, bool) {
	if c == nil || c.rdb == nil || host == "" {
		return "", false
	}
	kind := "domain"
	if net.ParseIP(host) != nil {
		kind = "ip"
	}
	cctx, cancel := context.WithTimeout(ctx, c.ttl)
	defer cancel()
	cat, err := c.rdb.Get(cctx, "denydest:"+kind+":"+strings.ToLower(host)).Result()
	if err != nil || cat == "" {
		return "", false
	}
	return cat, true
}
