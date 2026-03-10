export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function currentLevel(): number {
  const env = process.env['LOG_LEVEL']?.toLowerCase() as LogLevel | undefined;
  return LEVELS[env ?? 'info'] ?? 1;
}

function log(level: LogLevel, message: string, data?: unknown): void {
  if (LEVELS[level] < currentLevel()) return;
  const entry = data !== undefined
    ? `[${level.toUpperCase()}] ${message} ${JSON.stringify(data)}`
    : `[${level.toUpperCase()}] ${message}`;
  process.stderr.write(entry + '\n');
}

export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info:  (msg: string, data?: unknown) => log('info',  msg, data),
  warn:  (msg: string, data?: unknown) => log('warn',  msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
};
