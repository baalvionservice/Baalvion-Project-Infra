// Package auth authenticates proxy credentials against the control-plane
// database written by Prompt 2 (api_keys / api_key_scopes / organizations) and
// enforces brute-force lockout via Redis. It never trusts client-supplied org
// identity — the organization is derived from the verified key row.
package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/baalvion/gateway/internal/model"
)

var (
	ErrUnauthorized = errors.New("invalid proxy credentials")
	ErrLockedOut    = errors.New("too many failed attempts")
	ErrForbidden    = errors.New("key not authorized for proxy access")
)

type Authenticator struct {
	pool      *pgxpool.Pool
	rdb       *redis.Client
	threshold int
	window    time.Duration
}

func New(pool *pgxpool.Pool, rdb *redis.Client, threshold int, window time.Duration) *Authenticator {
	return &Authenticator{pool: pool, rdb: rdb, threshold: threshold, window: window}
}

func hashKey(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func (a *Authenticator) failKey(ip string) string { return "authfail:proxyip:" + ip }

// Authenticate verifies the proxy password (a bvl_proxy_ key) and parses the
// username's routing directives. clientIP is used for lockout + audit.
func (a *Authenticator) Authenticate(ctx context.Context, username, password, clientIP string) (model.AuthContext, model.Directives, error) {
	dirs := ParseProxyUsername(username)

	if locked, _ := a.isLockedOut(ctx, clientIP); locked {
		return model.AuthContext{}, dirs, ErrLockedOut
	}

	const q = `
		SELECT k.id::text, k.org_id::text, k.key_type, k.status, k.revoked_at, k.expires_at,
		       o.plan_slug, o.status
		FROM public.api_keys k
		JOIN public.organizations o ON o.id = k.org_id
		WHERE k.key_hash = $1`

	var (
		keyID, orgID, keyType, keyStatus, planSlug, orgStatus string
		revokedAt, expiresAt                                  *time.Time
	)
	err := a.pool.QueryRow(ctx, q, hashKey(password)).Scan(
		&keyID, &orgID, &keyType, &keyStatus, &revokedAt, &expiresAt, &planSlug, &orgStatus,
	)
	if err != nil {
		a.recordFailure(ctx, clientIP, "invalid_key", "")
		return model.AuthContext{}, dirs, ErrUnauthorized
	}

	if keyType != "proxy" {
		a.recordFailure(ctx, clientIP, "not_a_proxy_key", orgID)
		return model.AuthContext{}, dirs, ErrForbidden
	}
	if keyStatus != "active" || revokedAt != nil {
		a.recordFailure(ctx, clientIP, "key_inactive", orgID)
		return model.AuthContext{}, dirs, ErrUnauthorized
	}
	if expiresAt != nil && expiresAt.Before(time.Now()) {
		a.recordFailure(ctx, clientIP, "key_expired", orgID)
		return model.AuthContext{}, dirs, ErrUnauthorized
	}
	if orgStatus != "active" {
		a.recordFailure(ctx, clientIP, "org_suspended", orgID)
		return model.AuthContext{}, dirs, ErrForbidden
	}

	scopes, hasConnect := a.loadScopes(ctx, keyID)
	if !hasConnect {
		a.recordFailure(ctx, clientIP, "missing_scope", orgID)
		return model.AuthContext{}, dirs, ErrForbidden
	}

	// Sticky requires the proxy:sticky scope; downgrade silently otherwise.
	if dirs.Rotation == "sticky" && !hasScope(scopes, "proxy:sticky") {
		dirs.Rotation = "rotating"
	}

	a.clearFailures(ctx, clientIP)
	a.audit(ctx, orgID, keyID, clientIP, "success", "")

	return model.AuthContext{OrgID: orgID, APIKeyID: keyID, Plan: planSlug, Scopes: scopes}, dirs, nil
}

func (a *Authenticator) loadScopes(ctx context.Context, keyID string) ([]string, bool) {
	rows, err := a.pool.Query(ctx, `SELECT scope FROM public.api_key_scopes WHERE api_key_id = $1`, keyID)
	if err != nil {
		return nil, false
	}
	defer rows.Close()
	var scopes []string
	for rows.Next() {
		var s string
		if rows.Scan(&s) == nil {
			scopes = append(scopes, s)
		}
	}
	return scopes, hasScope(scopes, "proxy:connect") || hasScope(scopes, "*")
}

func hasScope(scopes []string, want string) bool {
	for _, s := range scopes {
		if s == want || s == "*" {
			return true
		}
	}
	return false
}

func (a *Authenticator) isLockedOut(ctx context.Context, ip string) (bool, error) {
	n, err := a.rdb.Get(ctx, a.failKey(ip)).Int()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, nil // fail open on Redis error for lockout reads
	}
	return n >= a.threshold, nil
}

func (a *Authenticator) recordFailure(ctx context.Context, ip, reason, orgID string) {
	k := a.failKey(ip)
	if n, err := a.rdb.Incr(ctx, k).Result(); err == nil && n == 1 {
		a.rdb.Expire(ctx, k, a.window)
	}
	_, _ = a.pool.Exec(ctx,
		`INSERT INTO public.failed_auth_attempts (identifier, auth_type, reason, ip_address, org_id)
		 VALUES ($1, 'proxy', $2, $3, NULLIF($4,'')::uuid)`,
		"proxyip:"+ip, reason, nullIP(ip), orgID)
	a.audit(ctx, orgID, "", ip, "failure", reason)
}

func (a *Authenticator) clearFailures(ctx context.Context, ip string) { a.rdb.Del(ctx, a.failKey(ip)) }

func (a *Authenticator) audit(ctx context.Context, orgID, keyID, ip, outcome, reason string) {
	_, _ = a.pool.Exec(ctx,
		`INSERT INTO public.auth_audit_logs (org_id, auth_type, outcome, reason, api_key_id, ip_address)
		 VALUES (NULLIF($1,'')::uuid, 'proxy', $2, NULLIF($3,''), NULLIF($4,'')::uuid, $5)`,
		orgID, outcome, reason, keyID, nullIP(ip))
}

// nullIP returns nil for empty IP so INET column accepts NULL.
func nullIP(ip string) any {
	if ip == "" {
		return nil
	}
	return ip
}
