package orchestrator

import (
	"context"
	"errors"
	"net"
	"testing"

	"github.com/baalvion/gateway/internal/model"
	"github.com/baalvion/gateway/internal/provider"
)

// stub is a TEST DOUBLE implementing orchestrator.Provider.
type stub struct {
	name      string
	countries []string
	fail      bool
	cost      float64
}

func (s *stub) Name() string                              { return s.name }
func (s *stub) Authenticate(context.Context) error        { return nil }
func (s *stub) RotateSession(context.Context, string) error { return nil }
func (s *stub) Weight() int                               { return 1 }
func (s *stub) CostPerGB() float64                        { if s.cost == 0 { return 1 }; return s.cost }
func (s *stub) GeoCaps() []model.GeoCapability {
	var c []model.GeoCapability
	for _, x := range s.countries {
		c = append(c, model.GeoCapability{Country: x})
	}
	return c
}
func (s *stub) ASNCaps() []model.ASNCapability { return nil }
func (s *stub) GetUsage(context.Context) (*model.UsageStats, error) {
	return &model.UsageStats{Available: false}, nil
}
func (s *stub) Health(context.Context) (*model.HealthStatus, error) {
	return &model.HealthStatus{State: model.StateHealthy, SuccessRate: 1}, nil
}
func (s *stub) AllocateIP(context.Context, model.AllocationRequest) (*model.ProxyEndpoint, error) {
	return &model.ProxyEndpoint{Provider: s.name}, nil
}
func (s *stub) Supports(country string, _ int) bool {
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
func (s *stub) Connect(context.Context, model.ProxyRequest) (*provider.UpstreamConnection, error) {
	if s.fail {
		return nil, errors.New("connect failed")
	}
	c, _ := net.Pipe()
	return &provider.UpstreamConnection{Conn: c, Provider: s.name}, nil
}

func req(country string) model.ProxyRequest {
	return model.ProxyRequest{Directives: model.Directives{Country: country}, Auth: model.AuthContext{Plan: "starter"}}
}

func TestDial_FailoverToHealthy(t *testing.T) {
	o := New([]Provider{
		&stub{name: "broken", fail: true},
		&stub{name: "ok"},
	}, nil, Options{Retries: 3})

	conn, err := o.Dial(context.Background(), req(""), "")
	if err != nil {
		t.Fatalf("failover should have succeeded: %v", err)
	}
	if conn.Provider != "ok" {
		t.Fatalf("expected provider 'ok', got %q", conn.Provider)
	}
	conn.Conn.Close()
}

func TestDial_GeoCapabilityFilter(t *testing.T) {
	o := New([]Provider{&stub{name: "us-only", countries: []string{"us"}}}, nil, Options{})

	if _, err := o.Dial(context.Background(), req("de"), ""); !errors.Is(err, ErrNoProvider) {
		t.Fatalf("expected ErrNoProvider for unsupported geo, got %v", err)
	}
	conn, err := o.Dial(context.Background(), req("us"), "")
	if err != nil {
		t.Fatalf("supported geo should succeed: %v", err)
	}
	conn.Conn.Close()
}

func TestReportOutcome_RecordsBan(t *testing.T) {
	o := New([]Provider{&stub{name: "p1"}}, nil, Options{})
	o.ReportOutcome("p1", "example.com", 429)
	if o.scorer.targetBan("p1", "example.com") <= 0 {
		t.Fatal("ban signal should be recorded for 429")
	}
}
