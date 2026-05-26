package provider

import (
	"context"
	"net"
	"testing"

	"github.com/baalvion/gateway/internal/config"
)

func TestPick_StickyDeterministic(t *testing.T) {
	ips := []net.IP{net.ParseIP("1.1.1.1"), net.ParseIP("2.2.2.2"), net.ParseIP("3.3.3.3")}
	a := pick(ips, "session-abc")
	b := pick(ips, "session-abc")
	if !a.Equal(b) {
		t.Fatalf("sticky session must pick the same IP: %v vs %v", a, b)
	}
	if pick(nil, "x") != nil {
		t.Error("empty pool must return nil")
	}
}

func TestDedicated_SharedFallbackAndSupports(t *testing.T) {
	cfg := config.ProviderConfig{
		Name: "dc-us-east", Kind: "dedicated", Shared: true,
		LocalIPs: []string{"203.0.113.10", "203.0.113.11"}, Countries: []string{"us"},
	}
	d := NewDedicated(cfg, nil, 0) // nil redis → shared fallback path
	ips := d.candidateIPs(context.Background(), "org-without-allocation")
	if len(ips) != 2 {
		t.Fatalf("shared pool should expose 2 IPs, got %d", len(ips))
	}
	if !d.Supports("us", 0) || d.Supports("de", 0) {
		t.Error("geo support filter incorrect")
	}
}

func TestDedicated_NoShared_NoAllocation(t *testing.T) {
	d := NewDedicated(config.ProviderConfig{Name: "dc", Kind: "dedicated", Shared: false, LocalIPs: []string{"203.0.113.10"}}, nil, 0)
	if got := d.candidateIPs(context.Background(), "org"); got != nil {
		t.Errorf("non-shared pool with no allocation must yield nil, got %v", got)
	}
}
