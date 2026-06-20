"use client";

import { useState } from "react";
import { generateProductDescription } from "@/ai/flows/generate-product-description-flow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Loader2,
  Sparkles,
  Gem,
  ArrowRight,
  Trash2,
  Edit,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useInventory } from "@/hooks/use-inventory";
import { StatusBadge } from "@/components/shared/StatusBadge";

const listingSchema = z.object({
  mineralType: z.string().min(1, "Mineral Type is required"),
  grade: z.string().min(1, "Grade is required"),
  purity: z.string().min(1, "Purity is required"),
  quantity: z.string().min(1, "Quantity is required"),
  origin: z.string().min(1, "Origin is required"),
  additionalDetails: z.string().optional(),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export default function InventoryPage() {
  const { toast } = useToast();
  const { inventory, loading: loadingData } = useInventory();
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      mineralType: "",
      grade: "",
      purity: "",
      quantity: "",
      origin: "",
      additionalDetails: "",
    },
  });

  const handleGenerate = async () => {
    const values = form.getValues();
    if (!values.mineralType || !values.grade) {
      toast({
        title: "Missing Information",
        description:
          "Please fill out at least Mineral Type and Grade for AI generation.",
        variant: "destructive",
      });
      return;
    }

    setLoadingAI(true);
    try {
      const res = await generateProductDescription({
        mineralType: values.mineralType,
        grade: values.grade,
        purity: values.purity,
        quantity: values.quantity,
        origin: values.origin,
        additionalDetails: values.additionalDetails,
      });
      form.setValue("additionalDetails", res.description);
      toast({
        title: "AI Generation Complete",
        description: "Product description optimized.",
      });
    } catch (err) {
      toast({
        title: "AI Error",
        description: "Failed to generate description.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const onSubmit = async (data: ListingFormValues) => {
    setIsSubmitting(true);
    // Simulate API call via service
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);

    toast({
      title: "Listing Published",
      description: `${data.mineralType} has been added to the marketplace.`,
    });
    setOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your mineral listings and stock levels.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 font-bold h-11 px-6 shadow-lg">
              <Plus className="h-4 w-4" /> Add New Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                <Gem className="h-6 w-6 text-secondary" />
                Create Standardized Listing
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 py-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mineralType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mineral Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Iron Ore">Iron Ore</SelectItem>
                            <SelectItem value="Copper">
                              Copper Concentrate
                            </SelectItem>
                            <SelectItem value="Silica">Silica Sand</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade / Quality</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 62% Fe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-4 bg-muted/30 rounded-xl border border-dashed space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                    <Layers className="h-3 w-3" /> Technical Specifications
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="purity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Purity (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 99.9%" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel className="text-xs">
                        Moisture Content (%)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 8.5%" />
                      </FormControl>
                    </FormItem>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (MT)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Brazil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalDetails"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Product Description</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-secondary hover:text-secondary/80 gap-1 h-7 text-xs font-bold"
                          onClick={handleGenerate}
                          disabled={loadingAI || isSubmitting}
                        >
                          {loadingAI ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Generate with AI
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Standardized professional description..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="font-bold"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Publish Listing"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        {loadingData ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="w-full">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Listing ID</TableHead>
                  <TableHead className="font-bold">Mineral</TableHead>
                  <TableHead className="font-bold">Grade</TableHead>
                  <TableHead className="font-bold">Quantity</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-primary">
                      {item.id}
                    </TableCell>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold h-5"
                      >
                        {item.grade}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">{item.quantity}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} type="INVENTORY" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
