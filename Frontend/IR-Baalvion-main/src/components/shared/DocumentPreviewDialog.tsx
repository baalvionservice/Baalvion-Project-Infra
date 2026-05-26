"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// A generic type for document-like objects from different phases.
type DocumentLike = {
    name?: string;
    category?: string;
    version?: string;
    date?: string;
};

type DocumentPreviewDialogProps = {
    isPreviewOpen: boolean;
    setIsPreviewOpen: (isOpen: boolean) => void;
    selectedDoc: DocumentLike | null;
};

/**
 * A reusable dialog component for displaying a mock preview of a document.
 * It's used in both the Phase 2 and Phase 3 data rooms/dashboards.
 */
export default function DocumentPreviewDialog({ isPreviewOpen, setIsPreviewOpen, selectedDoc }: DocumentPreviewDialogProps) {
    // Dynamically build the description string based on available document properties.
    const description = [
        selectedDoc?.category && `Category: ${selectedDoc.category}`,
        selectedDoc?.version && `Version: ${selectedDoc.version}`,
        selectedDoc?.date && `Uploaded: ${selectedDoc.date}`
    ].filter(Boolean).join(" | ") || "This is a mock preview of your legal document.";

    return (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{selectedDoc?.name}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="prose-headings:text-foreground prose-p:text-muted-foreground prose-sm max-w-none rounded-lg border bg-muted/30 p-4 max-h-[60vh] overflow-y-auto">
                    <h4>Mock Document Content for: {selectedDoc?.name}</h4>
                    <p>This is a placeholder for the document content. In a real implementation, this would be an embedded PDF viewer or a secure HTML rendering of the document.</p>
                    <h5>Section 1: Introduction</h5>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.</p>
                    <h5>Section 2: Terms and Conditions</h5>
                    <p>Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh.</p>
                    <h5>Section 3: Signatures</h5>
                    <p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
