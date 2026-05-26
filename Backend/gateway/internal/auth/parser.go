package auth

import (
	"strconv"
	"strings"

	"github.com/baalvion/gateway/internal/model"
)

// knownKeys are the directive keywords recognized in a structured proxy
// username. Format: <key>-<value>-<key>-<value>... e.g.
//   customer-acme-zone-residential-country-us-city-newyork-session-abc123
var knownKeys = map[string]bool{
	"customer": true, "cust": true,
	"zone":    true,
	"country": true, "cc": true,
	"state":   true,
	"city":    true,
	"asn":     true,
	"carrier": true, "mobile": true,
	"isp":     true,
	"session": true, "sess": true, "sessid": true,
	"rotate": true, "rotation": true,
}

// ParseProxyUsername parses routing directives from a proxy username. It mirrors
// the format produced by the control-plane developer API (Prompt 2). Unknown
// leading tokens are ignored. A session id implies sticky rotation by default.
func ParseProxyUsername(username string) model.Directives {
	d := model.Directives{}
	tokens := strings.Split(username, "-")

	for i := 0; i < len(tokens); i++ {
		key := strings.ToLower(tokens[i])
		if !knownKeys[key] || i+1 >= len(tokens) {
			continue
		}
		val := tokens[i+1]
		switch key {
		case "customer", "cust":
			d.Customer = val
		case "zone":
			d.Zone = val
		case "country", "cc":
			d.Country = strings.ToLower(val)
		case "state":
			d.State = strings.ToLower(val)
		case "city":
			d.City = strings.ToLower(val)
		case "asn":
			if n, err := strconv.Atoi(strings.TrimPrefix(strings.ToLower(val), "as")); err == nil {
				d.ASN = n
			}
		case "carrier", "mobile":
			d.Carrier = strings.ToLower(val)
		case "isp":
			d.ISP = strings.ToLower(val)
		case "session", "sess", "sessid":
			d.Session = val
		case "rotate", "rotation":
			d.Rotation = strings.ToLower(val)
		}
		i++ // consumed the value token
	}

	if d.Rotation == "" {
		if d.Session != "" {
			d.Rotation = "sticky"
		} else {
			d.Rotation = "rotating"
		}
	}
	return d
}
