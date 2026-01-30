# clorb

Run Claude Code in a sandboxed Docker container with `--dangerously-skip-permissions`, using git worktrees for branch isolation.

## Why

Claude Code's dangerous mode skips all permission prompts, letting it work autonomously. But running it directly on your machine means a bad prompt could delete files or run harmful commands.

clorb solves this by:
1. **Git worktree isolation** - Each session runs in its own worktree, so your main working directory stays clean
2. **Docker containment** - Claude runs in a disposable container, so destructive commands can't escape
3. **Seamless sync** - Edits sync instantly back to the host via bind mounts

## Setup

1. Install [OrbStack](https://orbstack.dev) (lightweight Docker for macOS)
2. Clone this repo and symlink the script:

```bash
git clone https://github.com/yourusername/clorb.git ~/code/clorb
ln -s ~/code/clorb/bin/clorb ~/bin/clorb
```

3. Run it:

```bash
clorb ~/projects/my-app
```

First run builds the Docker image and prompts you to authenticate with Claude.

## Usage

```bash
clorb <path>              # Run Claude in a new worktree (copies current state)
clorb .                   # Run in current directory
clorb --list              # List all worktrees with PR status and age
clorb --clean             # Interactively delete old worktrees
clorb --no-gh             # Run without GitHub CLI authentication
clorb --rebuild           # Rebuild the Docker image
```

## Flow

When you run `clorb <path>`:

1. **Worktree creation** - Creates a git worktree at `~/.clorb/worktrees/<project>/<branch>` with your current changes
2. **Branch naming** - Auto-generates branch like `clorb/feature-jan-26-1430` or prompts for a custom name
3. **Docker launch** - Starts container with the worktree mounted
4. **Claude session** - Runs Claude Code with dangerous mode enabled
5. **Cleanup** - Container is destroyed; worktree persists for review

Three ways to start:
- **From current state** (default) - Copies your branch + uncommitted changes to a new worktree
- **From existing branch** - Check out a clean branch (reuses existing worktree if present)
- **Fresh from main** - Start a new branch from `origin/main`, optionally create a draft PR

## How it works

```
┌─────────────────────────────────────────────────────┐
│ macOS Host                                          │
│                                                     │
│  ~/projects/my-app/          (original repo)        │
│                                                     │
│  ~/.clorb/worktrees/my-app/                         │
│  └─ clorb-feature-jan-26/  ◄──────┐                 │
│                                   │                 │
│  ┌────────────────────────────────┼───────────────┐ │
│  │ Docker container               │ bind mounts   │ │
│  │                                ▼               │ │
│  │  (worktree at same host path)                  │ │
│  │  (original .git at same host path)             │ │
│  │  /home/clorb/.claude (volume)                  │ │
│  │                                                │ │
│  │  Claude Code --dangerously-skip-permissions    │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Mounts

| Mount | Type | Purpose |
|-------|------|---------|
| Worktree path | bind (rw) | Your isolated working directory - edits sync both ways |
| Original repo `.git` | bind (rw) | Git metadata for worktree operations |
| Claude config | volume | Persistent authentication and session state |
| Claude skills | bind (ro) | Your `~/.claude/skills/` available inside the container |
| Git config | bind (ro) | Your `.gitconfig` for commits |

The worktree and `.git` mounts use identical host/container paths so git references resolve correctly.

## Managing worktrees

```bash
# List all worktrees with status
clorb --list

# Output shows:
#   feature-branch    2d ago  PR #42 (open)    3 uncommitted
#   clorb-jan-26      5d ago  PR #38 (merged)
#   experiment        12d ago                   1 uncommitted

# Clean up old worktrees (interactive)
clorb --clean
```

The `--clean` command moves deleted worktrees to trash rather than permanently deleting them.

## Resetting

```bash
# Rebuild image (after Dockerfile changes)
clorb --rebuild

# Reset Claude config (re-run setup)
docker volume rm clorb-claude-config
```
