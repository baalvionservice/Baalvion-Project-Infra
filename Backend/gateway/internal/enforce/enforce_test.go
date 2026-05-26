package enforce

import "testing"

func TestGeoAllowed_Deny(t *testing.T) {
	d := Decision{GeoDeny: []string{"ru", "cn"}}
	if d.GeoAllowed("ru") {
		t.Error("ru should be denied")
	}
	if !d.GeoAllowed("us") {
		t.Error("us should be allowed")
	}
}

func TestGeoAllowed_AllowList(t *testing.T) {
	d := Decision{GeoAllow: []string{"us", "gb"}}
	if !d.GeoAllowed("US") { // case-insensitive
		t.Error("US should be allowed")
	}
	if d.GeoAllowed("de") {
		t.Error("de should be blocked when an allow-list is set")
	}
}

func TestGeoAllowed_Empty(t *testing.T) {
	if !(Decision{}).GeoAllowed("anything") {
		t.Error("no restrictions → everything allowed")
	}
}
