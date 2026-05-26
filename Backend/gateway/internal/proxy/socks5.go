package proxy

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"time"

	"github.com/baalvion/gateway/internal/metrics"
)

// SOCKS5 protocol constants (RFC 1928 / RFC 1929).
const (
	socks5Version = 0x05
	authUserPass  = 0x02
	authNoAccept  = 0xFF
	userAuthVer   = 0x01
	cmdConnect    = 0x01
	atypIPv4      = 0x01
	atypDomain    = 0x03
	atypIPv6      = 0x04
	repSuccess    = 0x00
	repGenFail    = 0x01
	repNotAllowed = 0x02
	repHostUnreach= 0x04
	repCmdNotSup  = 0x07
)

// ServeSOCKS accepts SOCKS5 connections until the listener closes.
func (g *Gateway) ServeSOCKS(l net.Listener) error {
	for {
		conn, err := l.Accept()
		if err != nil {
			return err
		}
		go g.handleSOCKS(conn)
	}
}

func (g *Gateway) handleSOCKS(conn net.Conn) {
	start := time.Now()
	clientIP := clientIPOf(conn)
	closed := false
	defer func() {
		if !closed {
			conn.Close()
		}
	}()

	_ = conn.SetReadDeadline(time.Now().Add(15 * time.Second))

	// ── Method negotiation ──
	header := make([]byte, 2)
	if _, err := io.ReadFull(conn, header); err != nil || header[0] != socks5Version {
		return
	}
	methods := make([]byte, int(header[1]))
	if _, err := io.ReadFull(conn, methods); err != nil {
		return
	}
	if !contains(methods, authUserPass) {
		conn.Write([]byte{socks5Version, authNoAccept})
		return
	}
	if _, err := conn.Write([]byte{socks5Version, authUserPass}); err != nil {
		return
	}

	// ── Username/password sub-negotiation (RFC 1929) ──
	user, pass, err := readUserPass(conn)
	if err != nil {
		return
	}
	ac, dirs, aerr := g.Auth.Authenticate(context.Background(), user, pass, clientIP)
	if aerr != nil {
		metrics.AuthFailures.WithLabelValues(authReason(aerr)).Inc()
		conn.Write([]byte{userAuthVer, 0x01}) // auth failure
		return
	}
	if _, err := conn.Write([]byte{userAuthVer, 0x00}); err != nil {
		return
	}

	// ── Request ──
	host, port, cmd, rerr := readRequest(conn)
	if rerr != nil {
		writeSocksReply(conn, repGenFail)
		return
	}
	if cmd != cmdConnect {
		writeSocksReply(conn, repCmdNotSup)
		return
	}

	_ = conn.SetReadDeadline(time.Time{})

	upstream, release, derr := g.authorizeAndDial(context.Background(), ac, dirs, host, port, clientIP)
	if derr != nil {
		writeSocksReply(conn, socksRepFor(derr))
		return
	}
	if err := writeSocksReply(conn, repSuccess); err != nil {
		release()
		upstream.Conn.Close()
		return
	}

	closed = true // finishTunnel owns conn lifecycle now
	g.finishTunnel(conn, upstream, ac, dirs, host, "socks5", start, release)
}

func readUserPass(conn net.Conn) (string, string, error) {
	v := make([]byte, 2)
	if _, err := io.ReadFull(conn, v); err != nil || v[0] != userAuthVer {
		return "", "", errors.New("bad auth version")
	}
	ulen := int(v[1])
	ubuf := make([]byte, ulen+1)
	if _, err := io.ReadFull(conn, ubuf); err != nil {
		return "", "", err
	}
	user := string(ubuf[:ulen])
	plen := int(ubuf[ulen])
	pbuf := make([]byte, plen)
	if _, err := io.ReadFull(conn, pbuf); err != nil {
		return "", "", err
	}
	return user, string(pbuf), nil
}

func readRequest(conn net.Conn) (host string, port int, cmd byte, err error) {
	head := make([]byte, 4)
	if _, err = io.ReadFull(conn, head); err != nil {
		return
	}
	if head[0] != socks5Version {
		err = errors.New("bad version")
		return
	}
	cmd = head[1]
	switch head[3] {
	case atypIPv4:
		b := make([]byte, 4)
		if _, err = io.ReadFull(conn, b); err != nil {
			return
		}
		host = net.IP(b).String()
	case atypIPv6:
		b := make([]byte, 16)
		if _, err = io.ReadFull(conn, b); err != nil {
			return
		}
		host = net.IP(b).String()
	case atypDomain:
		l := make([]byte, 1)
		if _, err = io.ReadFull(conn, l); err != nil {
			return
		}
		d := make([]byte, int(l[0]))
		if _, err = io.ReadFull(conn, d); err != nil {
			return
		}
		host = string(d)
	default:
		err = errors.New("unknown atyp")
		return
	}
	pb := make([]byte, 2)
	if _, err = io.ReadFull(conn, pb); err != nil {
		return
	}
	port = int(binary.BigEndian.Uint16(pb))
	return
}

func writeSocksReply(conn net.Conn, rep byte) error {
	// VER REP RSV ATYP=IPv4 BND.ADDR=0.0.0.0 BND.PORT=0
	_, err := conn.Write([]byte{socks5Version, rep, 0x00, atypIPv4, 0, 0, 0, 0, 0, 0})
	return err
}

func socksRepFor(err error) byte {
	switch {
	case errors.Is(err, ErrBlockedDest), errors.Is(err, ErrQuotaExceeded), errors.Is(err, ErrEnforced), errors.Is(err, ErrGeoRestricted):
		return repNotAllowed
	case errors.Is(err, ErrUpstreamDial):
		return repHostUnreach
	default:
		return repGenFail
	}
}

func contains(b []byte, v byte) bool {
	for _, x := range b {
		if x == v {
			return true
		}
	}
	return false
}
