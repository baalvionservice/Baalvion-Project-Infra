# Multi-stage build for any financial service in the reactor.
# Usage: docker build --build-arg SERVICE=payment-service -t baalvion/payment-service .
#
# The builder compiles ONLY the selected service + its reactor dependencies, then the
# runtime image copies that service jar.

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17@sha256:e8ef73dbd33b69fe497fd96b3bbbd85aff84ac4c564a5784ab02ad941b32c12b AS build
ARG SERVICE
WORKDIR /workspace
COPY . .
# Build only the selected module + its reactor deps (-pl <svc> -am). This isolates each
# service image from unrelated sibling modules (a break in one module no longer fails
# every image build) and is far faster than compiling all 22 modules per image.
RUN test -n "$SERVICE" || (echo "ERROR: --build-arg SERVICE=<module> is required" >&2; exit 1)
RUN mvn -B -ntp -DskipTests -pl "$SERVICE" -am clean package

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre@sha256:8016378253033ebd971c237f6580f108b4afac11a188d3fc3b982497bbe55c65
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
