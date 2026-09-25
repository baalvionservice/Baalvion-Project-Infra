'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Upload, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCommerceCategories } from '@/lib/queries/commerce-stores.queries';
import { useImportProducts } from '@/lib/queries/commerce-products.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { csvToObjects } from '@/lib/utils/csv';
import type { ImportProductRow, ImportProductsResult } from '@/lib/api/commerce-products';

const TEMPLATE_HEADERS = [
  'name', 'category', 'price', 'currencyCode', 'condition', 'shortDescription',
  'description', 'sku', 'stockQuantity', 'materials', 'tags',
];

interface ParsedRow extends ImportProductRow {
  _rowNumber: number;
  _categoryValid: boolean;
}

function downloadTemplate() {
  const sample = [
    TEMPLATE_HEADERS.join(','),
    'Hermès Birkin 30 Togo,Birkin Bags,18500,USD,excellent,"Classic Birkin 30 in Togo leather","Full description of condition, provenance, accessories…",HB30-001,1,"Togo leather,Palladium hardware","birkin,hermes"',
  ].join('\n');
  const blob = new Blob([sample], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amarise-product-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportProductsPage() {
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';
  const { data: categories } = useCommerceCategories(storeId);
  const importProducts = useImportProducts(storeId);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportProductsResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryKeys = useMemo(() => {
    const set = new Set<string>();
    (categories ?? []).forEach((c) => {
      set.add(c.slug.toLowerCase());
      set.add(c.name.toLowerCase());
    });
    return set;
  }, [categories]);

  const validCount = rows.filter((r) => r._categoryValid && r.name && r.price >= 0).length;

  const handleFile = async (file: File) => {
    setParseError(null);
    setResult(null);
    const text = await file.text();
    const objects = csvToObjects(text);
    if (objects.length === 0) {
      setParseError('No rows found in that file — check it has a header row plus at least one product row.');
      setRows([]);
      return;
    }
    const missingHeaders = ['name', 'category', 'price'].filter(
      (h) => !Object.keys(objects[0]).includes(h)
    );
    if (missingHeaders.length > 0) {
      setParseError(`Missing required column(s): ${missingHeaders.join(', ')}. Download the template below for the exact format.`);
      setRows([]);
      return;
    }

    const parsed: ParsedRow[] = objects.map((o, i) => {
      const price = Number(o.price);
      const materials = o.materials ? o.materials.split(/[|;]/).map((s) => s.trim()).filter(Boolean) : undefined;
      const tags = o.tags ? o.tags.split(/[|;]/).map((s) => s.trim()).filter(Boolean) : undefined;
      const stockQuantity = o.stockQuantity ? Number(o.stockQuantity) : undefined;
      return {
        _rowNumber: i + 2, // account for header row, 1-indexed for the user
        _categoryValid: categoryKeys.has(o.category.trim().toLowerCase()),
        name: o.name,
        category: o.category,
        price: Number.isFinite(price) ? price : NaN,
        currencyCode: o.currencyCode || 'USD',
        condition: (o.condition || undefined) as ImportProductRow['condition'],
        shortDescription: o.shortDescription || undefined,
        description: o.description || undefined,
        sku: o.sku || undefined,
        stockQuantity: Number.isFinite(stockQuantity as number) ? stockQuantity : undefined,
        materials,
        tags,
      };
    });
    setRows(parsed);
  };

  const handleImport = () => {
    const toSend = rows.filter((r) => r._categoryValid && r.name && Number.isFinite(r.price));
    importProducts.mutate(toSend, {
      onSuccess: (res) => setResult(res.data.data),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Products"
        description="Bulk-create products from a spreadsheet — real rows, created directly in your live catalog."
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href="/commerce/products">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium">1. Prepare your CSV</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Required columns: <code className="text-xs bg-muted px-1 rounded">name</code>,{' '}
                <code className="text-xs bg-muted px-1 rounded">category</code> (must match an
                existing category slug or name exactly), <code className="text-xs bg-muted px-1 rounded">price</code>.
                Optional: currencyCode, condition, shortDescription, description, sku, stockQuantity,
                materials (pipe-separated), tags (pipe-separated).
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Photos aren&apos;t importable via CSV — upload them per product afterward from the
                product edit page (real photo files need to go through the media pipeline).
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">2. Upload</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Choose CSV File
            </Button>
            {parseError && (
              <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && !result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                3. Preview — {rows.length} row(s) parsed, {validCount} ready to import
              </h3>
              <Button onClick={handleImport} disabled={validCount === 0 || importProducts.isPending}>
                {importProducts.isPending ? 'Importing…' : `Import ${validCount} Product${validCount === 1 ? '' : 's'}`}
              </Button>
            </div>
            <div className="border rounded-md overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const problems: string[] = [];
                    if (!r.name) problems.push('missing name');
                    if (!Number.isFinite(r.price)) problems.push('invalid price');
                    if (!r._categoryValid) problems.push(`unknown category "${r.category}"`);
                    return (
                      <TableRow key={r._rowNumber}>
                        <TableCell className="text-muted-foreground">{r._rowNumber}</TableCell>
                        <TableCell>{r.name || <span className="text-muted-foreground italic">—</span>}</TableCell>
                        <TableCell>{r.category}</TableCell>
                        <TableCell>{Number.isFinite(r.price) ? `${r.currencyCode} ${r.price}` : '—'}</TableCell>
                        <TableCell>{r.condition ?? '—'}</TableCell>
                        <TableCell>
                          {problems.length === 0 ? (
                            <Badge variant="outline" className="text-green-700 border-green-300">Ready</Badge>
                          ) : (
                            <span className="text-xs text-destructive">{problems.join(', ')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-medium">
              Import complete: {result.created} created, {result.failed} failed (of {result.total})
            </h3>
            <div className="border rounded-md overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.map((r) => (
                    <TableRow key={r.row}>
                      <TableCell className="text-muted-foreground">{r.row + 2}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>
                        {r.success ? (
                          <span className="flex items-center gap-1.5 text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4" /> Created
                            {r.productId && (
                              <Link href={`/commerce/products/${r.productId}`} className="underline ml-1">
                                edit →
                              </Link>
                            )}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm text-destructive">
                            <XCircle className="h-4 w-4" /> {r.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setRows([]); setResult(null); }}>
                Import Another File
              </Button>
              <Button asChild>
                <Link href="/commerce/products">Go to Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
