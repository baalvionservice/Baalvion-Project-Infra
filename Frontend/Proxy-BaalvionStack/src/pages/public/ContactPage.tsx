import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Clock,
  Send,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@baalvion.com",
    description: "For general inquiries",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+1 (888) 555-0123",
    description: "Mon-Fri 9AM-6PM EST",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    value: "Available 24/7",
    description: "Instant support",
  },
  {
    icon: Clock,
    title: "Response Time",
    value: "< 2 hours",
    description: "Average first response",
  },
];

const offices = [
  {
    city: "Bangalore",
    country: "India (HQ)",
    address: "Koramangala Tech Park, 5th Block, Bangalore 560034",
  },
  {
    city: "San Francisco",
    country: "USA",
    address: "123 Market Street, Suite 400, San Francisco, CA 94105",
  },
  {
    city: "London",
    country: "UK",
    address: "One Canada Square, Canary Wharf, London E14 5AB",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you within 24 hours.");
    }, 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Contact Us
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions about our proxy services? Our team is here to help. 
            Reach out and we'll respond within 24 hours.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {contactMethods.map((method) => (
            <Card key={method.title} className="bg-card/50 text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{method.title}</h3>
                <p className="text-primary font-medium mb-1">{method.value}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-4">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <Button onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: "", email: "", company: "", subject: "", message: "" });
                  }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="Company Name"
                        value={formData.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select onValueChange={(value) => handleChange("subject", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Office Locations */}
          <div className="space-y-6">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>Our Offices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {offices.map((office) => (
                  <div key={office.city} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {office.city}, {office.country}
                      </h4>
                      <p className="text-sm text-muted-foreground">{office.address}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Enterprise Inquiries</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Looking for custom solutions, dedicated support, or volume pricing? 
                  Our enterprise team is ready to help.
                </p>
                <Button variant="outline" asChild>
                  <a href="mailto:enterprise@baalvion.com">
                    Contact Enterprise Sales
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Frequently Asked Questions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find answers to common questions in our documentation and FAQ section.
                </p>
                <Button variant="outline" asChild>
                  <a href="/docs">View Documentation</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
