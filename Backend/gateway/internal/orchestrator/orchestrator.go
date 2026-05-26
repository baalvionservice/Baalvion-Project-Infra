package orchestrator

import (
	"context"
	"encoding/json"
	"errors"
	"math/rand"
	"sort"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/baalvion/gateway/internal/intel"
	"github.com/baalvion/gateway/internal/model"
	"github.com/baalvion/gateway/internal/provider"
)

var ErrNoProvider = errors.New("no eligible provider for request")

type Options struct {
	Retries          int
	DefaultStrategy  RoutingStrategy
	BreakerThreshold int
	BreakerCooldown  time.Duration
}

type Orchestrator struct {
	providers map[string]Provider
	order     []string
	scorer    *scorer
	breakers  map[string]*breaker
	rdb       *redis.Client
	intel     *intel.Cache
	opts      Options
}

func New(providers []Provider, rdb *redis.Client, opts Options) *Orchestrator {
	if opts.Retries <= 0 {
		opts.Retries = 2
	}
	if opts.DefaultStrategy == "" {
		opts.DefaultStrategy = StrategyCostAware
	}
	o := &Orchestrator{
		providers: map[string]Provider{},
		scorer:    newScorer(),
		breakers:  map[string]*breaker{},
		rdb:       rdb,
		intel:     intel.NewCache(rdb, 30*time.Second),
		opts:      opts,
	}
	for _, p := range providers {
		o.providers[p.Name()] = p
		o.breakers[p.Name()] = newBreaker(opts.BreakerThreshold, opts.BreakerCooldown)
		o.order = append(o.order, p.Name())
	}
	return o
}

func (o *Orchestrator) strategyFor(plan string) RoutingStrategy {
	switch plan {
	case "enterprise":
		return StrategyLeastLatency
	case "growth", "professional":
		return StrategyPremium
	default:
		return o.opts.DefaultStrategy
	}
}

// candidate scoring -------------------------------------------------------------

type scored struct {
	name  string
	p     Provider
	score float64
}

func (o *Orchestrator) score(name string, p Provider, strat RoutingStrategy, req AllocationRequest) float64 {
	h := o.scorer.snapshot(name)
	if h.State == StateOffline {
		return -1
	}
	succ := successOf(h)
	lat := h.LatencyMs
	if lat <= 0 {
		lat = 50
	}
	// geo match quality: explicit country coverage beats wildcard.
	geo := 1.0
	if req.Country != "" {
		geo = 0.6
		for _, g := range p.GeoCaps() {
			if g.Country == "*" {
				geo = 0.8
			}
			if g.Country == req.Country {
				geo = 1.2
				break
			}
		}
	}
	banPenalty := 1.0 - o.scorer.targetBan(name, req.Target)
	cost := p.CostPerGB()
	if cost <= 0 {
		cost = 0.5
	}

	var base float64
	switch strat {
	case StrategyLeastLatency:
		base = 1000.0 / lat
	case StrategyLeastFailure:
		base = succ
	case StrategyCostAware:
		base = succ / cost
	case StrategyPremium:
		base = float64(p.Weight()) * succ * (1000.0 / lat)
	default: // weighted
		base = float64(p.Weight()) * succ
	}
	// degrade weighting + light jitter to spread load among near-equals.
	stateFactor := map[ProviderState]float64{StateHealthy: 1, StateDegraded: 0.5, StateUnhealthy: 0.15}[h.State]
	// AI routing weight from the control-plane intelligence engine (1.0 = neutral
	// when no signal published; <1 de-weights per ban/margin/forecast/anomaly).
	aiWeight := o.intel.Weight(name)
	return base * geo * banPenalty * stateFactor * aiWeight * (0.9 + 0.2*rand.Float64())
}

func (o *Orchestrator) candidates(req AllocationRequest, preferred string) []scored {
	strat := o.strategyFor(req.Plan)
	var out []scored
	for name, p := range o.providers {
		if !p.Supports(req.Country, req.ASN) {
			continue
		}
		if !o.breakers[name].Allow() {
			continue
		}
		s := o.score(name, p, strat, req)
		if s < 0 {
			continue
		}
		if name == preferred {
			s *= 5 // sticky affinity bias
		}
		out = append(out, scored{name, p, s})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].score > out[j].score })
	return out
}

// Dial selects a provider and opens an upstream connection, failing over on
// error. Signature matches the legacy router so the gateway swap is one line.
func (o *Orchestrator) Dial(ctx context.Context, req model.ProxyRequest, preferred string) (*provider.UpstreamConnection, error) {
	areq := allocationFrom(req)
	cands := o.candidates(areq, preferred)
	if len(cands) == 0 {
		return nil, ErrNoProvider
	}

	var lastErr error
	attempts := 0
	for i, c := range cands {
		if attempts >= o.opts.Retries+1 {
			break
		}
		attempts++
		if i > 0 {
			failoverEvents.Inc()
		}

		start := time.Now()
		conn, err := c.p.Connect(ctx, req)
		latency := time.Since(start)
		if err != nil {
			o.scorer.RecordConnect(c.name, latency, false, err.Error())
			o.breakers[c.name].Failure()
			providerFailures.WithLabelValues(c.name).Inc()
			if classifyConnErr(err.Error()) {
				o.scorer.RecordBan(c.name, areq.Target, true)
			}
			lastErr = err
			continue
		}
		o.scorer.RecordConnect(c.name, latency, true, "")
		o.breakers[c.name].Success()
		if areq.Country != "" {
			geoAllocations.WithLabelValues(areq.Country).Inc()
		}
		return conn, nil
	}
	if lastErr == nil {
		lastErr = ErrNoProvider
	}
	return nil, lastErr
}

// Allocate returns the chosen upstream endpoint without dialing (admin/preview).
func (o *Orchestrator) Allocate(ctx context.Context, req AllocationRequest) (*ProxyEndpoint, error) {
	cands := o.candidates(req, "")
	if len(cands) == 0 {
		return nil, ErrNoProvider
	}
	return cands[0].p.AllocateIP(ctx, req)
}

// ReportOutcome lets the data path feed back observable HTTP outcomes (plain
// HTTP only; TLS tunnels cannot expose inner status without MITM).
func (o *Orchestrator) ReportOutcome(providerName, target string, status int) {
	banned := isBanStatus(status)
	o.scorer.RecordBan(providerName, target, banned)
	if banned {
		o.breakers[providerName].Failure()
	}
}

// StartProbing actively health-checks providers and publishes state to Redis
// (provider:state:{name}) for the control plane.
func (o *Orchestrator) StartProbing(ctx context.Context, interval time.Duration) {
	go func() {
		t := time.NewTicker(interval)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				for name, p := range o.providers {
					pctx, cancel := context.WithTimeout(ctx, interval/2)
					start := time.Now()
					st, err := p.Health(pctx)
					cancel()
					if err != nil || st == nil {
						o.scorer.RecordProbe(name, time.Since(start), false, errString(err))
					} else {
						o.scorer.RecordProbe(name, time.Duration(st.LatencyMs)*time.Millisecond, st.State != StateOffline, st.LastError)
					}
					o.publishState(ctx, name)
				}
			}
		}
	}()
}

func (o *Orchestrator) publishState(ctx context.Context, name string) {
	h := o.scorer.snapshot(name)
	providerSuccess.WithLabelValues(name).Set(h.SuccessRate)
	providerLatency.WithLabelValues(name).Set(h.LatencyMs)
	providerBanRate.WithLabelValues(name).Set(h.BanRate)
	providerStateG.WithLabelValues(name).Set(float64(h.State))
	if o.rdb == nil {
		return
	}
	b, _ := json.Marshal(map[string]any{
		"state": h.State.String(), "successRate": h.SuccessRate, "latencyMs": h.LatencyMs,
		"banRate": h.BanRate, "lastError": h.LastError, "checkedAt": time.Now().UTC(),
	})
	o.rdb.Set(ctx, "provider:state:"+name, b, 60*time.Second)
	o.rdb.SAdd(ctx, "providers:registry", name)
}

// States returns current health snapshots (admin/debug).
func (o *Orchestrator) States() map[string]HealthStatus {
	out := map[string]HealthStatus{}
	for _, name := range o.order {
		out[name] = o.scorer.snapshot(name)
	}
	return out
}

func allocationFrom(req model.ProxyRequest) AllocationRequest {
	d := req.Directives
	return AllocationRequest{
		OrgID: req.Auth.OrgID, Country: d.Country, State: d.State, City: d.City,
		ASN: d.ASN, SessionID: d.Session, Rotation: d.Rotation, Plan: req.Auth.Plan, Target: req.DestHost,
	}
}

// successOf is a free function (HealthStatus is an alias of model.HealthStatus,
// and Go forbids defining methods on non-local types).
func successOf(h HealthStatus) float64 {
	if h.SuccessRate == 0 && h.State == StateHealthy {
		return 1
	}
	return h.SuccessRate
}

func errString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}
