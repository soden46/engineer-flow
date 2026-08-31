#!/bin/sh
# POSIX security gate installer.
# Replicates install-security-gate.ps1 semantics for Linux/macOS.

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <project-path>"
    exit 1
fi

PROJECT="$1"

# Resolve to absolute path safely.
if command -v readlink >/dev/null 2>&1; then
    PROJECT="$(readlink -f "$PROJECT")"
else
    echo "SECURITY_GATE_INSTALLED=NO"
    echo "ERROR=READLINK_UNAVAILABLE"
    exit 1
fi

if [ ! -d "$PROJECT" ]; then
    echo "SECURITY_GATE_INSTALLED=NO"
    echo "ERROR=PROJECT_DIRECTORY_MISSING"
    exit 1
fi

if ! git -C "$PROJECT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "SECURITY_GATE_INSTALLED=NO"
    echo "ERROR=NOT_A_GIT_REPOSITORY"
    exit 1
fi

HOOKS_PATH="$(git -C "$PROJECT" rev-parse --git-path hooks)"

# Normalize absolute hook path if Git returned a relative path.
case "$HOOKS_PATH" in
    /*) ;;
    *)  HOOKS_PATH="$(cd "$PROJECT" && pwd)/$HOOKS_PATH" ;;
esac

mkdir -p "$HOOKS_PATH"

HOOK="$HOOKS_PATH/pre-commit"
BACKUP="$HOOKS_PATH/pre-commit.pre-engineer-flow"

# Backup existing hook only if it is not already an Engineer Flow hook.
if [ -f "$HOOK" ] && ! grep -q "ENGINEER_FLOW_SECURITY_GATE" "$HOOK"; then
    cp -f "$HOOK" "$BACKUP"
fi

# Resolve security-gate.mjs relative to this installer script.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GATE="$SCRIPT_DIR/security-gate.mjs"

# Generate POSIX sh hook content.
cat > "$HOOK" <<HOOK_CONTENT
#!/bin/sh

# ENGINEER_FLOW_SECURITY_GATE

if [ -f "$BACKUP" ]; then
    sh "$BACKUP"
    PREVIOUS_EXIT=\$?

    if [ \$PREVIOUS_EXIT -ne 0 ]; then
        exit \$PREVIOUS_EXIT
    fi
fi

node "$GATE" check --cwd "\$(pwd)"
exit \$?
HOOK_CONTENT

chmod +x "$HOOK" 2>/dev/null || true

echo "SECURITY_GATE_INSTALLED=YES"
echo "PROJECT=$PROJECT"
echo "HOOK=$HOOK"
