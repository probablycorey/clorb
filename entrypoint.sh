#!/bin/bash
set -e

# Copy gitconfig if mounted
if [[ -f /tmp/.gitconfig-host ]]; then
    cp /tmp/.gitconfig-host ~/.gitconfig
fi

# Setup gh credential helper if token is provided
if [[ -n "$GH_TOKEN" ]]; then
    echo "$GH_TOKEN" | gh auth login --with-token 2>/dev/null
    gh auth setup-git 2>/dev/null || true
fi

# Run Claude
exec claude "$@"
