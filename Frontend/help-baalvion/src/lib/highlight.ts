const KEYWORDS: Record<string, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'async', 'await', 'import', 'from',
    'export', 'default', 'class', 'new', 'try', 'catch', 'throw', 'typeof', 'of', 'in', 'for',
    'while', 'switch', 'case', 'break', 'continue', 'extends', 'static', 'this', 'null', 'true',
    'false', 'undefined',
  ],
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'async', 'await', 'import', 'from',
    'export', 'default', 'class', 'new', 'try', 'catch', 'throw', 'typeof', 'of', 'in', 'for',
    'while', 'interface', 'type', 'implements', 'public', 'private', 'readonly', 'enum', 'null',
    'true', 'false', 'undefined',
  ],
  python: [
    'def', 'return', 'if', 'elif', 'else', 'import', 'from', 'as', 'class', 'try', 'except',
    'finally', 'raise', 'with', 'for', 'while', 'in', 'is', 'not', 'and', 'or', 'None', 'True',
    'False', 'async', 'await', 'lambda',
  ],
  bash: ['curl', 'if', 'then', 'fi', 'for', 'do', 'done', 'export', 'echo'],
  json: [],
  http: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HTTP/1.1'],
};

function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Minimal, dependency-free syntax highlighter. It is not a full tokenizer —
 * just enough visual structure (comments/strings/numbers/keywords) for
 * documentation code samples, without pulling in a heavy build-time toolchain.
 */
export function highlight(code: string, lang: string): string {
  const keywords = KEYWORDS[lang] ?? [];
  const escaped = escapeHtml(code);
  const keywordAlternation = keywords.length ? keywords.map(escapeRegExp).join('|') : '(?!)';

  const master = new RegExp(
    [
      '(?<comment>\\/\\/[^\\n]*|#[^\\n]*)',
      '(?<string>"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)',
      '(?<number>\\b\\d+(?:\\.\\d+)?\\b)',
      `(?<keyword>\\b(?:${keywordAlternation})\\b)`,
    ].join('|'),
    'g',
  );

  return escaped.replace(master, (match: string, ...args: unknown[]) => {
    const groups = args[args.length - 1] as Record<string, string | undefined>;
    if (groups?.comment) return `<span class="tok-comment">${groups.comment}</span>`;
    if (groups?.string) return `<span class="tok-string">${groups.string}</span>`;
    if (groups?.number) return `<span class="tok-number">${groups.number}</span>`;
    if (groups?.keyword) return `<span class="tok-keyword">${groups.keyword}</span>`;
    return match;
  });
}
