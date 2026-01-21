FROM ubuntu:24.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system packages
RUN apt-get update && apt-get install -y \
    git \
    ripgrep \
    fd-find \
    jq \
    curl \
    unzip \
    nodejs \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash clorb && \
    echo "clorb ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER clorb
WORKDIR /home/clorb

# Install Bun as non-root user
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/home/clorb/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Install Claude Code
RUN bun install -g @anthropic-ai/claude-code

WORKDIR /workspace

ENTRYPOINT ["claude"]
