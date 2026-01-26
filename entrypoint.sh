#!/bin/bash
set -e

# Copy gitconfig if mounted
if [[ -f /tmp/.gitconfig-host ]]; then
    cp /tmp/.gitconfig-host ~/.gitconfig
fi

# Setup git credential helper if GH_TOKEN is provided
# gh CLI automatically uses GH_TOKEN env var for auth
if [[ -n "$GH_TOKEN" ]]; then
    gh auth setup-git || true
fi

# Run Claude
exec claude "$@"
