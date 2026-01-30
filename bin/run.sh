#!/bin/bash
# TTY/PTY handling for docker run
set -e

# Ensure clipboard directory exists for image sharing
CLIPBOARD_DIR="$HOME/.clorb/clipboard"
mkdir -p "$CLIPBOARD_DIR"

# Mount paths at the same location as on the host so git worktree references work
# The worktree's .git file contains: gitdir: <original>/.git/worktrees/<name>
# So we need both the worktree and the original repo's .git accessible at host paths
DOCKER_ARGS=(
    -it --rm
    -v "$CLORB_WORKTREE_PATH:$CLORB_WORKTREE_PATH"
    -v "$CLORB_ORIGINAL_REPO_PATH/.git:$CLORB_ORIGINAL_REPO_PATH/.git"
    -v "clorb-claude-config:/home/clorb/.claude"
    -v "$HOME/.claude/skills:/home/clorb/.claude/skills:ro"
    -v "$HOME/.gitconfig:/tmp/.gitconfig-host:ro"
    -v "$CLIPBOARD_DIR:$CLIPBOARD_DIR:ro"
    -w "$CLORB_WORKTREE_PATH"
)

if [[ -n "$GH_TOKEN" ]]; then
    DOCKER_ARGS+=(-e "GH_TOKEN=$GH_TOKEN")
fi

exec docker run "${DOCKER_ARGS[@]}" "$CLORB_IMAGE_NAME" --dangerously-skip-permissions
