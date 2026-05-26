package orchestrator

// Ban / degradation classification.
//
// IMPORTANT: for HTTPS CONNECT tunnels the gateway cannot see the inner HTTP
// status or CAPTCHA (that would require TLS MITM, which we do not do). Therefore
// status-based ban detection is only meaningful for plain-HTTP requests and is
// surfaced via Orchestrator.ReportOutcome. Connection-level signals (TCP/TLS
// failures, timeouts) are always captured at dial time and feed the scorer.

// isBanStatus reports whether an HTTP status indicates an upstream ban/block.
func isBanStatus(status int) bool {
	switch status {
	case 403, 407, 429, 451:
		return true
	default:
		return status >= 500 // upstream/edge errors also count as degradation
	}
}

// classifyConnErr maps a dial error string to whether it should count as a ban
// signal (vs a transient infra failure). Conservative: connection resets and
// TLS handshake failures on otherwise-healthy providers often indicate blocks.
func classifyConnErr(errStr string) (banSignal bool) {
	for _, s := range []string{"connection reset", "tls:", "handshake", "forbidden", "refused"} {
		if containsFold(errStr, s) {
			return true
		}
	}
	return false
}

func containsFold(haystack, needle string) bool {
	h, n := []byte(haystack), []byte(needle)
	if len(n) == 0 || len(h) < len(n) {
		return false
	}
	for i := 0; i+len(n) <= len(h); i++ {
		match := true
		for j := 0; j < len(n); j++ {
			if lower(h[i+j]) != lower(n[j]) {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func lower(b byte) byte {
	if b >= 'A' && b <= 'Z' {
		return b + 32
	}
	return b
}
