# AI エージェント統合ガイド

taskos をプロジェクトに導入したあと、各 AI エージェントに taskos の存在と使い方を伝える方法をまとめます。

---

## Claude Code

プロジェクトルートの `CLAUDE.md` に以下を追記します。Claude Code は起動時にこのファイルを自動で読み込みます。

```markdown
## タスク管理

このプロジェクトは taskos でタスクを管理しています。

### 作業開始前
\`\`\`bash
taskos list --status todo --json          # 未着手タスクを確認
taskos show <id> --aggregate             # 担当タスクの詳細を取得
taskos update <id> --status in-progress  # 作業開始を宣言
\`\`\`

### 作業中
\`\`\`bash
taskos link <id> <filepath> --message "..." # 作成・編集したファイルを記録
\`\`\`

### 完了時
\`\`\`bash
taskos done <id>
\`\`\`

`taskos show <id> --aggregate` が返す JSON に、タスクの概要・受け入れ条件・依存関係・直近ログが含まれます。
詳細な仕様は `aggregate.markdown_file` のパスにある Markdown を読んでください。
```

---

## Codex（OpenAI Codex CLI）

`codex exec` に渡すプロンプトの先頭、または `--instructions` ファイルに以下を含めます。

```
## Task Management

This project uses taskos to track tasks. Before starting any work:

1. Run: taskos list --status todo --json
2. Pick a task and run: taskos update <id> --status in-progress
3. Get full context: taskos show <id> --aggregate
4. As you create or modify files, run: taskos link <id> <filepath> --message "<what you did>"
5. When complete: taskos done <id>

The --aggregate flag returns a JSON object with title, summary, acceptance_criteria,
dependencies, references, recent_logs, and markdown_file. Read markdown_file for
full human-authored specs.
```

---

## 共通：プロジェクトへの組み込み手順

1. **taskos を初期化**
   ```bash
   taskos init
   ```

2. **タスクを作成**（人間が行う）
   ```bash
   taskos add "実装するタスク名" --summary "概要" --priority high --criteria "完了条件"
   ```

3. **エージェントに渡すコンテキストを用意**
   - Claude Code: `CLAUDE.md` に上記スニペットを追記
   - Codex: プロンプトまたは instructions ファイルに上記スニペットを追記

4. **エージェントを起動**
   - エージェントは `taskos list` で未着手タスクを発見し、`taskos show --aggregate` でコンテキストを取得して作業を開始します

---

## `--aggregate` JSON の読み方

```json
{
  "id": "abc12345",
  "title": "タスク名",
  "summary": "一言概要",
  "status": "todo",
  "priority": "high",
  "acceptance_criteria": "完了条件",
  "dependencies": ["依存タスクID"],
  "references": ["関連ファイルパス"],
  "recent_logs": [
    { "message": "作業ログ", "filepath": "src/foo.ts", "created_at": "..." }
  ],
  "notes": "補足",
  "markdown_file": ".taskos/tasks/abc12345.md"
}
```

- `acceptance_criteria` — これを満たせばタスク完了
- `references` — 関連ファイル。読むべきコンテキストの手がかり
- `recent_logs` — 直近の作業履歴。重複作業を避けるために確認する
- `markdown_file` — 長文仕様書のパス。必要に応じて読む

コンテキスト消費を抑えるため、まず `--aggregate` だけを読み、必要なときだけ `markdown_file` を開くのが推奨パターンです。
