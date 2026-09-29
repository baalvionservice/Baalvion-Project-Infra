"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";
import type { EvaluationSchema, EvaluationCriterion } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const criterionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Criterion name must be at least 3 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  maxPoints: z.coerce.number().int().min(1).max(100).default(10),
  weight: z.coerce.number().min(0).max(1).default(0.25),
});

const formSchema = z.object({
  name: z.string().min(5, "Schema name must be at least 5 characters."),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  criteria: z
    .array(criterionSchema)
    .min(1, "You must have at least one criterion."),
});

interface SchemaFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (schema: EvaluationSchema) => void;
  schema: EvaluationSchema | null;
}

export function SchemaFormDialog({
  isOpen,
  onOpenChange,
  onSave,
  schema,
}: SchemaFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      criteria: [{ name: "", description: "", maxPoints: 10, weight: 0.25 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "criteria",
  });

  useEffect(() => {
    if (schema) {
      form.reset({
        name: schema.name,
        description: schema.description,
        isActive: schema.isActive,
        criteria: schema.criteria.map((c) => ({ ...c, id: c.id })),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        isActive: true,
        criteria: [{ name: "", description: "", maxPoints: 10, weight: 0.25 }],
      });
    }
  }, [schema, isOpen, form]);

  const watchedCriteria = form.watch("criteria");
  const totalPoints = watchedCriteria.reduce(
    (acc, crit) => acc + (crit.maxPoints || 0),
    0
  );
  const totalWeight = watchedCriteria.reduce(
    (acc, crit) => acc + (crit.weight || 0),
    0
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      title: schema ? "Schema Updated" : "Schema Created",
      description: `The schema "${values.name}" has been saved.`,
    });
    onSave({
      ...values,
      id: schema?.id || `schema-${Date.now()}`,
      description: values.description || "",
      criteria: values.criteria.map((c, i) => ({
        ...c,
        id: c.id || `crit-${Date.now()}-${i}`,
      })),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                {schema ? "Edit" : "Create"} Evaluation Schema
              </DialogTitle>
              <DialogDescription>
                Define the criteria and weights (rules) used to score candidate
                submissions.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] p-1">
              <div className="space-y-6 pr-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schema Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Senior Frontend Engineer"
                          {...field}
                        />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of this schema's purpose."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 rounded-md border p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Criteria (Rules)</h3>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Total Weight
                        </p>
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            totalWeight.toFixed(2) !== "1.00"
                              ? "text-destructive"
                              : "text-primary"
                          )}
                        >
                          {totalWeight.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Total Points
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {totalPoints}
                        </p>
                      </div>
                    </div>
                  </div>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-4 rounded-md border bg-muted/50 p-4 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <FormField
                        control={form.control}
                        name={`criteria.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Criterion Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Technical Skills"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`criteria.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="What to look for..."
                                {...field}
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`criteria.${index}.maxPoints`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Points</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`criteria.${index}.weight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.05" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        name: "",
                        description: "",
                        maxPoints: 10,
                        weight: 0.25,
                      })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Criterion
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Activate Schema</FormLabel>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Schema</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
