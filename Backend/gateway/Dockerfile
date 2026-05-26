# ── build ──
FROM golang:1.22-alpine AS build
WORKDIR /src
RUN apk add --no-cache git
COPY go.mod ./
COPY go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/gateway ./cmd/gateway

# ── runtime (distroless, non-root, static) ──
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/gateway /gateway
# 10000 = HTTP/CONNECT proxy, 1080 = SOCKS5, 9090 = metrics/health
EXPOSE 10000 1080 9090
USER nonroot:nonroot
ENTRYPOINT ["/gateway"]
