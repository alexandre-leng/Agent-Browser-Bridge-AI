export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS = {
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[34m',
  reset: '\x1b[0m',
};

const JSON_LOGS = process.env.BRIDGE_LOG_JSON === '1';
const MIN_LEVEL = (process.env.BRIDGE_LOG_LEVEL ?? 'info') as LogLevel;
const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// stdout by default; stdio transports (MCP) must keep stdout for protocol data.
let out: NodeJS.WritableStream = process.env.BRIDGE_LOG_STDERR === '1' ? process.stderr : process.stdout;

export function setLogStream(stream: 'stdout' | 'stderr') {
  out = stream === 'stderr' ? process.stderr : process.stdout;
}

export function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;
  const timestamp = new Date().toISOString();
  const entry = { t: timestamp, level, msg, ...(meta ?? {}) };

  if (JSON_LOGS) {
    out.write(JSON.stringify(entry) + '\n');
    return;
  }
  const color = COLORS[level] || COLORS.reset;
  const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  out.write(`${color}[${timestamp}] ${level.toUpperCase()}: ${msg}${metaStr}${COLORS.reset}\n`);
}
