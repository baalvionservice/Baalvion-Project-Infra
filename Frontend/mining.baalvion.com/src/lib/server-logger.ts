/**
 * @fileOverview Structured server-side logger for Mining.Baalvion API routes.
 *
 * Emits single-line JSON to process.stdout / stderr so logs are machine-parseable
 * by aggregators (Cloud Logging, Loki, Datadog, etc.). Avoid raw console.log in
 * production server paths — use this logger so every entry is structured and
 * carries a consistent shape (timestamp, level, message, context).
 *
 * PII discipline: callers are responsible for redacting message bodies and other
 * sensitive fields before passing context here. This logger never inspects or
 * mutates the context beyond JSON-serializing it.
 */

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
  };

  let line: string;
  try {
    line = JSON.stringify(entry);
  } catch {
    // Fallback when context contains non-serializable values (e.g. circular refs).
    line = JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      context: { note: "context omitted: not JSON-serializable" },
    });
  }

  const stream = level === "error" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
}

export const serverLogger = {
  info(message: string, context?: LogContext): void {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    write("error", message, context);
  },
};
