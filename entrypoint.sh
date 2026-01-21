#!/bin/bash
set -e

# Copy gitconfig if mounted
if [[ -f /tmp/.gitconfig-host ]]; then
    cp /tmp/.gitconfig-host ~/.gitconfig
fi

# Setup gh credential helper if gh config is available
if [[ -d ~/.config/gh ]] && command -v gh &>/dev/null; then
    gh auth setup-git 2>/dev/null || true
fi

# Run Claude
exec claude "$@"
