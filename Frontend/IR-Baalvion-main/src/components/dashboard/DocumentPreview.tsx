'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { AppRole } from '@/lib/rbac/roles';
import { filterDocumentsByAccess } from '@/lib/rbac/documentAccess';

interface Document {
  id: string;
  title: string;
  category: string;
  restrictedTo: AppRole[];
  version: string;
}

export default function DocumentPreview({
  documents,
  role,
}: {
  documents: Document[];
  role: AppRole;
}) {
  const filtered = filterDocumentsByAccess(documents, role).slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Document Vault Preview</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent documents available.
          </p>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none mb-1">{doc.title}</p>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                      {doc.category}
                    </span>
                    <Badge variant="secondary" className="text-[8px] h-4 px-1">
                      v{doc.version}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
