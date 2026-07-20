type LogExtra = Record<string, unknown>;

function format(scope: string, message: string, extra?: LogExtra): string {
  return extra ? `[${scope}] ${message} ${JSON.stringify(extra)}` : `[${scope}] ${message}`;
}

export const logger = {
  warn(scope: string, message: string, extra?: LogExtra): void {
    // eslint-disable-next-line no-console -- deliberate operator diagnostic, not user-facing
    console.warn(format(scope, message, extra));
  },
  error(scope: string, message: string, error?: unknown, extra?: LogExtra): void {
    // eslint-disable-next-line no-console -- deliberate operator diagnostic, not user-facing
    console.error(format(scope, message, extra), error);
  },
};
