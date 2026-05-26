"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Check, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DocumentPreviewDialog from "@/components/shared/DocumentPreviewDialog";

type Document = {
    id: number;
    name: string;
    version: string;
    date: string;
    status: string;
};

interface DataRoomClientProps {
    initialDocuments: any[];
}

export default function DataRoomClient({ initialDocuments }: DataRoomClientProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    const handleDownload = (docName: string) => {
        toast({
            title: "Audit Log: Download",
            description: `Download initiated for ${docName}.`,
        });
    };

    const handleAcknowledge = (docName: string) => {
        toast({
            title: "Audit Log: Acknowledge",
            description: `${docName} has been marked as acknowledged.`,
        });
    };

    const handlePreview = (doc: Document) => {
        setSelectedDoc(doc);
        setIsPreviewOpen(true);
    };

    const filteredDocuments = useMemo(() => {
        return initialDocuments.map(category => {
            const filteredDocs = category.docs.filter((doc: any) => {
                const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
                return matchesSearch && matchesStatus;
            });
            return { ...category, docs: filteredDocs };
        }).filter(category => category.docs.length > 0);
    }, [searchTerm, statusFilter, initialDocuments]);

    return (
        <main className="flex-grow bg-muted/20 py-12">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold">Phase 2: SPV Data Room</h1>
                    <p className="text-muted-foreground">Confidential documents for Project Olympus SPV.</p>
                </div>

                <Alert className="mb-8">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Confidential & Audited</AlertTitle>
                    <AlertDescription>
                        Access and downloads are tracked for compliance. Acknowledge documents as required.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Document Library</CardTitle>
                        <CardDescription>
                            All documents related to your SPV investment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter documents..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                                    <SelectItem value="Not Required">Not Required</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Accordion type="multiple" defaultValue={filteredDocuments.map((_, index) => `item-${index}`)} className="w-full">
                            {filteredDocuments.map((category, index) => (
                                <AccordionItem value={`item-${index}`} key={category.category}>
                                    <AccordionTrigger className="text-lg">
                                        {category.category} ({category.docs.length} docs)
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Document Name</TableHead>
                                                        <TableHead>Version</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {category.docs.map((doc: any) => (
                                                        <TableRow key={doc.id}>
                                                            <TableCell className="font-medium flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                                {doc.name}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">v{doc.version}</Badge>
                                                            </TableCell>
                                                            <TableCell>{doc.date}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={doc.status === 'Acknowledged' ? 'default' : 'secondary'}>
                                                                    {doc.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={() => handlePreview(doc)}>
                                                                    <Eye className="h-5 w-5" />
                                                                    <span className="sr-only">Preview {doc.name}</span>
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.name)}>
                                                                    <Download className="h-5 w-5" />
                                                                    <span className="sr-only">Download {doc.name}</span>
                                                                </Button>
                                                                {doc.status === 'Pending' && (
                                                                    <Button variant="ghost" size="icon" onClick={() => handleAcknowledge(doc.name)}>
                                                                        <Check className="h-5 w-5" />
                                                                        <span className="sr-only">Acknowledge {doc.name}</span>
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        {filteredDocuments.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No documents match your filters.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DocumentPreviewDialog
                isPreviewOpen={isPreviewOpen}
                setIsPreviewOpen={setIsPreviewOpen}
                selectedDoc={selectedDoc}
            />
        </main>
    );
}
