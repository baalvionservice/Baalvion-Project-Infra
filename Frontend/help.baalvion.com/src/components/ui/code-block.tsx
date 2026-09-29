import { highlight } from '@/lib/highlight';
import { CopyButton } from '@/components/ui/copy-button';

interface CodeBlockProps {
  code: string;
  language?: 'javascript' | 'typescript' | 'python' | 'bash' | 'json' | 'http';
  filename?: string;
}

export function CodeBlock({ code, language = 'bash', filename }: CodeBlockProps) {
  const trimmed = code.replace(/\n$/, '');
  const html = highlight(trimmed, language);

  return (
    <div className="not-prose group relative my-5 overflow-hidden rounded-xl border border-line bg-code">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-xs text-muted-2">{filename ?? language}</span>
        <CopyButton text={trimmed} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
