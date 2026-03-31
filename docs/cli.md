# CLI リファレンス

## taskos init

カレントディレクトリに taskos を初期化します。`.taskos/` ディレクトリと SQLite DB を作成し、`.gitignore` に DB パスを追加します。

```bash
taskos init
```

---

## taskos add \<title\>

タスクを作成します。`.taskos/tasks/<id>.md` も同時に生成されます。

```bash
taskos add "ログインバグを修正" \
  --summary "Google OAuth でログインできない" \
  --priority high \
  --criteria "ログインフローがエンドツーエンドで動作すること" \
  --deps abc12345,def67890 \
  --notes "再現手順: シークレットモードで試す"
```

| オプション | 短縮 | 説明 |
|-----------|------|------|
| `--summary <text>` | `-s` | 短い概要 |
| `--priority <level>` | `-p` | `low` \| `medium` \| `high` \| `urgent`（デフォルト: `medium`）|
| `--criteria <text>` | `-c` | 受け入れ条件 |
| `--deps <ids>` | `-d` | 依存タスク ID（カンマ区切り）|
| `--notes <text>` | `-n` | メモ |

---

## taskos list

```bash
taskos list                        # 全タスク
taskos list --status in-progress   # ステータスで絞り込み
taskos list --priority high        # 優先度で絞り込み
taskos list --json                 # JSON 出力
```

**ステータス値:** `todo` | `in-progress` | `done` | `blocked` | `cancelled`

---

## taskos show \<id\>

```bash
taskos show <id>              # 人間向け表示
taskos show <id> --json       # タスク JSON
taskos show <id> --aggregate  # AI 向け Aggregate JSON
```

---

## taskos update \<id\>

```bash
taskos update <id> --status in-progress
taskos update <id> --title "新しいタイトル" --priority urgent
taskos update <id> --deps "xyz11111,xyz22222"
```

**ステータス遷移ルール:**
- `done` → `todo`: `--force` なしは不可
- `cancelled` → 任意: `--force` なしは不可

---

## taskos done \<id\>

`--status done` のショートカット。

```bash
taskos done <id>
```

---

## taskos serve

ローカル Web サーバーを起動します（人間向け UI）。

```bash
taskos serve                  # http://localhost:3000
taskos serve --port 8080      # ポート指定
taskos serve --open           # ブラウザを自動で開く
```

---

## taskos link \<id\> \<filepath\>

ファイルをタスクに紐付けます。references に追加し、ログを記録します。

```bash
taskos link <id> src/auth.ts --message "JWT ハンドラーを実装"
```

---

## 環境変数

| 変数 | 説明 |
|------|------|
| `TASKOS_DB` | DB パスを上書き（テスト・マルチプロジェクト用）|
