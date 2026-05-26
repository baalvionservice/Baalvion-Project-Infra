// Command gateway is the Baalvion proxy data plane: an HTTP/HTTPS-CONNECT +
// SOCKS5 forward proxy that authenticates customers, routes through upstream
// providers, meters real bandwidth, and streams usage events.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/baalvion/gateway/internal/auth"
	"github.com/baalvion/gateway/internal/config"
	"github.com/baalvion/gateway/internal/enforce"
	"github.com/baalvion/gateway/internal/metering"
	"github.com/baalvion/gateway/internal/metrics"
	"github.com/baalvion/gateway/internal/orchestrator"
	"github.com/baalvion/gateway/internal/provider"
	"github.com/baalvion/gateway/internal/proxy"
	"github.com/baalvion/gateway/internal/quota"
	"github.com/baalvion/gateway/internal/ratelimit"
	"github.com/baalvion/gateway/internal/security"
	"github.com/baalvion/gateway/internal/session"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(log)

	cfg, err := config.Load()
	if err != nil {
		log.Error("config load failed", "err", err)
		os.Exit(1)
	}
	if cfg.DatabaseURL == "" {
		log.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("postgres connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	ropt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Error("invalid REDIS_URL", "err", err)
		os.Exit(1)
	}
	rdb := redis.NewClient(ropt)
	defer rdb.Close()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Error("redis ping failed", "err", err)
		os.Exit(1)
	}

	// ── Providers (each adapter satisfies the orchestrator.Provider brain) ──
	var providers []orchestrator.Provider
	for _, pc := range cfg.Providers {
		if pc.Kind == "dedicated" {
			providers = append(providers, provider.NewDedicated(pc, rdb, cfg.DialTimeout))
			log.Info("dedicated owned-IP pool registered", "name", pc.Name, "ips", len(pc.LocalIPs), "shared", pc.Shared, "region", pc.Region)
		} else {
			providers = append(providers, provider.NewUpstream(pc, cfg.DialTimeout))
			log.Info("provider registered", "name", pc.Name, "kind", pc.Kind, "countries", pc.Countries, "costPerGb", pc.CostPerGB)
		}
	}
	if cfg.AllowDirect {
		providers = append(providers, provider.NewDirect(cfg.DialTimeout))
		log.Warn("direct egress enabled (datacenter-direct via gateway IP)")
	}
	if len(providers) == 0 {
		log.Error("no providers configured — set PROVIDERS_JSON or ALLOW_DIRECT=true")
		os.Exit(1)
	}

	orch := orchestrator.New(providers, rdb, orchestrator.Options{
		Retries: 2, DefaultStrategy: orchestrator.StrategyCostAware,
		BreakerThreshold: 5, BreakerCooldown: 30 * time.Second,
	})
	orch.StartProbing(ctx, 15*time.Second)

	gw := &proxy.Gateway{
		Auth:         auth.New(pool, rdb, cfg.AuthFailThreshold, cfg.AuthFailWindow),
		Orchestrator: orch,
		Sessions:     session.New(rdb, cfg.SessionTTL),
		Meter:        metering.New(rdb, cfg.UsageStream, cfg.UsageStreamMaxLen, 16384),
		Limiter:      ratelimit.New(rdb),
		Guard:        security.New(),
		Quota:        quota.New(rdb),
		Enforce:      enforce.New(rdb),
		Idle:         cfg.IdleTimeout,
	}
	go gw.Meter.Run(ctx)

	// ── HTTP / CONNECT server ──
	httpSrv := &http.Server{
		Addr:              cfg.ListenHTTP,
		Handler:           gw,
		ReadHeaderTimeout: 10 * time.Second, // Slowloris guard (no WriteTimeout: tunnels stream)
	}
	go func() {
		log.Info("http/connect proxy listening", "addr", cfg.ListenHTTP)
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("http server error", "err", err)
		}
	}()

	// ── SOCKS5 server ──
	socksLn, err := net.Listen("tcp", cfg.ListenSOCKS)
	if err != nil {
		log.Error("socks listen failed", "err", err)
		os.Exit(1)
	}
	go func() {
		log.Info("socks5 proxy listening", "addr", cfg.ListenSOCKS)
		if err := gw.ServeSOCKS(socksLn); err != nil {
			log.Info("socks server stopped", "err", err)
		}
	}()

	// ── Admin: metrics + probes ──
	mux := http.NewServeMux()
	mux.Handle("/metrics", metrics.Handler())
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		if rdb.Ping(r.Context()).Err() != nil || pool.Ping(r.Context()) != nil {
			http.Error(w, "not ready", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
	adminSrv := &http.Server{Addr: cfg.ListenMetrics, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	go func() {
		log.Info("admin/metrics listening", "addr", cfg.ListenMetrics)
		if err := adminSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("admin server error", "err", err)
		}
	}()

	<-ctx.Done()
	log.Info("shutdown signal received, draining…")

	shutCtx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()
	_ = httpSrv.Shutdown(shutCtx)
	_ = adminSrv.Shutdown(shutCtx)
	_ = socksLn.Close()
	// ctx is already cancelled → metering emitter drains and exits.
	time.Sleep(500 * time.Millisecond)
	log.Info("gateway stopped")
}
