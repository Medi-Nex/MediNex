# ==============================================================================
# MEDINEX BACKEND MULTI-STAGE DOCKERFILE
# Language / Runtime: Java 21 (LTS) on Eclipse Temurin Alpine
# Security: Non-root execution, optimized layer caching, minimal attack surface
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Caching and Maven Build
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy Maven wrapper & pom.xml first to take advantage of Docker layer caching
COPY pom.xml .

# Download dependencies offline (cached layer unless pom.xml changes)
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Package production fat jar without running unit tests during container build
# (Tests are executed during CI/CD quality gate pipeline)
RUN mvn clean package -DskipTests -B

# Extract Spring Boot layers for efficient container runtime layering
WORKDIR /build/target
RUN java -Djarmode=layertools -jar *.jar extract

# ------------------------------------------------------------------------------
# Stage 2: Minimal Distroless / Alpine JRE Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

# Install wget for Docker healthcheck
RUN apk add --no-cache wget

# Create non-privileged system group and user
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Copy extracted layers from builder stage
COPY --from=builder /build/target/dependencies/ ./
COPY --from=builder /build/target/spring-boot-loader/ ./
COPY --from=builder /build/target/snapshot-dependencies/ ./
COPY --from=builder /build/target/application/ ./

# Set file ownership to non-root user and prepare persistent uploads folder
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app /app/uploads

# Switch to non-root user
USER appuser:appgroup

# Environment defaults
ENV SPRING_PROFILES_ACTIVE=prod \
    SERVER_PORT=8080 \
    MANAGEMENT_SERVER_PORT=8081 \
    JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Expose primary application and management actuator ports
EXPOSE 8080 8081

# Docker container healthcheck against Spring Boot Actuator
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8081/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
