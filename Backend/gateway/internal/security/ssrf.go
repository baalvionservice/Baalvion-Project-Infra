// Package security blocks proxy requests that would let a customer pivot into
// the gateway's own infrastructure (SSRF), cloud metadata, or private networks.
package security

import (
	"fmt"
	"net"
	"strings"
)

// Extra single-IP denies beyond the structural private/loopback/link-local checks.
var blockedExact = map[string]bool{
	"169.254.169.254": true, // AWS/GCP/Azure/DO IMDS
	"100.100.100.200": true, // Alibaba metadata
	"fd00:ec2::254":   true, // AWS IMDSv6
}

var blockedHostnames = map[string]bool{
	"localhost":                  true,
	"metadata":                   true,
	"metadata.google.internal":   true,
	"metadata.goog":              true,
	"instance-data":              true,
	"kubernetes":                 true,
	"kubernetes.default":         true,
	"kubernetes.default.svc":     true,
}

// extra CIDRs (carrier-grade NAT etc.) on top of net.IP's own classification.
var extraCIDRs = func() []*net.IPNet {
	var nets []*net.IPNet
	for _, c := range []string{"100.64.0.0/10", "192.0.0.0/24", "198.18.0.0/15"} {
		if _, n, err := net.ParseCIDR(c); err == nil {
			nets = append(nets, n)
		}
	}
	return nets
}()

// ipBlocked reports whether an IP must never be a proxy destination.
func ipBlocked(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() || ip.IsMulticast() || ip.IsUnspecified() {
		return true
	}
	if blockedExact[ip.String()] {
		return true
	}
	for _, n := range extraCIDRs {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

// Resolver lets tests inject DNS; defaults to the system resolver.
type Resolver interface {
	LookupIP(host string) ([]net.IP, error)
}

type netResolver struct{}

func (netResolver) LookupIP(host string) ([]net.IP, error) { return net.LookupIP(host) }

// Guard validates destinations before the gateway connects to them.
type Guard struct{ res Resolver }

func New() *Guard               { return &Guard{res: netResolver{}} }
func NewWith(r Resolver) *Guard { return &Guard{res: r} }

// CheckDestination resolves the host and rejects it if the host itself or ANY
// resolved IP is internal. Resolving every A/AAAA record mitigates DNS
// rebinding (an attacker cannot hide a private IP behind a public hostname).
func (g *Guard) CheckDestination(host string) error {
	h := strings.ToLower(strings.TrimSuffix(host, "."))
	if blockedHostnames[h] {
		return fmt.Errorf("destination host %q is blocked", host)
	}

	if ip := net.ParseIP(h); ip != nil {
		if ipBlocked(ip) {
			return fmt.Errorf("destination IP %q is in a blocked range", host)
		}
		return nil
	}

	ips, err := g.res.LookupIP(h)
	if err != nil {
		return fmt.Errorf("dns resolution failed for %q: %w", host, err)
	}
	if len(ips) == 0 {
		return fmt.Errorf("no addresses for %q", host)
	}
	for _, ip := range ips {
		if ipBlocked(ip) {
			return fmt.Errorf("destination %q resolves to blocked IP %s", host, ip)
		}
	}
	return nil
}
