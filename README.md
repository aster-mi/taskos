# taskos

AI-first ローカルタスク管理ハブ。SQLite ベースの軽量 CLI で、人間と AI エージェント（Claude Code、Codex）が共同でタスクを管理できます。

## 必要環境

- Node.js >= 22.5.0

## インストール

```bash
git clone https://github.com/aster-mi/taskos
cd taskos
npm install && npm run build
npm link
```

## クイックスタート

```bash
cd /your/project
taskos init
taskos add "認証を実装する" --priority high
taskos list
```

### Web UI

```bash
taskos serve          # http://localhost:3000 で起動
taskos serve --open   # ブラウザも同時に開く
taskos serve --port 8080   # ポート指定
taskos serve --force  # 既存プロセスを kill して再起動
```

## コマンド

| コマンド | 説明 |
|---------|------|
| `taskos init` | 初期化（DB・ディレクトリ作成）|
| `taskos add <title>` | タスク作成 |
| `taskos list` | 一覧表示 |
| `taskos show <id>` | 詳細表示（`--aggregate` で AI 向け JSON）|
| `taskos update <id>` | フィールド・ステータス更新 |
| `taskos done <id>` | 完了にする |
| `taskos link <id> <file>` | ファイルを紐付け |
| `taskos serve` | Web UI を起動（`--port`, `--open`）|

詳細は [docs/cli.md](docs/cli.md) を参照してください。

## AI エージェントとの連携

`taskos show <id> --aggregate` で AI 向けの Aggregate JSON を取得できます。

- エージェントが実行時に参照する操作仕様 → [AGENT.md](AGENT.md)
- Claude Code・Codex への組み込み手順 → [docs/agent-integration.md](docs/agent-integration.md)

## 開発・アップデート

[docs/development.md](docs/development.md) を参照してください。
