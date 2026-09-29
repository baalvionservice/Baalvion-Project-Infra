
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  Layers, 
  Gem, 
  Settings2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const categorySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Provide a meaningful description"),
});

export default function AdminCatalogPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [categories] = useState([
    { id: "CAT-01", name: "Metallic Minerals", types: 12, templates: 8 },
    { id: "CAT-02", name: "Industrial Minerals", types: 24, templates: 15 },
    { id: "CAT-03", name: "Stone & Aggregates", types: 18, templates: 10 },
    { id: "CAT-04", name: "Precious Metals", types: 5, templates: 5 },
  ]);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: z.infer<typeof categorySchema>) => {
    toast({ title: "Category Created", description: `${data.name} taxonomy added.` });
    setOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Global Product Catalog
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage mineral categories, types, and standardized attribute templates.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white font-bold gap-2">
              <Plus className="h-4 w-4" /> New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Mineral Category</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Energy Minerals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="General description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Category</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Taxonomy Structure</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                        <span className="font-bold text-slate-900">{cat.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="mt-2 flex gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{cat.types} Types</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{cat.templates} Templates</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search types..." className="pl-10 h-10 border-none bg-transparent" />
            </div>
            <Button variant="outline" className="gap-2 border-slate-200">
              <Plus className="h-4 w-4" /> Add Mineral Type
            </Button>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <div>
                <CardTitle className="text-lg">Metallic Minerals Detail</CardTitle>
                <CardDescription>Types and attribute enforcement.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white border-slate-200">12 Active Types</Badge>
            </CardHeader>
            <ScrollArea className="w-full overflow-x-auto">
              <div className="divide-y min-w-[600px]">
                {[
                  { name: "Iron Ore", grades: ["62% Fe", "65% Fe"], templates: ["Standard Industrial"], unit: "MT" },
                  { name: "Copper Concentrate", grades: ["30% Cu", "25% Cu"], templates: ["High Purity"], unit: "MT" },
                  { name: "Bauxite", grades: ["45% Al2O3"], templates: ["Bulk Aggregate"], unit: "MT" },
                  { name: "Lithium Spodumene", grades: ["SC 6.0"], templates: ["Critical Minerals"], unit: "kg" },
                ].map((type, i) => (
                  <div key={i} className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Gem className="h-5 w-5 text-primary" />
                        <h4 className="font-bold text-slate-900">{type.name}</h4>
                        <Badge className="text-[9px] font-bold h-4 bg-slate-100 text-slate-600 border-none">{type.unit}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {type.grades.map((g, idx) => (
                          <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">{g}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Template</p>
                        <p className="text-xs font-bold text-slate-700">{type.templates[0]}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary"><Settings2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
