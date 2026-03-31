# AI-first Local Task Hub 要件定義（MVP）

## サービス名
taskos

## 目的
- Claude Code / Codex などにタスクを委任・実行・管理できるローカル基盤を構築する
- AIと人間が共存できるタスク管理
- コンテキスト消費を最小化する設計

---

## コアコンセプト
- AI First Interface
- Local First
- Context Minimal
- Human-in-the-loop
- Lightweight
- Easy to integrate into any development project

---

## アーキテクチャ方針
- 内部: 正規化されたRDB（SQLite）
- 外部（AI向け）: Aggregate層（非正規化JSON）
- 更新: CLIコマンド経由のみ（直接DB操作禁止）
- 詳細データ: Markdown/Gitで管理（DBには持たない）

---

## スコープ（MVP）

### やること
- タスク管理（作成・一覧・状態管理）
- AI向けAggregate取得
- CLIによる状態更新
- Markdownベースの詳細管理
- 実行ログ・成果物の紐付け

### やらないこと
- 認証
- SaaS連携
- 複雑な権限管理
- 分散システム

---

## 技術構成
- DB: SQLite
- CLI: Node.js (TypeScript)
- フロント: 任意（後回し）
- ストレージ: ローカルファイル + Git

---

## データ設計方針

### DBに持つもの（最小）
- id
- title
- summary（短文）
- status
- priority
- dependencies
- references（ファイルパス）
- acceptance_criteria（短文）
- created_at / updated_at

### DBに持たないもの
- 長文仕様
- 実行ログ全文
- 設計資料
- 出力成果物