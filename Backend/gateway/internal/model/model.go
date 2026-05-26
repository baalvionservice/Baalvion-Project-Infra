// Package model holds the shared value types passed across the gateway packages
// (auth, session, provider, proxy, metering). It has no internal dependencies to
// keep the import graph acyclic.
package model

import "time"

// Directives are the routing instructions parsed from a customer's proxy
// username, e.g. customer-acme-zone-residential-country-us-city-newyork-session-abc.
type Directives struct {
	Customer string
	Zone     string
	Country  string // ISO-3166 alpha-2, lowercase
	State    string
	City     string
	ASN      int
	Carrier  string // mobile carrier target (e.g. verizon, vodafone)
	ISP      string // ISP target for residential
	Session  string
	Rotation string // "sticky" | "rotating"
}

// AuthContext is the authenticated identity behind a proxy connection.
type AuthContext struct {
	OrgID    string
	APIKeyID string
	Plan     string
	Scopes   []string
}

// ProxyRequest is everything the provider router needs to open an upstream
// connection to the destination on the customer's behalf.
type ProxyRequest struct {
	Auth       AuthContext
	Directives Directives
	DestHost   string
	DestPort   int
	Network    string // "tcp"
	ClientIP   string
	RequestID  string
}

// MeterEvent is the unit of billable usage emitted to the metering pipeline.
type MeterEvent struct {
	Ts        time.Time
	OrgID     string
	APIKeyID  string
	SessionID string
	Provider  string
	Country   string
	DestHost  string
	BytesIn   int64 // bytes from upstream → client (download)
	BytesOut  int64 // bytes from client → upstream (upload)
	Status    int   // HTTP-ish status / 0 for raw tunnels
	LatencyMs int64
	Success   bool
}
