# clorb Design

Run Claude Code in dangerous mode inside an isolated OrbStack VM.

## Goal

Execute `claude --dangerously-skip-permissions` with a safety net. Files are shared bidirectionally so edits appear on Mac instantly, but destructive commands are contained to the disposable VM.

## Usage

```bash
clorb ~/projects/my-app    # Specific path
clorb .                    # Current directory
```

First run auto-creates and provisions the VM. Subsequent runs start in ~2 seconds.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  macOS                                                      │
│                                                             │
│   ~/code/clorb/                                             │
│   ├── bin/clorb         (the actual script)                 │
│   └── cloud-init.yaml   (VM provisioning config)            │
│                                                             │
│   ~/bin/clorb → ~/code/clorb/bin/clorb  (symlink)           │
│                                                             │
│   ~/.claude/ ←──────────────────┐                           │
│   ~/projects/my-app ←───────────┼───┐                       │
│                                 │   │                       │
│   ┌─────────────────────────────┼───┼─────────────────────┐ │
│   │  OrbStack VM (claude-agent) │   │                     │ │
│   │                             ▼   ▼                     │ │
│   │   ~/.claude/              (mounted from Mac)          │ │
│   │   /mnt/mac/Users/...      (mounted from Mac)          │ │
│   │                                                       │ │
│   │   Claude Code runs in --dangerously-skip-permissions  │ │
│   │                                                       │ │
│   └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Script Flow

`bin/clorb`:

1. Check if VM exists - if not, create with `orb create ubuntu:noble claude-agent --user-data cloud-init.yaml`
2. Check if VM is running - if not, start with `orb start claude-agent`
3. Resolve path argument to absolute path, convert to VM path (`/mnt/mac/...`)
4. Mount Mac's `~/.claude` into VM's home directory
5. Run `claude --dangerously-skip-permissions` in the target directory

## VM Provisioning

`cloud-init.yaml`:

```yaml
#cloud-config
package_update: true
packages:
  - docker.io
  - git
  - lazygit
  - ripgrep
  - fd-find
  - jq
  - curl
  - unzip

runcmd:
  - curl -fsSL https://bun.sh/install | bash
  - /root/.bun/bin/bun install -g @anthropic-ai/claude-code
  - usermod -aG docker $(getent passwd 1000 | cut -d: -f1)
```

## Mounts

| Mac | VM |
|-----|-----|
| `~/.claude` | `~/.claude` (credentials + session state) |
| `/Users/you/...` | `/mnt/mac/Users/you/...` (automatic via OrbStack) |

## Recovery

If something goes wrong, nuke and recreate:

```bash
orb delete claude-agent
clorb .  # Recreates fresh
```
