# AI エージェント統合ガイド

taskos をプロジェクトに導入したあと、各 AI エージェントに taskos の存在と使い方を伝える方法をまとめます。

---

## Claude Code

プロジェクトルートの `CLAUDE.md` に以下を追記します。Claude Code は起動時にこのファイルを自動で読み込みます。

```markdown
## タスク管理

このプロジェクトは taskos でタスクを管理しています。
操作ガイド（taskos のリポジトリパス含む）は `.taskos/AGENT.md` を参照してください。
```

操作の詳細は `taskos init` で生成される `.taskos/AGENT.md` に、taskos リポジトリの実パスとともに記載されています。AI はそこを参照するだけで動作できます。

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
dependencies, references, tags, recent_logs, and markdown_file. Read markdown_file for
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
   taskos add "実装するタスク名" --summary "概要" --priority high --criteria "完了条件" --tag "feature"
   ```

3. **エージェントに渡すコンテキストを用意**
   - Claude Code: `CLAUDE.md` に上記スニペットを追記
   - Codex: プロンプトまたは instructions ファイルに上記スニペットを追記

4. **エージェントを起動**
   - エージェントは `taskos list` で未着手タスクを発見し、`taskos show --aggregate` でコンテキストを取得して作業を開始します

---

## MD・仕様書からタスクを一括追加する

既存の仕様書やREADMEを読ませてタスクを一気に作成させるパターンです。

**Claude Code の場合（CLAUDE.md に追記）:**
```markdown
## タスク一括登録の手順

以下の手順でタスクを登録してください：
1. 指定されたファイルを読む
2. 実装が必要な機能・修正を洗い出す
3. 各項目を `taskos add` で登録する
   - `--summary` に1行の説明
   - `--priority` は重要度で判断（urgent/high/medium/low）
   - `--tag` で分類（例: feature, bug, refactor, infra）
   - `taskos link <id> <filepath>` で関連ファイルを紐付ける
4. 最後に `taskos list` で確認する
```

**Codex へのプロンプト例:**
```
以下のファイルを読んで、必要な開発タスクを taskos で登録してください。

対象ファイル: docs/spec.md, src/api/routes.ts

ルール:
- taskos add "<タスク名>" --summary "<概要>" --priority <優先度> --tag "<タグ>"
- taskos link <id> <filepath> で関連ファイルを紐付ける
- 完了後 taskos list --json で一覧を出力する
```

**ポイント:**
- タグを使うと後で `taskos list --tag feature` のように絞り込める
- 仕様書が複数ある場合はファイルパスを複数渡す
- エージェントにタスクの粒度を指示する（例:「1PRで完結する単位で分割して」）

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
  "tags": ["feature", "frontend"],
  "recent_logs": [
    { "message": "作業ログ", "filepath": "src/foo.ts", "created_at": "..." }
  ],
  "notes": "補足",
  "markdown_file": ".taskos/tasks/abc12345.md"
}
```

- `acceptance_criteria` — これを満たせばタスク完了
- `references` — 関連ファイル。読むべきコンテキストの手がかり
- `tags` — タスクの分類ラベル。`taskos list --tag <tag>` で絞り込み可能
- `recent_logs` — 直近の作業履歴。重複作業を避けるために確認する
- `markdown_file` — 長文仕様書のパス。必要に応じて読む

コンテキスト消費を抑えるため、まず `--aggregate` だけを読み、必要なときだけ `markdown_file` を開くのが推奨パターンです。

---

## 変更履歴の確認

```bash
taskos history --status done --since 2026-04-01   # 今日完了したタスク
taskos history --json                              # 全イベントをJSON で取得
```

`task_events` テーブルにステータス変化が記録されるため、`in-progress` になった時刻と `done` になった時刻の差から所要時間も算出できます。
