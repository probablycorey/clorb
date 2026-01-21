FROM ubuntu:24.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system packages
RUN apt-get update && apt-get install -y \
    git \
    gh \
    ripgrep \
    fd-find \
    jq \
    curl \
    unzip \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash clorb

USER clorb
WORKDIR /home/clorb

ENV CLAUDE_CONFIG_DIR="/home/clorb/.claude"

# Install Bun as non-root user
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/home/clorb/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Install Claude Code
RUN bun install -g @anthropic-ai/claude-code

WORKDIR /workspace

ENTRYPOINT ["claude"]
