# ─────────────────────────────────────────────────────────────────────────────
# app-payments — financial-services-java (JVM). Bounded context: commerce/finance.
# The only non-Node deployable. Multi-module Maven reactor; we build it and run the
# payment service module, heap-capped for the shared host. DB points at RDS (TLS on).
#
# Build (from REPO ROOT):
#   docker build -f deploy/consolidated/Dockerfile.java -t baalvion-payments:local .
#
# OPERATOR: confirm the runnable module/jar path below (APP_JAR). If your core-stack
# pipeline already builds a proven payment-service image, prefer reusing that tag here
# instead of this template.
# ─────────────────────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY Backend/services/commerce/financial-services-java/ ./
RUN mvn -q -DskipTests clean package

FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app
# Adjust to the actual payment module artifact if it differs.
COPY --from=build /src/payment-service/target/*.jar /app/app.jar
# Hard heap cap keeps the JVM inside its 768m container budget on the shared box.
ENV JAVA_OPTS="-Xms128m -Xmx512m -XX:+UseSerialGC -XX:MaxRAMPercentage=70"
EXPOSE 3015
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]
