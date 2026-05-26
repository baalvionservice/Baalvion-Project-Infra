package security

import (
	"errors"
	"net"
	"testing"
)

type fakeResolver map[string][]net.IP

func (f fakeResolver) LookupIP(host string) ([]net.IP, error) {
	if ips, ok := f[host]; ok {
		return ips, nil
	}
	return nil, errors.New("nxdomain")
}

func TestCheckDestination_BlocksInternalLiterals(t *testing.T) {
	g := New()
	for _, bad := range []string{"169.254.169.254", "10.0.0.5", "127.0.0.1", "192.168.1.1", "::1", "localhost"} {
		if err := g.CheckDestination(bad); err == nil {
			t.Errorf("expected %q to be blocked", bad)
		}
	}
}

func TestCheckDestination_AllowsPublic(t *testing.T) {
	g := New()
	if err := g.CheckDestination("1.1.1.1"); err != nil {
		t.Errorf("public IP should be allowed: %v", err)
	}
}

func TestCheckDestination_DNSRebindingBlocked(t *testing.T) {
	g := NewWith(fakeResolver{
		"evil.example": {net.ParseIP("10.1.2.3")},      // resolves to private
		"good.example": {net.ParseIP("93.184.216.34")}, // public
	})
	if err := g.CheckDestination("evil.example"); err == nil {
		t.Error("hostname resolving to a private IP must be blocked")
	}
	if err := g.CheckDestination("good.example"); err != nil {
		t.Errorf("public hostname should be allowed: %v", err)
	}
}
