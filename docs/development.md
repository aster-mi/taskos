# 開発ガイド

## セットアップ

```bash
git clone https://github.com/aster-mi/taskos
cd taskos
npm install
cd web && npm install && cd ..
```

## スクリプト

```bash
npm run dev          # CLI を tsx で直接実行（ビルド不要）
npm run build        # フロントエンド（Vite）+ CLI（tsup）をビルド
npm test             # テスト実行
npm run coverage     # カバレッジレポート
npm run typecheck    # TypeScript 型チェック
npm run lint         # ESLint
npm run ci           # typecheck + lint + test + build（CI 全体）
```

## フロントエンド開発

バックエンドとフロントエンドを別々に起動します。

```bash
taskos serve          # API サーバー（port 3000）
cd web && npm run dev # Vite dev server（port 5173、/api はプロキシ）
```

## データ構造

```
.taskos/
├── taskos.db          # SQLite（gitignore 済み）
└── tasks/
    └── <id>.md        # タスク Markdown（Git 管理）
```

- **DB**: 最小限の構造化データ（id・ステータス・優先度など）
- **Markdown**: 人間が読める詳細。Git で管理
- **長文コンテンツ**（仕様書・設計資料・ログ）: `taskos link` で紐付け

## アーキテクチャ

```
src/
├── cli.ts            # エントリーポイント（Commander）
├── commands/         # 各 CLI コマンド
├── models/task.ts    # Task CRUD（SQLite）
├── aggregate/        # AI 向け Aggregate JSON 生成
├── server/           # Express API（Web UI 用）
└── db/, paths.ts, markdown.ts
web/                  # React + Vite フロントエンド
```

AI エージェントは `src/aggregate/` が生成する Aggregate JSON を通じてタスク情報を取得します。Web UI（`src/server/`）は人間専用で、AI 向けのインターフェースには影響しません。
