# Engineer Flow Real-World Pilot Benchmark - Canonical Host Environment
#
# This image provides the canonical Linux HOST environment for running the
# real-world pilot benchmark tasks. It is NOT part of Engineer Flow itself.
#
# IMPORTANT: This image does NOT contain Python 3.6. The flask-json-datetime-tz
# task requires Python 3.6.15, which is not available on Ubuntu 22.04 (Jammy)
# because deadsnakes PPA only supports Python 3.7+ on Jammy due to OpenSSL 3.
#
# The Python 3.6 legacy task runs in a separate pinned container:
#   python:3.6.15-buster (sha256:08e91f391139ff24d82df572307b30ee850b78884ec633cf10f5a6e990dd9920)
#
# Usage:
#   docker build -t ef-pilot-host benchmarks/real-world/pilot/
#   docker run --rm ef-pilot-host node run-pilot.mjs environment-check

FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install base POSIX shell tools required by frozen task commands
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    coreutils \
    curl \
    findutils \
    gawk \
    grep \
    sed \
    wget \
    git \
    ca-certificates \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install Python 3.8.18 for flask-static-catchall task
# Python 3.8 is available via deadsnakes PPA on Ubuntu 22.04
RUN add-apt-repository -y ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    python3.8 \
    python3.8-venv \
    python3.8-dev \
    && rm -rf /var/lib/apt/lists/* \
    && python3.8 --version

# Install Node.js 20.x (LTS) - satisfies Vue 3.5.x engines requirement: node >=20.0.0
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm 10.31.0 and 11.5.2 (required by frozen Vue task base commits)
# Vue 3.5.30 packageManager: pnpm@10.31.0
# Vue 3.5.38 packageManager: pnpm@11.5.2
# Install each version in a separate directory to keep both available
RUN mkdir -p /opt/pnpm10 /opt/pnpm11 \
    && cd /opt/pnpm10 && npm init -y && npm install pnpm@10.31.0 \
    && cd /opt/pnpm11 && npm init -y && npm install pnpm@11.5.2 \
    && ln -sf /opt/pnpm10/node_modules/.bin/pnpm /usr/local/bin/pnpm10 \
    && ln -sf /opt/pnpm11/node_modules/.bin/pnpm /usr/local/bin/pnpm11 \
    && ln -sf /opt/pnpm10/node_modules/.bin/pnpm /usr/local/bin/pnpm \
    && pnpm10 --version \
    && pnpm11 --version \
    && pnpm --version

# Verify all tool versions
RUN node --version \
    && npm --version \
    && git --version \
    && python3.8 --version \
    && which tail grep sed awk cat head wc cut tr sort uniq tee xargs find diff

# Set working directory for benchmark execution
WORKDIR /benchmark

# Copy only the pilot benchmark files (not Engineer Flow production code)
COPY benchmarks/real-world/pilot/ ./benchmarks/real-world/pilot/

# Default command: run environment check
CMD ["node", "benchmarks/real-world/pilot/run-pilot.mjs", "environment-check"]
