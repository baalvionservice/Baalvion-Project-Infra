package provider

import (
	"bufio"
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	xproxy "golang.org/x/net/proxy"

	"github.com/baalvion/gateway/internal/config"
	"github.com/baalvion/gateway/internal/model"
)

// Upstream is a REAL adapter for a commercial proxy provider. Every major
// residential/ISP provider (Bright Data, Oxylabs, SOAX, Smartproxy, IPRoyal) is
// reachable as an upstream HTTP or SOCKS5 proxy with a username that encodes
// geo/session targeting; this adapter performs the actual upstream handshake
// and injects targeting into the username template. With real credentials it
// forwards real traffic. It contains no simulated responses.
type Upstream struct {
	cfg         config.ProviderConfig
	dialer      *net.Dialer
	dialTimeout time.Duration
}

func NewUpstream(cfg config.ProviderConfig, dialTimeout time.Duration) *Upstream {
	if cfg.Weight <= 0 {
		cfg.Weight = 1
	}
	return &Upstream{
		cfg:         cfg,
		dialer:      &net.Dialer{Timeout: dialTimeout, KeepAlive: 30 * time.Second},
		dialTimeout: dialTimeout,
	}
}

func (u *Upstream) Name() string             { return u.cfg.Name }
func (u *Upstream) Weight() int              { return u.cfg.Weight }
func (u *Upstream) GetASNCapabilities() []int { return u.cfg.ASNs }

func (u *Upstream) GetRegions() []Region {
	regions := make([]Region, 0, len(u.cfg.Countries))
	for _, c := range u.cfg.Countries {
		regions = append(regions, Region{Country: c})
	}
	return regions
}

func (u *Upstream) Supports(country string, asn int) bool {
	if len(u.cfg.Countries) == 0 {
		return true
	}
	okCountry := country == ""
	for _, c := range u.cfg.Countries {
		if c == "*" || strings.EqualFold(c, country) {
			okCountry = true
			break
		}
	}
	if !okCountry {
		return false
	}
	if asn == 0 || len(u.cfg.ASNs) == 0 {
		return true
	}
	for _, a := range u.cfg.ASNs {
		if a == asn {
			return true
		}
	}
	return false
}

// formatUsername expands targeting placeholders into the provider's username.
func formatUsername(tmpl string, d model.Directives) string {
	r := strings.NewReplacer(
		"{country}", d.Country,
		"{state}", d.State,
		"{city}", d.City,
		"{zone}", d.Zone,
		"{session}", d.Session,
		"{asn}", fmt.Sprintf("%d", d.ASN),
		"{carrier}", d.Carrier,
		"{isp}", d.ISP,
	)
	out := r.Replace(tmpl)
	// Drop dangling separators left by empty optional segments.
	out = strings.ReplaceAll(out, "--", "-")
	return strings.Trim(out, "-")
}

func (u *Upstream) Connect(ctx context.Context, req model.ProxyRequest) (*UpstreamConnection, error) {
	username := formatUsername(u.cfg.UsernameTemplate, req.Directives)
	dest := net.JoinHostPort(req.DestHost, fmt.Sprintf("%d", req.DestPort))

	switch strings.ToLower(u.cfg.Kind) {
	case "socks5":
		auth := &xproxy.Auth{User: username, Password: u.cfg.Password}
		d, err := xproxy.SOCKS5("tcp", u.cfg.Address, auth, u.dialer)
		if err != nil {
			return nil, fmt.Errorf("socks5 dialer: %w", err)
		}
		cd, ok := d.(xproxy.ContextDialer)
		var conn net.Conn
		if ok {
			conn, err = cd.DialContext(ctx, "tcp", dest)
		} else {
			conn, err = d.Dial("tcp", dest)
		}
		if err != nil {
			return nil, fmt.Errorf("upstream socks5 dial: %w", err)
		}
		return &UpstreamConnection{Conn: conn, Provider: u.cfg.Name}, nil

	case "http", "https", "":
		return u.connectHTTP(ctx, username, dest)
	default:
		return nil, fmt.Errorf("unknown provider kind %q", u.cfg.Kind)
	}
}

// connectHTTP opens a TCP (or TLS) connection to the upstream HTTP proxy and
// performs an HTTP CONNECT to the destination with Proxy-Authorization.
func (u *Upstream) connectHTTP(ctx context.Context, username, dest string) (*UpstreamConnection, error) {
	var (
		conn net.Conn
		err  error
	)
	if strings.EqualFold(u.cfg.Kind, "https") {
		td := &tls.Dialer{NetDialer: u.dialer}
		conn, err = td.DialContext(ctx, "tcp", u.cfg.Address)
	} else {
		conn, err = u.dialer.DialContext(ctx, "tcp", u.cfg.Address)
	}
	if err != nil {
		return nil, fmt.Errorf("dial upstream %s: %w", u.cfg.Address, err)
	}

	// Bound the CONNECT handshake (client request context may have no deadline).
	handshakeDL := time.Now().Add(u.dialTimeout)
	if dl, ok := ctx.Deadline(); ok && dl.Before(handshakeDL) {
		handshakeDL = dl
	}
	_ = conn.SetDeadline(handshakeDL)

	cred := base64.StdEncoding.EncodeToString([]byte(username + ":" + u.cfg.Password))
	reqLine := fmt.Sprintf(
		"CONNECT %s HTTP/1.1\r\nHost: %s\r\nProxy-Authorization: Basic %s\r\nProxy-Connection: Keep-Alive\r\n\r\n",
		dest, dest, cred,
	)
	if _, err := conn.Write([]byte(reqLine)); err != nil {
		conn.Close()
		return nil, fmt.Errorf("write CONNECT: %w", err)
	}

	br := bufio.NewReader(conn)
	resp, err := http.ReadResponse(br, &http.Request{Method: http.MethodConnect})
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("read CONNECT response: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		conn.Close()
		return nil, fmt.Errorf("upstream CONNECT rejected: %s", resp.Status)
	}

	// Clear the deadline now that the tunnel is established (streaming uses idle deadlines).
	_ = conn.SetDeadline(time.Time{})
	return &UpstreamConnection{Conn: conn, Provider: u.cfg.Name}, nil
}

// HealthCheck verifies the upstream proxy endpoint is reachable (TCP/TLS).
func (u *Upstream) HealthCheck(ctx context.Context) error {
	d := &net.Dialer{Timeout: u.dialTimeout}
	var conn net.Conn
	var err error
	if strings.EqualFold(u.cfg.Kind, "https") {
		conn, err = (&tls.Dialer{NetDialer: d}).DialContext(ctx, "tcp", u.cfg.Address)
	} else {
		conn, err = d.DialContext(ctx, "tcp", u.cfg.Address)
	}
	if err != nil {
		return err
	}
	conn.Close()
	return nil
}
