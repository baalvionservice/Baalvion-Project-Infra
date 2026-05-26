package proxy

import (
	"encoding/base64"
	"errors"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/baalvion/gateway/internal/auth"
	"github.com/baalvion/gateway/internal/metrics"
)

// ServeHTTP implements an HTTP forward proxy: CONNECT for TLS tunnels (the path
// browsers, Puppeteer/Playwright/Selenium and scrapers use) and absolute-form
// requests for plain HTTP.
func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodConnect {
		g.handleConnect(w, r)
		return
	}
	if r.URL.IsAbs() {
		g.handleHTTP(w, r)
		return
	}
	http.Error(w, "this is a forward proxy", http.StatusBadRequest)
}

func parseProxyBasic(r *http.Request) (user, pass string, ok bool) {
	h := r.Header.Get("Proxy-Authorization")
	if h == "" || !strings.HasPrefix(h, "Basic ") {
		return "", "", false
	}
	raw, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(h, "Basic "))
	if err != nil {
		return "", "", false
	}
	s := string(raw)
	i := strings.IndexByte(s, ':')
	if i < 0 {
		return "", "", false
	}
	return s[:i], s[i+1:], true
}

func requireProxyAuth(w http.ResponseWriter) {
	w.Header().Set("Proxy-Authenticate", `Basic realm="Baalvion Proxy"`)
	http.Error(w, "proxy authentication required", http.StatusProxyAuthRequired)
}

func (g *Gateway) authHTTP(w http.ResponseWriter, r *http.Request) (ac authResult, ok bool) {
	user, pass, has := parseProxyBasic(r)
	if !has {
		requireProxyAuth(w)
		return authResult{}, false
	}
	clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	c, dirs, err := g.Auth.Authenticate(r.Context(), user, pass, clientIP)
	if err != nil {
		metrics.AuthFailures.WithLabelValues(authReason(err)).Inc()
		if errors.Is(err, auth.ErrLockedOut) {
			http.Error(w, "too many failed attempts", http.StatusTooManyRequests)
		} else {
			requireProxyAuth(w)
		}
		return authResult{}, false
	}
	return authResult{ctx: c, dirs: dirs, clientIP: clientIP}, true
}

func (g *Gateway) handleConnect(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	res, ok := g.authHTTP(w, r)
	if !ok {
		return
	}

	host, portStr, err := net.SplitHostPort(r.Host)
	if err != nil {
		host, portStr = r.Host, "443"
	}
	port := atoiPort(portStr, 443)

	upstream, release, derr := g.authorizeAndDial(r.Context(), res.ctx, res.dirs, host, port, res.clientIP)
	if derr != nil {
		writeDialError(w, derr)
		return
	}

	hj, ok := w.(http.Hijacker)
	if !ok {
		release()
		upstream.Conn.Close()
		http.Error(w, "hijacking unsupported", http.StatusInternalServerError)
		return
	}
	clientConn, _, herr := hj.Hijack()
	if herr != nil {
		release()
		upstream.Conn.Close()
		return
	}
	if _, err := clientConn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n")); err != nil {
		release()
		upstream.Conn.Close()
		clientConn.Close()
		return
	}
	defer clientConn.Close()

	g.finishTunnel(clientConn, upstream, res.ctx, res.dirs, host, "http_connect", start, release)
}

func (g *Gateway) handleHTTP(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	res, ok := g.authHTTP(w, r)
	if !ok {
		return
	}

	host := r.URL.Hostname()
	port := atoiPort(r.URL.Port(), 80)

	upstream, release, derr := g.authorizeAndDial(r.Context(), res.ctx, res.dirs, host, port, res.clientIP)
	if derr != nil {
		writeDialError(w, derr)
		return
	}

	hj, ok := w.(http.Hijacker)
	if !ok {
		release()
		upstream.Conn.Close()
		http.Error(w, "hijacking unsupported", http.StatusInternalServerError)
		return
	}
	clientConn, _, herr := hj.Hijack()
	if herr != nil {
		release()
		upstream.Conn.Close()
		return
	}
	defer clientConn.Close()

	// Forward the request to the upstream tunnel in origin form, then stream the
	// remainder bidirectionally (covers the response + keep-alive follow-ups).
	r.Header.Del("Proxy-Authorization")
	r.Header.Del("Proxy-Connection")
	r.RequestURI = ""
	r.URL.Scheme = ""
	r.URL.Host = ""
	if err := r.Write(upstream.Conn); err != nil {
		release()
		upstream.Conn.Close()
		return
	}

	g.finishTunnel(clientConn, upstream, res.ctx, res.dirs, host, "http", start, release)
}

func writeDialError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrBlockedDest), errors.Is(err, ErrEnforced), errors.Is(err, ErrGeoRestricted):
		http.Error(w, "destination not allowed", http.StatusForbidden)
	case errors.Is(err, ErrQuotaExceeded):
		http.Error(w, "quota exhausted — upgrade or add credit", http.StatusPaymentRequired)
	case errors.Is(err, ErrConcurrency), errors.Is(err, ErrRateLimited):
		http.Error(w, "rate/concurrency limit exceeded", http.StatusTooManyRequests)
	default:
		http.Error(w, "upstream unavailable", http.StatusBadGateway)
	}
}
