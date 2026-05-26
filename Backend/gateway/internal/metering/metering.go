// Package metering is the billing source of truth: it streams per-connection
// byte counts to a Redis Stream (the same `usage:events` the control plane
// consumes), batched and pipelined, with non-blocking ingestion and retry.
package metering

import (
	"context"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/baalvion/gateway/internal/model"
)

type Emitter struct {
	rdb    *redis.Client
	stream string
	maxLen int64
	ch     chan model.MeterEvent
	batch  int
	flush  time.Duration
}

func New(rdb *redis.Client, stream string, maxLen int64, buffer int) *Emitter {
	if buffer <= 0 {
		buffer = 8192
	}
	return &Emitter{
		rdb:    rdb,
		stream: stream,
		maxLen: maxLen,
		ch:     make(chan model.MeterEvent, buffer),
		batch:  256,
		flush:  time.Second,
	}
}

// Emit is non-blocking: if the buffer is full the event is dropped and counted
// (better to lose a metering sample than to stall live traffic). Callers should
// treat dropped samples as a monitored condition.
func (e *Emitter) Emit(ev model.MeterEvent) {
	if ev.Ts.IsZero() {
		ev.Ts = time.Now()
	}
	select {
	case e.ch <- ev:
	default:
		dropped.Inc()
	}
}

func (e *Emitter) values(ev model.MeterEvent) map[string]any {
	return map[string]any{
		"ts":        strconv.FormatInt(ev.Ts.UnixMilli(), 10),
		"kind":      "proxy.traffic",
		"org":       ev.OrgID,
		"apiKey":    ev.APIKeyID,
		"session":   ev.SessionID,
		"provider":  ev.Provider,
		"country":   ev.Country,
		"dest":      ev.DestHost,
		"bytesIn":   strconv.FormatInt(ev.BytesIn, 10),
		"bytesOut":  strconv.FormatInt(ev.BytesOut, 10),
		"status":    strconv.Itoa(ev.Status),
		"latencyMs": strconv.FormatInt(ev.LatencyMs, 10),
		"success":   strconv.FormatBool(ev.Success),
		"authType":  "proxy",
	}
}

// Run drains the buffer to Redis in batches until ctx is cancelled, then flushes.
func (e *Emitter) Run(ctx context.Context) {
	ticker := time.NewTicker(e.flush)
	defer ticker.Stop()
	buf := make([]model.MeterEvent, 0, e.batch)

	flush := func() {
		if len(buf) == 0 {
			return
		}
		pipe := e.rdb.Pipeline()
		for _, ev := range buf {
			pipe.XAdd(context.Background(), &redis.XAddArgs{
				Stream: e.stream,
				MaxLen: e.maxLen,
				Approx: true,
				Values: e.values(ev),
			})
		}
		if _, err := pipe.Exec(context.Background()); err != nil {
			// Retry once; on continued failure, drop (metered loss is monitored).
			pipe2 := e.rdb.Pipeline()
			for _, ev := range buf {
				pipe2.XAdd(context.Background(), &redis.XAddArgs{Stream: e.stream, MaxLen: e.maxLen, Approx: true, Values: e.values(ev)})
			}
			if _, err2 := pipe2.Exec(context.Background()); err2 != nil {
				failed.Add(float64(len(buf)))
			}
		}
		buf = buf[:0]
	}

	for {
		select {
		case <-ctx.Done():
			// Drain remaining buffered events on shutdown.
			for {
				select {
				case ev := <-e.ch:
					buf = append(buf, ev)
					if len(buf) >= e.batch {
						flush()
					}
				default:
					flush()
					return
				}
			}
		case ev := <-e.ch:
			buf = append(buf, ev)
			if len(buf) >= e.batch {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}
