import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl">Contact Investor Relations</CardTitle>
            <CardDescription>
              For inquiries or to begin the application process, please reach out. This channel is for prospective accredited investors only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Enter your message" className="min-h-[120px]" />
              </div>
              <div className="flex justify-center">
                <Button type="submit" className="w-full sm:w-auto">Submit Inquiry</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
