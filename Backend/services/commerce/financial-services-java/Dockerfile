# Multi-stage build for any financial service in the reactor.
# Usage: docker build --build-arg SERVICE=payment-service -t baalvion/payment-service .
#
# The builder compiles the whole Maven reactor once (so the common-security library and
# all modules resolve), then the runtime image copies only the selected service jar.

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -B -q -DskipTests clean package

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
ARG SERVICE
ENV SERVICE=${SERVICE}
WORKDIR /app
COPY --from=build /workspace/${SERVICE}/target/${SERVICE}-*.jar /app/app.jar

# Container-friendly JVM defaults; override JAVA_OPTS as needed.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
EXPOSE 3014 3015 3016 3017 3018 3019 3020 3024 3025
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
