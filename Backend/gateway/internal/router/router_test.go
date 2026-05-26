package router

import (
	"context"
	"errors"
	"net"
	"testing"

	"github.com/baalvion/gateway/internal/health"
	"github.com/baalvion/gateway/internal/model"
	"github.com/baalvion/gateway/internal/provider"
)

// stubProvider is a TEST DOUBLE (not a production adapter). It lets us assert
// geo filtering, weighting and failover deterministically.
type stubProvider struct {
	name      string
	countries []string
	fail      bool
	weight    int
}

func (s *stubProvider) Name() string              { return s.name }
func (s *stubProvider) Weight() int               { if s.weight == 0 { return 1 }; return s.weight }
func (s *stubProvider) GetRegions() []provider.Region { return nil }
func (s *stubProvider) GetASNCapabilities() []int { return nil }
func (s *stubProvider) HealthCheck(context.Context) error { return nil }
func (s *stubProvider) Supports(country string, _ int) bool {
	if len(s.countries) == 0 {
		return true
	}
	for _, c := range s.countries {
		if c == "*" || c == country {
			return true
		}
	}
	return false
}
func (s *stubProvider) Connect(context.Context, model.ProxyRequest) (*provider.UpstreamConnection, error) {
	if s.fail {
		return nil, errors.New("connect failed")
	}
	c, _ := net.Pipe()
	return &provider.UpstreamConnection{Conn: c, Provider: s.name}, nil
}

func req(country string) model.ProxyRequest {
	return model.ProxyRequest{Directives: model.Directives{Country: country}}
}

func TestDial_GeoFilter(t *testing.T) {
	r := New([]provider.Provider{
		&stubProvider{name: "us-only", countries: []string{"us"}},
	}, health.New(), 2)

	if _, err := r.Dial(context.Background(), req("de"), ""); !errors.Is(err, ErrNoProvider) {
		t.Errorf("expected ErrNoProvider for unsupported geo, got %v", err)
	}
	conn, err := r.Dial(context.Background(), req("us"), "")
	if err != nil {
		t.Fatalf("expected success for supported geo: %v", err)
	}
	conn.Conn.Close()
}

func TestDial_Failover(t *testing.T) {
	r := New([]provider.Provider{
		&stubProvider{name: "broken", fail: true, weight: 1000},
		&stubProvider{name: "healthy", fail: false, weight: 1},
	}, health.New(), 3)

	conn, err := r.Dial(context.Background(), req(""), "")
	if err != nil {
		t.Fatalf("failover should have succeeded: %v", err)
	}
	if conn.Provider != "healthy" {
		t.Errorf("expected failover to 'healthy', got %q", conn.Provider)
	}
	conn.Conn.Close()
}
