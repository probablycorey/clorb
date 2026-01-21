# clorb

Run Claude Code in a sandboxed Docker container with `--dangerously-skip-permissions`.

## Why

Claude Code's dangerous mode skips all permission prompts, letting it work autonomously. But running it directly on your machine means a bad prompt could delete files or run harmful commands.

clorb solves this by running Claude in a Docker container. Your project is mounted read-write so edits sync instantly, but destructive commands are contained to the disposable container.

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
clorb <path>       # Run Claude in the given directory
clorb .            # Run Claude in current directory
clorb --rebuild    # Rebuild the Docker image
```

## How it works

```
┌─────────────────────────────────────────────────────┐
│ macOS                                               │
│                                                     │
│  ~/projects/my-app ◄──────┐                         │
│                           │ bind mount              │
│  ┌────────────────────────┼───────────────────────┐ │
│  │ Docker container       │                       │ │
│  │                        ▼                       │ │
│  │  /workspace (your project files)               │ │
│  │  /home/clorb/.claude (persistent config)       │ │
│  │                                                │ │
│  │  Claude Code runs with --dangerously-skip-permissions
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Project files**: Mounted at `/workspace`, changes sync both ways
- **Claude config**: Stored in a Docker volume, persists across runs
- **Container**: Disposable, destroyed after each session

## Resetting

```bash
# Rebuild image (after Dockerfile changes)
clorb --rebuild

# Reset Claude config (re-run setup)
docker volume rm clorb-claude-config
```
