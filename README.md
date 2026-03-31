# taskos

AI-first local task hub. Lightweight CLI for managing tasks with SQLite, designed for humans and AI agents (Claude Code, Codex) to collaborate.

## Requirements

- Node.js >= 22.5.0 (uses built-in `node:sqlite`)

## Installation

```bash
# Clone and install
git clone <repo>
cd taskos
npm install
npm run build

# Add to PATH (optional)
alias taskos="node --experimental-sqlite $(pwd)/dist/cli.js"
```

Or run directly:
```bash
node --experimental-sqlite /path/to/taskos/dist/cli.js <command>
```

## Quick Start

```bash
# 1. Initialize in your project
cd /your/project
taskos init

# 2. Add a task
taskos add "Implement auth" --summary "JWT-based auth" --priority high --criteria "All endpoints protected"

# 3. List tasks
taskos list

# 4. Update status
taskos update <id> --status in-progress

# 5. Mark done
taskos done <id>
```

## Commands

### `taskos init`
Initialize taskos in the current directory. Creates `.taskos/` with the SQLite DB and task markdown files. Adds `.taskos/taskos.db` to `.gitignore`.

```bash
taskos init
```

### `taskos add <title>`
Create a new task. Also creates `.taskos/tasks/<id>.md`.

```bash
taskos add "Fix login bug" \
  --summary "Users can't log in with Google OAuth" \
  --priority high \
  --criteria "Login flow works end-to-end" \
  --deps abc12345,def67890 \
  --notes "Reproduce: use incognito mode"
```

| Option | Short | Description |
|--------|-------|-------------|
| `--summary <text>` | `-s` | Short summary |
| `--priority <level>` | `-p` | `low` \| `medium` \| `high` \| `urgent` (default: `medium`) |
| `--criteria <text>` | `-c` | Acceptance criteria |
| `--deps <ids>` | `-d` | Comma-separated dependent task IDs |
| `--notes <text>` | `-n` | Additional notes |

### `taskos list`
List tasks in a table.

```bash
taskos list                        # all tasks
taskos list --status in-progress   # filter by status
taskos list --priority high        # filter by priority
taskos list --json                 # JSON output
```

**Status values:** `todo` | `in-progress` | `done` | `blocked` | `cancelled`

### `taskos show <id>`
Show task details.

```bash
taskos show abc12345            # human-readable
taskos show abc12345 --json     # raw task JSON
taskos show abc12345 --aggregate  # AI aggregate JSON (recommended for AI agents)
```

### `taskos update <id>`
Update task fields.

```bash
taskos update abc12345 --status in-progress
taskos update abc12345 --title "New title" --priority urgent
taskos update abc12345 --deps "xyz11111,xyz22222"
```

**Status transition rules:**
- `done` → `todo`: blocked unless `--force`
- `cancelled` → anything: blocked unless `--force`

```bash
taskos update abc12345 --status todo --force  # override
```

### `taskos done <id>`
Shortcut to mark a task as done.

```bash
taskos done abc12345
```

### `taskos link <id> <filepath>`
Link a file to a task. Adds the file to references and appends a log entry.

```bash
taskos link abc12345 src/auth.ts --message "Implemented JWT handler"
```

## Data Storage

```
.taskos/
├── taskos.db          # SQLite (gitignored)
└── tasks/
    ├── abc12345.md    # Task markdown (git-tracked)
    └── def67890.md
```

- **DB**: minimal structured data (id, status, priority, etc.)
- **Markdown files**: human-readable, git-tracked task details
- **Long-form content** (specs, design docs, logs): link via `taskos link`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TASKOS_DB` | Override default DB path (useful for testing) |

## Development

```bash
npm run dev     # run CLI via tsx (no build needed)
npm test        # run tests
npm run build   # build to dist/
```
