import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, Share, PlusSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function InstallPage() {
    return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image src="/icons/icon-192x192.png" alt="Baalvion Logo" width={80} height={80} className="rounded-xl" data-ai-hint="logo" />
                    </div>
                    <CardTitle>Install Baalvion on iOS</CardTitle>
                    <CardDescription>Follow these steps to add Baalvion to your Home Screen for easy access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                        <div>
                            <p className="font-medium">Tap the Share button</p>
                            <p className="text-sm text-muted-foreground">It's in the bottom toolbar of Safari.</p>
                        </div>
                        <Share className="h-8 w-8 ml-auto text-primary" />
                    </div>
                    <Separator />
                     <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                        <div>
                            <p className="font-medium">Find "Add to Home Screen"</p>
                            <p className="text-sm text-muted-foreground">Scroll down in the share sheet and tap on it.</p>
                        </div>
                        <PlusSquare className="h-8 w-8 ml-auto text-primary" />
                    </div>
                     <Separator />
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                        <div>
                            <p className="font-medium">Confirm the name</p>
                            <p className="text-sm text-muted-foreground">Tap "Add" in the top-right corner.</p>
                        </div>
                         <Image src="/icons/icon-192x192.png" alt="Baalvion Logo" width={40} height={40} className="rounded-md ml-auto" data-ai-hint="logo" />
                    </div>
                    <Button asChild className="w-full mt-6"><Link href="/dashboard">Go to Dashboard</Link></Button>
                </CardContent>
            </Card>
        </div>
    );
}
