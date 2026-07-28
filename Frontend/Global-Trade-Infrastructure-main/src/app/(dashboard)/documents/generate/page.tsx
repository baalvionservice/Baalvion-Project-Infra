'use client';
/**
 * @file (dashboard)/documents/generate/page.tsx
 * @description Document Center — generate one of the 9 registered trade
 * documents from structured data, preview it, and download it. Talks directly
 * to this app's own /api/documents/* route handlers (the template-engine
 * surface), NOT the separate file-upload vault at /documents (which hits a
 * different backend-for-frontend and has no concept of these typed,
 * data-driven documents). The rendered content is only ever returned by the
 * generate call itself — it isn't persisted anywhere yet (see
 * trade-document-service.ts's own doc comment), so preview/download work from
 * this page's in-memory result, not from a re-fetch.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Loader2, AlertCircle, CheckCircle2, Download, Printer, ArrowLeft, FolderLock,
} from 'lucide-react';
import { PATHS } from '@/lib/paths';
import { useToast } from '@/hooks/use-toast';

interface TemplateSummary {
  type: string;
  title: string;
  outputFormats: string[];
}

interface TemplateVariable {
  name: string;
  label?: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  description?: string;
}

interface DocumentTemplateDetail {
  documentType: string;
  variables: TemplateVariable[];
}

interface GeneratedDocumentResult {
  generated: {
    documentType: string;
    documentNumber: string | null;
    format: string;
    content: string;
    hash: string;
    generatedAt: string;
  };
  document: { id: string; version: number; status: string } | null;
}

const JSON_TYPES = new Set(['array', 'object']);

function fieldLabel(v: TemplateVariable): string {
  if (v.label) return v.label;
  return v.name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

/** Parse a single form value into what the engine expects, per variable type. Empty → omitted. */
function coerceValue(v: TemplateVariable, raw: string): { ok: true; value: unknown | undefined } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: undefined };
  switch (v.type) {
    case 'number': {
      const n = Number(trimmed);
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, error: `${fieldLabel(v)} must be a number` };
    }
    case 'array':
    case 'object': {
      try {
        const parsed = JSON.parse(trimmed);
        const isArray = Array.isArray(parsed);
        if (v.type === 'array' && !isArray) return { ok: false, error: `${fieldLabel(v)} must be a JSON array` };
        if (v.type === 'object' && isArray) return { ok: false, error: `${fieldLabel(v)} must be a JSON object` };
        return { ok: true, value: parsed };
      } catch {
        return { ok: false, error: `${fieldLabel(v)} is not valid JSON` };
      }
    }
    default:
      return { ok: true, value: trimmed };
  }
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printContent(content: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(content);
  win.document.close();
  win.onload = () => win.print();
}

export default function DocumentCenterPage() {
  const { toast } = useToast();
  const [catalogue, setCatalogue] = useState<TemplateSummary[] | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [template, setTemplate] = useState<DocumentTemplateDetail | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({});
  const [booleanValues, setBooleanValues] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDocumentResult | null>(null);

  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/documents/templates')
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.success) throw new Error(body.error ?? 'Failed to load document types');
        setCatalogue(body.data as TemplateSummary[]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setCatalogueError(err instanceof Error ? err.message : 'Failed to load document types');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectType(type: string) {
    setSelectedType(type);
    setTemplate(null);
    setValues({});
    setBooleanValues({});
    setFormError(null);
    setResult(null);
    setTemplateLoading(true);
    fetch(`/api/documents/templates/${type}`)
      .then((res) => res.json())
      .then((body) => {
        if (!body.success) throw new Error(body.error ?? 'Failed to load template');
        setTemplate(body.data as DocumentTemplateDetail);
      })
      .catch((err: unknown) => setFormError(err instanceof Error ? err.message : 'Failed to load template'))
      .finally(() => setTemplateLoading(false));
  }

  const groupedVariables = useMemo(() => {
    if (!template) return { simple: [], boolean: [], json: [] };
    const simple: TemplateVariable[] = [];
    const boolean: TemplateVariable[] = [];
    const json: TemplateVariable[] = [];
    for (const v of template.variables) {
      if (v.type === 'boolean') boolean.push(v);
      else if (JSON_TYPES.has(v.type)) json.push(v);
      else simple.push(v);
    }
    return { simple, boolean, json };
  }, [template]);

  async function handleSubmit() {
    if (!template || !selectedType) return;
    setFormError(null);

    const data: Record<string, unknown> = {};
    for (const v of template.variables) {
      if (v.type === 'boolean') {
        if (booleanValues[v.name] !== undefined) data[v.name] = booleanValues[v.name];
        continue;
      }
      const coerced = coerceValue(v, values[v.name] ?? '');
      if (!coerced.ok) {
        setFormError(coerced.error);
        return;
      }
      if (coerced.value !== undefined) data[v.name] = coerced.value;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: selectedType, data, format: 'HTML', persist: true }),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error ?? 'Generation failed');
      setResult(body.data as GeneratedDocumentResult);
      toast({ title: 'Document generated', description: `${selectedType.replace(/_/g, ' ')} · ${body.data.generated.hash.slice(0, 12)}…` });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setSubmitting(false);
    }
  }

  const catalogueEntry = catalogue?.find((c) => c.type === selectedType);
  const filename = result
    ? `${result.generated.documentType.toLowerCase()}-${(result.generated.documentNumber ?? result.generated.hash.slice(0, 8)).replace(/[^a-z0-9-]/gi, '_')}.html`
    : '';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" /> Document Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate a trade document from structured data, preview it, and download it.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={PATHS.DOCUMENTS}>
            <FolderLock className="mr-2 h-4 w-4" /> Institutional Vault
          </Link>
        </Button>
      </div>

      {catalogueError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load document types</AlertTitle>
          <AlertDescription>{catalogueError}</AlertDescription>
        </Alert>
      )}

      {!catalogue && !catalogueError && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {catalogue && !selectedType && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalogue.map((c) => (
            <Card key={c.type} className="cursor-pointer transition-colors hover:border-primary" onClick={() => selectType(c.type)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{c.title}</CardTitle>
                <CardDescription className="flex flex-wrap gap-1 pt-1">
                  {c.outputFormats.map((f) => (
                    <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                  ))}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {selectedType && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedType(null); setTemplate(null); setResult(null); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Choose a different document type
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{catalogueEntry?.title ?? selectedType}</CardTitle>
              <CardDescription>Fill in the fields below, then generate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {templateLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
                </div>
              )}

              {template && !result && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {groupedVariables.simple.map((v) => (
                      <div key={v.name} className="space-y-1.5">
                        <Label htmlFor={v.name}>
                          {fieldLabel(v)} {v.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id={v.name}
                          type={v.type === 'number' ? 'number' : v.type === 'date' ? 'date' : 'text'}
                          value={values[v.name] ?? ''}
                          onChange={(e) => setValues((s) => ({ ...s, [v.name]: e.target.value }))}
                        />
                        {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                      </div>
                    ))}
                  </div>

                  {groupedVariables.boolean.length > 0 && (
                    <div className="flex flex-wrap gap-6">
                      {groupedVariables.boolean.map((v) => (
                        <div key={v.name} className="flex items-center gap-2">
                          <Checkbox
                            id={v.name}
                            checked={booleanValues[v.name] ?? false}
                            onCheckedChange={(checked) => setBooleanValues((s) => ({ ...s, [v.name]: checked === true }))}
                          />
                          <Label htmlFor={v.name}>{fieldLabel(v)}</Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedVariables.json.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        {groupedVariables.json.map((v) => (
                          <div key={v.name} className="space-y-1.5">
                            <Label htmlFor={v.name}>
                              {fieldLabel(v)} {v.required && <span className="text-destructive">*</span>}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (JSON {v.type})
                              </span>
                            </Label>
                            <Textarea
                              id={v.name}
                              rows={4}
                              placeholder={v.type === 'array' ? '[ { "description": "...", "quantity": 1 } ]' : '{ "name": "...", "address": "...", "country": "...", "taxId": "..." }'}
                              value={values[v.name] ?? ''}
                              onChange={(e) => setValues((s) => ({ ...s, [v.name]: e.target.value }))}
                              className="font-mono text-xs"
                            />
                            {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Can&apos;t generate this document</AlertTitle>
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Generate Document
                  </Button>
                </>
              )}

              {result && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Document generated</AlertTitle>
                    <AlertDescription>
                      {result.generated.documentNumber ?? 'No document number'} · hash {result.generated.hash.slice(0, 16)}…
                      {result.document && <> · vaulted as v{result.document.version} ({result.document.status})</>}
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => downloadBlob(result.generated.content, 'text/html', filename)}>
                      <Download className="mr-2 h-4 w-4" /> Download HTML
                    </Button>
                    <Button variant="outline" onClick={() => printContent(result.generated.content)}>
                      <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
                    </Button>
                    <Button variant="ghost" onClick={() => { setResult(null); setValues({}); setBooleanValues({}); }}>
                      Generate another
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    This preview is only available right now — the rendered content isn&apos;t persisted, only its hash and metadata are.
                    Download or print it if you need it later.
                  </p>

                  <iframe
                    ref={previewRef}
                    sandbox=""
                    srcDoc={result.generated.content}
                    title="Document preview"
                    className="h-[600px] w-full rounded-lg border bg-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
