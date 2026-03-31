# AGENT.md — taskos 操作リファレンス

このファイルは AI エージェントが実行時に参照する操作仕様です。
プロジェクトへの組み込み手順（CLAUDE.md の書き方など）は [docs/agent-integration.md](docs/agent-integration.md) を参照してください。

---

## 基本フロー

```bash
# 1. 未着手タスクを確認
taskos list --status todo --json

# 2. タスクの詳細を取得（これだけで作業に必要な情報が揃う）
taskos show <id> --aggregate

# 3. 作業開始を宣言
taskos update <id> --status in-progress

# 4. ファイルを作成・変更したら記録
taskos link <id> <filepath> --message "実装内容の説明"

# 5. 完了
taskos done <id>
```

---

## コマンドリファレンス

| コマンド | 説明 |
|---------|------|
| `taskos list --json` | 全タスク一覧（JSON）|
| `taskos list --status <s> --json` | ステータスで絞り込み |
| `taskos list --priority <p> --json` | 優先度で絞り込み |
| `taskos show <id> --aggregate` | AI 向け Aggregate JSON |
| `taskos update <id> --status <s>` | ステータス更新 |
| `taskos update <id> --notes <text>` | メモを追記 |
| `taskos done <id>` | 完了にする |
| `taskos link <id> <filepath>` | ファイルを紐付け・ログ記録 |

## ステータス値

`todo` → `in-progress` → `done` / `blocked` / `cancelled`

- `done` → `todo` の巻き戻しは `--force` が必要
- タスクは人間が作成するのが原則。サブタスクが必要な場合のみ `taskos add` を使う

## Aggregate JSON の読み方

`taskos show <id> --aggregate` が返す主要フィールド：

| フィールド | 用途 |
|-----------|------|
| `acceptance_criteria` | これを満たせば完了 |
| `dependencies` | 先に完了すべきタスク ID |
| `references` | 関連ファイルパス |
| `recent_logs` | 直近の作業履歴（重複を避けるために確認）|
| `markdown_file` | 長文仕様書のパス（必要なときだけ読む）|

## エラー対処

| メッセージ | 対処 |
|-----------|------|
| `Run taskos init first` | `taskos init` を実行 |
| `Task not found: <id>` | ID を確認、`taskos list` で一覧取得 |
| `requires --force` | ステータス遷移ルール違反。人間に確認を取る |
