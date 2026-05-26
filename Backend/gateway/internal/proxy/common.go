package proxy

import (
	"errors"

	"github.com/baalvion/gateway/internal/auth"
	"github.com/baalvion/gateway/internal/model"
)

type authResult struct {
	ctx      model.AuthContext
	dirs     model.Directives
	clientIP string
}

func authReason(err error) string {
	switch {
	case errors.Is(err, auth.ErrLockedOut):
		return "locked_out"
	case errors.Is(err, auth.ErrForbidden):
		return "forbidden"
	default:
		return "invalid_credentials"
	}
}
