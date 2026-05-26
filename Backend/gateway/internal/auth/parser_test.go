package auth

import "testing"

func TestParseProxyUsername_Full(t *testing.T) {
	d := ParseProxyUsername("customer-acme-zone-residential-country-us-city-newyork-session-abc123")
	if d.Customer != "acme" {
		t.Errorf("customer = %q", d.Customer)
	}
	if d.Zone != "residential" {
		t.Errorf("zone = %q", d.Zone)
	}
	if d.Country != "us" {
		t.Errorf("country = %q", d.Country)
	}
	if d.City != "newyork" {
		t.Errorf("city = %q", d.City)
	}
	if d.Session != "abc123" {
		t.Errorf("session = %q", d.Session)
	}
	if d.Rotation != "sticky" { // session implies sticky
		t.Errorf("rotation = %q, want sticky", d.Rotation)
	}
}

func TestParseProxyUsername_ExplicitRotationAndCC(t *testing.T) {
	d := ParseProxyUsername("customer-x-cc-DE-rotation-rotating")
	if d.Country != "de" {
		t.Errorf("country = %q, want de", d.Country)
	}
	if d.Rotation != "rotating" {
		t.Errorf("rotation = %q", d.Rotation)
	}
	if d.Session != "" {
		t.Errorf("session = %q, want empty", d.Session)
	}
}

func TestParseProxyUsername_ASN(t *testing.T) {
	d := ParseProxyUsername("customer-x-asn-AS15169-country-us")
	if d.ASN != 15169 {
		t.Errorf("asn = %d, want 15169", d.ASN)
	}
}

func TestParseProxyUsername_NoDirectives(t *testing.T) {
	d := ParseProxyUsername("plainuser")
	if d.Rotation != "rotating" {
		t.Errorf("default rotation = %q, want rotating", d.Rotation)
	}
}

func TestParseProxyUsername_CarrierAndISP(t *testing.T) {
	d := ParseProxyUsername("customer-acme-country-us-carrier-verizon-isp-comcast-session-s1")
	if d.Country != "us" {
		t.Errorf("country = %q", d.Country)
	}
	if d.Carrier != "verizon" {
		t.Errorf("carrier = %q, want verizon", d.Carrier)
	}
	if d.ISP != "comcast" {
		t.Errorf("isp = %q, want comcast", d.ISP)
	}
	if d.Rotation != "sticky" {
		t.Errorf("session implies sticky, got %q", d.Rotation)
	}
}
