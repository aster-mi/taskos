import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';
import { getDefaultDbPath, getDb } from '../db/index.js';
import { ensureTaskosDirs, getTaskosDir } from '../paths.js';

function taskosRepoDir(): string {
  // dist/cli.js → repo root (one level up)
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function writeAgentMd(taskosDir: string): void {
  const repoDir = taskosRepoDir();
  const agentMdPath = path.join(taskosDir, 'AGENT.md');

  const content = `# taskos — AI エージェント操作ガイド

このファイルは \`taskos init\` で自動生成されました。
AI エージェントはこのファイルを参照してタスク管理を行ってください。

## taskos の場所

- **リポジトリ**: \`${repoDir}\`
- **更新方法**: \`cd ${repoDir} && git pull && npm run build\`

## 基本フロー

\`\`\`bash
taskos list --status todo --json          # 未着手タスクを確認
taskos show <id> --aggregate             # タスクの詳細を取得
taskos update <id> --status in-progress  # 作業開始を宣言
taskos link <id> <filepath> --message "..." # ファイルを記録
taskos done <id>                         # 完了
\`\`\`

## コマンドリファレンス

| コマンド | 説明 |
|---------|------|
| \`taskos list --json\` | 全タスク一覧 |
| \`taskos list --status <s>\` | ステータスで絞り込み |
| \`taskos list --tag <tag>\` | タグで絞り込み |
| \`taskos list --since <date>\` | 指定日以降に更新されたタスク |
| \`taskos show <id> --aggregate\` | AI 向け Aggregate JSON |
| \`taskos update <id> --status <s>\` | ステータス更新 |
| \`taskos update <id> --tag <tags>\` | タグを設定（カンマ区切り）|
| \`taskos done <id>\` | 完了にする |
| \`taskos delete <id>\` | タスクを削除 |
| \`taskos link <id> <filepath>\` | ファイルを紐付け・ログ記録 |
| \`taskos history --status done --since <date>\` | 完了履歴 |

## Aggregate JSON の主要フィールド

| フィールド | 用途 |
|-----------|------|
| \`acceptance_criteria\` | これを満たせば完了 |
| \`dependencies\` | 先に完了すべきタスク ID |
| \`references\` | 関連ファイルパス |
| \`tags\` | タスクの分類ラベル |
| \`recent_logs\` | 直近の作業履歴 |
| \`markdown_file\` | 長文仕様書のパス（必要時のみ読む）|

## エラー対処

| メッセージ | 対処 |
|-----------|------|
| \`Run taskos init first\` | \`taskos init\` を実行 |
| \`Task not found: <id>\` | \`taskos list\` で ID を確認 |
| \`requires --force\` | ステータス遷移ルール違反。人間に確認 |
`;

  fs.writeFileSync(agentMdPath, content, 'utf8');
}

function updateGitignore(cwd = process.cwd()): void {
  const gitignorePath = path.join(cwd, '.gitignore');
  const entry = '.taskos/taskos.db';

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `${entry}\n`, 'utf8');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.includes(entry)) {
    const next = content.endsWith('\n') || content.length === 0 ? `${content}${entry}\n` : `${content}\n${entry}\n`;
    fs.writeFileSync(gitignorePath, next, 'utf8');
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize taskos in the current directory')
    .action(() => {
      ensureTaskosDirs();
      const dbPath = getDefaultDbPath();
      getDb(dbPath);
      updateGitignore();
      writeAgentMd(getTaskosDir());
      console.log(`Initialized taskos in ${getTaskosDir()}`);
    });
}
