# taskos — AI Agent Guide

This document explains how AI agents (Claude Code, Codex, etc.) should use taskos to manage tasks within a project.

## Setup Check

Before using taskos, verify it's initialized:

```bash
node --experimental-sqlite /path/to/taskos/dist/cli.js list
# If you see: "Run taskos init first" → run init first
```

## Core Workflow

### 1. Discover existing tasks

```bash
# List all open tasks
node --experimental-sqlite /path/to/dist/cli.js list --status todo
node --experimental-sqlite /path/to/dist/cli.js list --status in-progress

# Get full details for a specific task (AI-optimized format)
node --experimental-sqlite /path/to/dist/cli.js show <id> --aggregate
```

The `--aggregate` flag returns a compact JSON containing everything needed to work on a task:
```json
{
  "id": "abc12345",
  "title": "...",
  "summary": "...",
  "status": "todo",
  "priority": "high",
  "acceptance_criteria": "...",
  "dependencies": ["other-id"],
  "references": ["src/file.ts"],
  "recent_logs": [
    { "message": "...", "filepath": "src/file.ts", "created_at": "..." }
  ],
  "notes": "...",
  "markdown_file": ".taskos/tasks/abc12345.md"
}
```

Read `markdown_file` for full human-authored context.

### 2. Claim a task before starting

```bash
node --experimental-sqlite /path/to/dist/cli.js update <id> --status in-progress
```

### 3. Link artifacts as you work

When you create or modify files relevant to a task:

```bash
node --experimental-sqlite /path/to/dist/cli.js link <id> src/auth.ts --message "Implemented JWT handler"
node --experimental-sqlite /path/to/dist/cli.js link <id> tests/auth.test.ts --message "Added auth tests"
```

### 4. Complete the task

```bash
node --experimental-sqlite /path/to/dist/cli.js done <id>
```

## Context Minimization

To keep context usage low, prefer `--aggregate` over reading the DB directly.

For listing tasks to decide what to work on:
```bash
# Get all open high-priority tasks as JSON
node --experimental-sqlite /path/to/dist/cli.js list --status todo --priority high --json
```

## Creating Tasks (Human-in-the-loop)

AI agents should generally **not** create tasks unilaterally. Tasks should be created by humans or explicitly instructed. If you need to create a subtask:

```bash
node --experimental-sqlite /path/to/dist/cli.js add "Subtask title" \
  --summary "What and why" \
  --priority medium \
  --criteria "What done looks like" \
  --deps <parent-task-id>
```

## Status Reference

| Status | Meaning |
|--------|---------|
| `todo` | Not started |
| `in-progress` | Being worked on |
| `done` | Completed |
| `blocked` | Blocked by external dependency |
| `cancelled` | Cancelled, no longer needed |

## Path Conventions

The taskos CLI always operates relative to `process.cwd()`. Run commands from the project root where `.taskos/` lives.

DB path can be overridden with `TASKOS_DB` env var for multi-project setups.

## Error Handling

- `"Run taskos init first"` → `.taskos/` not initialized in current directory
- `"Task not found: <id>"` → ID doesn't exist
- `"Changing status from done to todo requires --force"` → Use `--force` to override

## Integration with Claude Code

Add to your project's `CLAUDE.md`:

```markdown
## Task Management

This project uses taskos. Before starting work:
1. Run `taskos list --status todo --json` to see open tasks
2. Pick a task and run `taskos update <id> --status in-progress`
3. Use `taskos show <id> --aggregate` to get full context
4. Link files as you work: `taskos link <id> <filepath>`
5. Run `taskos done <id>` when complete
```
