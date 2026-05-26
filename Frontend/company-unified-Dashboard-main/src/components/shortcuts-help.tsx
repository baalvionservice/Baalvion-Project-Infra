
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const generalShortcuts = [
    { keys: ['⌘', 'K'], description: 'Open global search' },
    { keys: ['⌘', 'P'], description: 'Open quick page switcher' },
    { keys: ['?'], description: 'Show this help menu' },
    { keys: ['Esc'], description: 'Close any modal or dialog' },
];

const navigationShortcuts = [
    { keys: ['G', 'then', 'D'], description: 'Go to Dashboard' },
    { keys: ['G', 'then', 'B'], description: 'Go to Businesses' },
    { keys: ['G', 'then', 'F'], description: 'Go to Finance' },
    { keys: ['G', 'then', 'E'], description: 'Go to Employees' },
];

export default function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these shortcuts to navigate Baalvion even faster.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <div>
                <h3 className="font-semibold mb-2">General</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableBody>
                            {generalShortcuts.map(shortcut => (
                                <TableRow key={shortcut.description}>
                                    <TableCell className="font-medium">{shortcut.description}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            {shortcut.keys.map((key, i) => <kbd key={i} className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">{key}</kbd>)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div>
                 <h3 className="font-semibold mb-2">Navigation</h3>
                 <div className="rounded-md border">
                     <Table>
                        <TableBody>
                            {navigationShortcuts.map(shortcut => (
                                <TableRow key={shortcut.description}>
                                    <TableCell className="font-medium">{shortcut.description}</TableCell>
                                    <TableCell className="text-right">
                                         <div className="flex gap-1 justify-end">
                                            {shortcut.keys.map((key, i) => <kbd key={i} className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">{key}</kbd>)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
