#!/bin/bash
# TTY/PTY handling for docker run
set -e

DOCKER_ARGS=(
    -it --rm
    -v "$CLORB_TARGET_PATH:/$CLORB_DIR_NAME"
    -v "clorb-claude-config:/home/clorb/.claude"
    -v "$HOME/.gitconfig:/tmp/.gitconfig-host:ro"
    -w "/$CLORB_DIR_NAME"
)

if [[ -n "$GH_TOKEN" ]]; then
    DOCKER_ARGS+=(-e "GH_TOKEN=$GH_TOKEN")
fi

exec docker run "${DOCKER_ARGS[@]}" "$CLORB_IMAGE_NAME" --dangerously-skip-permissions
