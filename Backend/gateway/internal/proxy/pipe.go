package proxy

import (
	"net"
	"sync"
	"sync/atomic"
	"time"
)

// 32KiB pooled buffers keep per-connection allocations near zero at high
// concurrency (target: 10k+ simultaneous tunnels).
var bufPool = sync.Pool{New: func() any { b := make([]byte, 32*1024); return &b }}

type halfCloser interface{ CloseWrite() error }

// Tunnel streams bytes bidirectionally between client and upstream until either
// side closes or goes idle. Returns (bytesOut, bytesIn) where bytesOut is
// client→upstream (upload) and bytesIn is upstream→client (download).
func Tunnel(client, upstream net.Conn, idle time.Duration) (bytesOut, bytesIn int64) {
	var up, down int64
	var wg sync.WaitGroup
	wg.Add(2)

	go func() { defer wg.Done(); copyDir(upstream, client, idle, &up) }()   // client → upstream
	go func() { defer wg.Done(); copyDir(client, upstream, idle, &down) }() // upstream → client

	wg.Wait()
	return atomic.LoadInt64(&up), atomic.LoadInt64(&down)
}

func copyDir(dst, src net.Conn, idle time.Duration, counter *int64) {
	bufp := bufPool.Get().(*[]byte)
	buf := *bufp
	defer bufPool.Put(bufp)

	for {
		if idle > 0 {
			_ = src.SetReadDeadline(time.Now().Add(idle))
		}
		n, rerr := src.Read(buf)
		if n > 0 {
			atomic.AddInt64(counter, int64(n))
			if _, werr := dst.Write(buf[:n]); werr != nil {
				break
			}
		}
		if rerr != nil {
			break
		}
	}
	// Signal EOF downstream so the peer can finish gracefully.
	if hc, ok := dst.(halfCloser); ok {
		_ = hc.CloseWrite()
	} else {
		_ = dst.SetReadDeadline(time.Now())
	}
}
