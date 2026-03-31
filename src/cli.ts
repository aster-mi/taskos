import { Command } from 'commander';
import { pathToFileURL } from 'node:url';
import { registerInitCommand } from './commands/init.js';
import { registerAddCommand } from './commands/add.js';
import { registerListCommand } from './commands/list.js';
import { registerShowCommand } from './commands/show.js';
import { registerUpdateCommand } from './commands/update.js';
import { registerDoneCommand } from './commands/done.js';
import { registerLinkCommand } from './commands/link.js';

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function createProgram(): Command {
  const program = new Command();
  program.name('taskos').description('AI-first local task management system').version('0.1.0');
  program.exitOverride();

  registerInitCommand(program);
  registerAddCommand(program);
  registerListCommand(program);
  registerShowCommand(program);
  registerUpdateCommand(program);
  registerDoneCommand(program);
  registerLinkCommand(program);

  return program;
}

export async function run(argv = process.argv, exitOnError = true): Promise<number> {
  const program = createProgram();

  try {
    await program.parseAsync(argv);
    return 0;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'commander.helpDisplayed') {
      return 0;
    }
    console.error(formatError(error));
    if (exitOnError) {
      process.exit(1);
    }
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void run();
}
