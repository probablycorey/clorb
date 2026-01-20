# clorb Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a command that runs Claude Code in dangerous mode inside an isolated OrbStack VM.

**Architecture:** A bash script (`bin/clorb`) that auto-creates/starts an OrbStack VM and launches Claude Code with `--dangerously-skip-permissions`. VM provisioning is handled by cloud-init.

**Tech Stack:** Bash, OrbStack CLI (`orb`), cloud-init

---

### Task 1: Create cloud-init.yaml

**Files:**
- Create: `cloud-init.yaml`

**Step 1: Create the cloud-init config**

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
  # Install Bun
  - curl -fsSL https://bun.sh/install | bash
  # Add bun to path for this script
  - export BUN_INSTALL="/root/.bun"
  - export PATH="$BUN_INSTALL/bin:$PATH"
  # Install Claude Code globally
  - /root/.bun/bin/bun install -g @anthropic-ai/claude-code
  # Add default user to docker group
  - usermod -aG docker $(getent passwd 1000 | cut -d: -f1)
```

**Step 2: Commit**

```bash
git add cloud-init.yaml
git commit -m "feat: add cloud-init config for VM provisioning"
```

---

### Task 2: Create bin/clorb script - VM management

**Files:**
- Create: `bin/clorb`

**Step 1: Create the script with argument handling and VM checks**

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
VM_NAME="claude-agent"
CLOUD_INIT="$REPO_DIR/cloud-init.yaml"

# Require path argument
if [[ -z "$1" ]]; then
    echo "Usage: clorb <path>"
    echo "Example: clorb . | clorb ~/projects/my-app"
    exit 1
fi

# Resolve to absolute path
TARGET_PATH="$(cd "$1" && pwd)"

# Convert to VM path
VM_PATH="/mnt/mac${TARGET_PATH}"

# Check if VM exists
if ! orb list | grep -q "^$VM_NAME "; then
    echo "Creating VM '$VM_NAME'..."
    orb create ubuntu:noble "$VM_NAME" --user-data "$CLOUD_INIT"
    echo "Waiting for cloud-init to complete (this may take a minute)..."
    orb -m "$VM_NAME" cloud-init status --wait
fi

# Check if VM is running
if ! orb list | grep "^$VM_NAME " | grep -q "running"; then
    echo "Starting VM '$VM_NAME'..."
    orb start "$VM_NAME"
fi

echo "VM ready."
```

**Step 2: Make executable**

```bash
chmod +x bin/clorb
```

**Step 3: Test VM creation logic (dry run)**

```bash
# Verify script syntax
bash -n bin/clorb

# Check that it requires an argument
./bin/clorb 2>&1 | grep -q "Usage:" && echo "PASS: Shows usage without args"
```

**Step 4: Commit**

```bash
git add bin/clorb
git commit -m "feat: add clorb script with VM management"
```

---

### Task 3: Add ~/.claude mounting and Claude execution

**Files:**
- Modify: `bin/clorb`

**Step 1: Add the Claude execution logic to the end of the script**

Append after `echo "VM ready."`:

```bash
# Mount ~/.claude from Mac and run Claude
MAC_CLAUDE_DIR="$HOME/.claude"

orb -m "$VM_NAME" bash -c "
    # Ensure ~/.claude exists and is linked to Mac's
    mkdir -p ~/.claude

    # Bind mount Mac's .claude if not already mounted
    if ! mountpoint -q ~/.claude 2>/dev/null; then
        sudo mount --bind /mnt/mac${MAC_CLAUDE_DIR} ~/.claude 2>/dev/null || true
    fi

    # Add bun to PATH
    export BUN_INSTALL=\"\$HOME/.bun\"
    export PATH=\"\$BUN_INSTALL/bin:\$PATH\"

    # Change to project directory and run Claude
    cd '$VM_PATH'
    claude --dangerously-skip-permissions
"
```

**Step 2: Commit**

```bash
git add bin/clorb
git commit -m "feat: add ~/.claude mounting and Claude execution"
```

---

### Task 4: Test full workflow

**Step 1: Delete existing VM if present (clean slate)**

```bash
orb delete claude-agent 2>/dev/null || true
```

**Step 2: Run clorb on current directory**

```bash
./bin/clorb .
```

Expected: VM creates, provisions, and Claude Code starts in dangerous mode.

**Step 3: Verify Claude can see project files**

Inside Claude session, check that `/mnt/mac/...` contains the clorb repo files.

**Step 4: Exit and test restart speed**

Exit Claude, then run again:

```bash
./bin/clorb .
```

Expected: Starts in ~2 seconds (no provisioning).

---

### Task 5: Create symlink

**Step 1: Create symlink in ~/bin**

```bash
mkdir -p ~/bin
ln -sf ~/code/clorb/bin/clorb ~/bin/clorb
```

**Step 2: Verify symlink works**

```bash
cd /tmp
clorb ~/code/clorb
```

Expected: Claude starts in the clorb project directory.

**Step 3: Commit any final changes and tag**

```bash
git add -A
git commit -m "docs: update with final implementation" --allow-empty
git tag v0.1.0
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create cloud-init.yaml for VM provisioning |
| 2 | Create bin/clorb with VM management |
| 3 | Add ~/.claude mounting and Claude execution |
| 4 | Test full workflow |
| 5 | Create symlink |
