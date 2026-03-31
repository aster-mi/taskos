# taskos

AI-first ローカルタスク管理ハブ。SQLite ベースの軽量 CLI で、人間と AI エージェント（Claude Code、Codex）が共同でタスクを管理できます。

## 必要環境

- Node.js >= 22.5.0（組み込みの `node:sqlite` を使用）

## インストール

```bash
git clone https://github.com/aster-mi/taskos
cd taskos
npm install
npm run build

# エイリアス設定（任意）
alias taskos="node --experimental-sqlite $(pwd)/dist/cli.js"
```

直接実行する場合：
```bash
node --experimental-sqlite /path/to/taskos/dist/cli.js <command>
```

## クイックスタート

```bash
# 1. プロジェクトで初期化
cd /your/project
taskos init

# 2. タスクを追加
taskos add "認証を実装する" --summary "JWT認証" --priority high --criteria "全エンドポイントが保護されていること"

# 3. Web UI を開く
taskos serve --open

# 4. または CLI で操作
taskos list
taskos update <id> --status in-progress
taskos done <id>
```

## コマンド

### `taskos init`
カレントディレクトリに taskos を初期化します。`.taskos/` ディレクトリ（SQLite DB・タスク Markdown）を作成し、`.gitignore` に DB パスを追加します。

```bash
taskos init
```

### `taskos add <title>`
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

### `taskos list`
タスク一覧を表示します。

```bash
taskos list                        # 全タスク
taskos list --status in-progress   # ステータスで絞り込み
taskos list --priority high        # 優先度で絞り込み
taskos list --json                 # JSON 出力
```

**ステータス値:** `todo` | `in-progress` | `done` | `blocked` | `cancelled`

### `taskos show <id>`
タスクの詳細を表示します。

```bash
taskos show abc12345              # 人間向け表示
taskos show abc12345 --json       # タスク JSON
taskos show abc12345 --aggregate  # AI 向け Aggregate JSON
```

### `taskos update <id>`
タスクのフィールドを更新します。

```bash
taskos update abc12345 --status in-progress
taskos update abc12345 --title "新しいタイトル" --priority urgent
taskos update abc12345 --deps "xyz11111,xyz22222"
```

**ステータス遷移ルール:**
- `done` → `todo`: `--force` なしは不可
- `cancelled` → 任意: `--force` なしは不可

```bash
taskos update abc12345 --status todo --force  # 強制上書き
```

### `taskos done <id>`
タスクを完了にするショートカットです。

```bash
taskos done abc12345
```

### `taskos serve`
ローカル Web サーバーを起動します。

```bash
taskos serve                  # http://localhost:3000
taskos serve --port 8080      # ポート指定
taskos serve --open           # ブラウザを自動で開く
```

**Web UI の機能:**
- ステータスフィルタータブ（全て / Todo / In Progress / Done / Blocked / Cancelled）
- 優先度バッジ（urgent / high / medium / low）
- タスク詳細とアクションボタン（Start / Done / Block）
- タスク新規作成フォーム
- 参照ファイルと実行ログの表示

> Web UI は**人間専用**です。AI エージェントは引き続き CLI（`taskos show --aggregate`）を使用してください。

### `taskos link <id> <filepath>`
ファイルをタスクに紐付けます。references に追加し、ログを記録します。

```bash
taskos link abc12345 src/auth.ts --message "JWT ハンドラーを実装"
```

## データ管理

```
.taskos/
├── taskos.db          # SQLite（gitignore 済み）
└── tasks/
    ├── abc12345.md    # タスク Markdown（Git 管理）
    └── def67890.md
```

- **DB**: 最小限の構造化データ（id・ステータス・優先度など）
- **Markdown ファイル**: 人間が読める詳細情報。Git で管理
- **長文コンテンツ**（仕様書・設計資料・ログ）: `taskos link` で紐付け

## 環境変数

| 変数 | 説明 |
|------|------|
| `TASKOS_DB` | DB パスを上書き（テスト・マルチプロジェクト用）|

## 開発

```bash
npm run dev          # CLI を tsx で直接実行（ビルド不要）
npm run build        # フロントエンド（Vite）+ CLI（tsup）をビルド
npm test             # テスト実行
npm run coverage     # カバレッジレポート
npm run typecheck    # TypeScript 型チェック
npm run lint         # ESLint
npm run ci           # typecheck + lint + test + build（CI 全体）
```

### フロントエンド開発

```bash
# バックエンドとフロントエンドを別々に起動
taskos serve          # API サーバー（port 3000）
cd web && npm run dev # Vite dev server（port 5173、API はプロキシ）
```
