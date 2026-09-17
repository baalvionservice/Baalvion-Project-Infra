# syntax=docker/dockerfile:1.7
# Multi-stage build for any financial service in the reactor.
# Usage: docker build --build-arg SERVICE=payment-service -t baalvion/payment-service .
#
# The builder compiles ONLY the selected service + its reactor dependencies, then the
# runtime image copies that service jar.

# ---- Build stage ----
FROM maven:3-eclipse-temurin-26@sha256:2bc6924d954a6efefde0a9629228914acf72e4abcdb927b68f19edd1135a0cb1 AS build
ARG SERVICE
WORKDIR /workspace
COPY . .
# Build only the selected module + its reactor deps (-pl <svc> -am). This isolates each
# service image from unrelated sibling modules (a break in one module no longer fails
# every image build) and is far faster than compiling all 22 modules per image.
RUN test -n "$SERVICE" || (echo "ERROR: --build-arg SERVICE=<module> is required" >&2; exit 1)
# BuildKit cache mount for ~/.m2: without this, EVERY one of the 22 per-service image builds
# independently re-downloads the full dependency tree from Maven Central from a cold, empty
# repo — 22x the network calls for what is mostly the same shared parent-POM dependency set,
# which made this reactor's builds highly susceptible to transient Central flakiness (connection
# resets, truncated bodies) since any single dropped download fails the whole build. The cache
# mount persists across builds (keyed, shared+locked for concurrent-safe access) so only the
# first build populates it and everything after reuses it.
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn -B -ntp -DskipTests -pl "$SERVICE" -am clean package

# ---- Runtime stage ----
FROM eclipse-temurin:25-jre@sha256:15090d159279e5c158473eccb48cd87f57b3e3a47511a797eb5a7a7ea6f86b0f

# Apply the Ubuntu security patch for OpenSSL in-place. The pinned base still ships
# openssl/libssl3t64 3.5.5-1ubuntu3 (CVE-2026-45447 HIGH: heap use-after-free in PKCS7_verify);
# 3.5.5-1ubuntu3.2 fixes it. Upstream eclipse-temurin:17-jre had not yet republished a digest with
# the patched package, so --only-upgrade pulls it from the Ubuntu archive without adding any new
# packages. SERVICE-independent (placed before ARG SERVICE) so the layer is reused across builds.
RUN apt-get update \
 && apt-get install -y --no-install-recommends --only-upgrade openssl libssl3t64 openssl-provider-legacy \
 && rm -rf /var/lib/apt/lists/*

ARG SERVICE
ENV SERVICE=${SERVICE}
WORKDIR /app
COPY --from=build /workspace/${SERVICE}/target/${SERVICE}-*.jar /app/app.jar

# Drop the unused Canonical 'pebble' service-manager binary that the Ubuntu-based eclipse-temurin
# image ships in /usr/bin — it is never executed (the entrypoint runs java directly) but its
# bundled Go stdlib trips the image vuln scan. Removing it is a genuine attack-surface reduction.
RUN rm -f /usr/bin/pebble

# Run as a non-root user (UID/GID match the k8s securityContext.runAsUser/runAsGroup).
# The jar is world-readable and the JVM only writes to /tmp, so no chown is required.
RUN groupadd -g 10001 app && useradd -u 10001 -g app -M -s /usr/sbin/nologin app
USER app

# Container-friendly JVM defaults; override JAVA_OPTS as needed.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
EXPOSE 3014 3015 3016 3017 3018 3019 3020 3024 3035 3036 3037 3038 3039
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
