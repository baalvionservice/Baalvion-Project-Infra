package config

import (
	"encoding/json"
	"os"
	"strconv"
	"time"
)

// ProviderConfig describes one upstream proxy provider. It is intentionally
// generic: every commercial residential/ISP provider (Bright Data, Oxylabs,
// SOAX, Smartproxy, IPRoyal) is reachable as an upstream HTTP or SOCKS5 proxy
// with a templated username that encodes geo/session targeting.
type ProviderConfig struct {
	Name             string   `json:"name"`
	Kind             string   `json:"kind"`             // "http" | "https" | "socks5"
	Address          string   `json:"address"`          // host:port of the upstream proxy
	UsernameTemplate string   `json:"usernameTemplate"` // placeholders: {country} {state} {city} {asn} {zone} {session}
	Password         string   `json:"password"`
	Countries        []string `json:"countries"`        // supported ISO codes ("*" = any)
	ASNs             []int    `json:"asns"`
	Weight           int      `json:"weight"`
	CostPerGB        float64  `json:"costPerGb"`        // upstream $/GB (for cost-aware routing + margin)
	UsageAPIURL      string   `json:"usageApiUrl"`      // optional provider usage API (bearer-auth)
	APIToken         string   `json:"apiToken"`         // optional provider mgmt token
	// Dedicated owned-IP egress (kind == "dedicated"): IPs assigned to THIS edge
	// node's interfaces; the gateway binds the source address per connection.
	LocalIPs         []string `json:"localIps"`
	Shared           bool     `json:"shared"`           // allow shared use when an org has no dedicated allocation
	Region           string   `json:"region"`           // PoP region (e.g. us-east-1)
}

type Config struct {
	ListenHTTP    string
	ListenSOCKS   string
	ListenMetrics string

	DatabaseURL string
	RedisURL    string

	UsageStream       string
	UsageStreamMaxLen int64

	SessionTTL  time.Duration
	DialTimeout time.Duration
	IdleTimeout time.Duration

	AllowDirect bool
	Providers   []ProviderConfig

	AuthFailThreshold int
	AuthFailWindow    time.Duration

	OTLPEndpoint string
	ServiceName  string
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func envInt(k string, def int) int {
	if v := os.Getenv(k); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func envBool(k string, def bool) bool {
	if v := os.Getenv(k); v != "" {
		return v == "true" || v == "1"
	}
	return def
}

// Load reads configuration from the environment. Provider definitions come from
// PROVIDERS_JSON (inline) or PROVIDERS_FILE (path to a JSON array).
func Load() (*Config, error) {
	c := &Config{
		ListenHTTP:        env("LISTEN_HTTP", ":10000"),
		ListenSOCKS:       env("LISTEN_SOCKS", ":1080"),
		ListenMetrics:     env("LISTEN_METRICS", ":9090"),
		DatabaseURL:       env("DATABASE_URL", ""),
		RedisURL:          env("REDIS_URL", "redis://127.0.0.1:6379"),
		UsageStream:       env("USAGE_STREAM", "usage:events"),
		UsageStreamMaxLen: int64(envInt("USAGE_STREAM_MAXLEN", 1_000_000)),
		SessionTTL:        time.Duration(envInt("SESSION_TTL_SECONDS", 600)) * time.Second,
		DialTimeout:       time.Duration(envInt("DIAL_TIMEOUT_MS", 15000)) * time.Millisecond,
		IdleTimeout:       time.Duration(envInt("IDLE_TIMEOUT_S", 120)) * time.Second,
		AllowDirect:       envBool("ALLOW_DIRECT", false),
		AuthFailThreshold: envInt("AUTH_FAIL_THRESHOLD", 10),
		AuthFailWindow:    time.Duration(envInt("AUTH_FAIL_WINDOW_S", 900)) * time.Second,
		OTLPEndpoint:      env("OTEL_EXPORTER_OTLP_ENDPOINT", ""),
		ServiceName:       env("OTEL_SERVICE_NAME", "baalvion-gateway"),
	}

	raw := os.Getenv("PROVIDERS_JSON")
	if raw == "" {
		if path := os.Getenv("PROVIDERS_FILE"); path != "" {
			b, err := os.ReadFile(path)
			if err != nil {
				return nil, err
			}
			raw = string(b)
		}
	}
	if raw != "" {
		if err := json.Unmarshal([]byte(raw), &c.Providers); err != nil {
			return nil, err
		}
	}
	return c, nil
}
