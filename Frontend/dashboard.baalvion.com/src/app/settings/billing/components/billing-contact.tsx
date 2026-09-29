
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface BillingContactProps {
    contact: {
        name: string;
        email: string;
        address: string;
    }
}

export default function BillingContact({ contact }: BillingContactProps) {
    const { toast } = useToast();

    const handleUpdate = () => {
        toast({
            title: "Billing Info Updated",
            description: "Your billing contact information has been saved.",
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing Contact</CardTitle>
                <CardDescription>The primary contact for all billing-related communications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="billing-name">Name</Label>
                    <Input id="billing-name" defaultValue={contact.name} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="billing-email">Email</Label>
                    <Input id="billing-email" type="email" defaultValue={contact.email} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="billing-address">Address</Label>
                    <Input id="billing-address" defaultValue={contact.address} />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleUpdate}>Update Billing Info</Button>
            </CardFooter>
        </Card>
    );
}
