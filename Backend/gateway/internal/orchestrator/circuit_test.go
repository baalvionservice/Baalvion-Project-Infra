package orchestrator

import (
	"testing"
	"time"
)

func TestBreaker_TripsAndRecovers(t *testing.T) {
	b := newBreaker(2, 40*time.Millisecond)

	if !b.Allow() {
		t.Fatal("new breaker should allow")
	}
	b.Failure()
	b.Failure() // hits threshold → open
	if b.Allow() {
		t.Fatal("breaker should be open after threshold failures")
	}

	time.Sleep(50 * time.Millisecond)
	if !b.Allow() {
		t.Fatal("breaker should be half-open (allow a trial) after cooldown")
	}

	b.Success() // half-open trial succeeded → closed
	if !b.Allow() {
		t.Fatal("breaker should be closed after a successful trial")
	}
}

func TestBreaker_HalfOpenFailureReopens(t *testing.T) {
	b := newBreaker(1, 30*time.Millisecond)
	b.Failure() // open
	time.Sleep(40 * time.Millisecond)
	if !b.Allow() {
		t.Fatal("should allow half-open trial")
	}
	b.Failure() // trial failed → reopen
	if b.Allow() {
		t.Fatal("breaker should reopen after failed half-open trial")
	}
}
