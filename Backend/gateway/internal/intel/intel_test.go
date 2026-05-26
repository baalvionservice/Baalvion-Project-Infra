package intel

import "testing"

func TestWeight_FailOpenWithoutRedis(t *testing.T) {
	c := NewCache(nil, 0)
	if got := c.Weight("any-provider"); got != 1.0 {
		t.Fatalf("expected neutral weight 1.0 without redis, got %v", got)
	}
	// nil receiver must also be safe (orchestrator may not set it).
	var nilCache *Cache
	if got := nilCache.Weight("p"); got != 1.0 {
		t.Fatalf("expected 1.0 from nil cache, got %v", got)
	}
}

func TestWeight_UsesPublishedSnapshot(t *testing.T) {
	c := NewCache(nil, 0)
	// Simulate a refreshed snapshot directly (no redis → no refresh attempted).
	c.weights = map[string]float64{"brightdata": 0.8, "oxylabs": 0.4}
	if got := c.Weight("brightdata"); got != 0.8 {
		t.Errorf("brightdata weight = %v, want 0.8", got)
	}
	if got := c.Weight("oxylabs"); got != 0.4 {
		t.Errorf("oxylabs weight = %v, want 0.4", got)
	}
	if got := c.Weight("unknown"); got != 1.0 {
		t.Errorf("unknown provider should default to 1.0, got %v", got)
	}
}
