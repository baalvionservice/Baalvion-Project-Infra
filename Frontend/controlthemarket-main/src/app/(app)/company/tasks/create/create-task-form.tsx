"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel as SelectGroupLabel,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  CalendarIcon,
  Sparkles,
  Trash2,
  Paperclip,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AiAssistantDialog } from "./ai-assistant-dialog";
import type {
  RoleCategory,
  TaskDifficulty,
  TaskType,
  TaskTemplate,
} from "@/lib/types";
import { getTemplates, saveTemplate } from "@/lib/api";
import { createTask } from "@/lib/write-api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { groupedRoles, allRoleCategories, roleTaskTypesMap } from "@/lib/roles";

const optionalPositiveNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().positive().int().optional()
);

const formSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters."),
    roleCategory: z.enum(allRoleCategories, {
      required_error: "Please select a role category.",
    }),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"], {
      required_error: "Please select a difficulty.",
    }),
    taskTypes: z
      .array(z.string())
      .refine((value) => value.some((item) => item), {
        message: "You have to select at least one task type.",
      }),
    deadline: z.date({ required_error: "A deadline is required." }),
    isPrivate: z.boolean().default(false),
    multiRound: z.boolean().default(false),
    instructions: z.string(),
    expectedOutputs: z.string(),
    timeLimitMinutes: optionalPositiveNumber,
    projectFile: z.any().optional(),
    rounds: z
      .array(
        z.object({
          instructions: z
            .string()
            .min(20, "Instructions must be at least 20 characters."),
          expectedOutputs: z
            .string()
            .min(20, "Expected outputs must be at least 20 characters."),
          timeLimitMinutes: optionalPositiveNumber,
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.multiRound) {
      if (!data.rounds || data.rounds.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["rounds"],
          message: "Multi-round tasks must have at least one round.",
        });
      }
    } else {
      if (!data.instructions || data.instructions.length < 20) {
        ctx.addIssue({
          code: "custom",
          path: ["instructions"],
          message:
            "Instructions must be at least 20 characters for a single-round task.",
        });
      }
      if (!data.expectedOutputs || data.expectedOutputs.length < 20) {
        ctx.addIssue({
          code: "custom",
          path: ["expectedOutputs"],
          message:
            "Expected outputs must be at least 20 characters for a single-round task.",
        });
      }
    }
  });

const getParentRole = (role: RoleCategory): RoleCategory => {
  for (const group of groupedRoles) {
    if (group.subRoles.includes(role) || group.label === role) {
      return group.label;
    }
  }
  return role;
};

export function CreateTaskForm() {
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { user, subscription, plan } = useAuth();

  useEffect(() => {
    getTemplates().then(setTemplates);
  }, []);

  const canCreateTask = useMemo(() => {
    if (!subscription || !plan) return false;
    if (plan.limits.tasks === -1) return true; // Unlimited
    return subscription.usage.tasksCreated < plan.limits.tasks;
  }, [subscription, plan]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      instructions: "",
      expectedOutputs: "",
      taskTypes: [],
      timeLimitMinutes: undefined,
      isPrivate: false,
      multiRound: false,
      rounds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rounds",
  });

  const watchedRoleCategory = form.watch("roleCategory");
  const watchedMultiRound = form.watch("multiRound");

  const availableTaskTypes = useMemo(() => {
    if (!watchedRoleCategory) return [];
    return (
      roleTaskTypesMap[watchedRoleCategory] ||
      roleTaskTypesMap[getParentRole(watchedRoleCategory as RoleCategory)] ||
      []
    );
  }, [watchedRoleCategory]);

  useEffect(() => {
    const currentSelectedTypes = form.getValues("taskTypes") || [];
    const validSelectedTypes = currentSelectedTypes.filter((type) =>
      availableTaskTypes.includes(type as TaskType)
    );

    if (currentSelectedTypes.length !== validSelectedTypes.length) {
      form.setValue("taskTypes", validSelectedTypes, { shouldValidate: true });
    }
  }, [watchedRoleCategory, availableTaskTypes, form]);

  function handleLoadTemplate(templateId: string) {
    const template = templates.find((t) => t.templateId === templateId);
    if (!template) return;

    form.reset();
    form.setValue("title", template.title, { shouldValidate: true });
    form.setValue("description", template.description, {
      shouldValidate: true,
    });
    form.setValue("roleCategory", template.roleCategory, {
      shouldValidate: true,
    });
    form.setValue("difficulty", template.difficulty, { shouldValidate: true });
    form.setValue("taskTypes", template.taskTypes || [], {
      shouldValidate: true,
    });
    form.setValue("multiRound", template.multiRound || false, {
      shouldValidate: true,
    });
    form.setValue("isPrivate", template.isPrivate || false, {
      shouldValidate: true,
    });

    if (template.multiRound && template.rounds) {
      form.setValue(
        "rounds",
        template.rounds.map((r) => ({
          ...r,
          timeLimitMinutes: r.timeLimitMinutes || undefined,
        })),
        { shouldValidate: true }
      );
    } else {
      form.setValue("instructions", template.instructions, {
        shouldValidate: true,
      });
      form.setValue("expectedOutputs", template.expectedOutputs, {
        shouldValidate: true,
      });
      form.setValue(
        "timeLimitMinutes",
        template.timeLimitMinutes || undefined,
        { shouldValidate: true }
      );
    }

    toast({
      title: "Template Loaded",
      description: `The form has been populated with the "${template.title}" template.`,
    });
  }

  async function onSubmit(
    values: z.infer<typeof formSchema>,
    status: "draft" | "published" = "published"
  ) {
    if (!user || !user.companyId) {
      toast({
        title: "Error",
        description: "You must be associated with a company to create a task.",
        variant: "destructive",
      });
      return;
    }
    if (!canCreateTask && status === "published") {
      toast({
        title: "Task Limit Reached",
        description:
          "You have reached the maximum number of active tasks for your current plan. Please upgrade your plan to publish more tasks.",
        variant: "destructive",
      });
      return;
    }
    const taskData = {
      ...values,
      taskTypes: values.taskTypes as TaskType[],
      deadline: values.deadline.toISOString(),
      isOpen: !values.isPrivate,
      status: status,
      companyId: user.companyId,
      createdBy: user.id,
      rounds: values.rounds?.map((round, index) => ({
        ...round,
        roundNumber: index + 1,
      })),
    };
    await createTask(taskData);
    toast({
      title: `Task ${status === "draft" ? "Saved as Draft" : "Published"}!`,
      description: `The task "${values.title}" has been successfully ${status}.`,
    });
    router.push("/company/tasks");
  }

  const handleDescriptionUpdate = (newDescription: string) => {
    form.setValue("description", newDescription, { shouldValidate: true });
  };

  const handleSaveTemplate = async () => {
    const values = form.getValues();
    if (!values.title) {
      toast({
        title: "Cannot save template",
        description: "Please provide a title for the task first.",
        variant: "destructive",
      });
      return;
    }
    if (!user?.companyId) {
      toast({
        title: "Error",
        description: "You must be part of a company to save a template.",
        variant: "destructive",
      });
      return;
    }

    const templateData: Omit<
      TaskTemplate,
      "templateId" | "createdAt" | "updatedAt"
    > = {
      title: values.title,
      description: values.description,
      instructions: values.instructions,
      expectedOutputs: values.expectedOutputs,
      roleCategory: values.roleCategory as RoleCategory,
      difficulty: values.difficulty,
      taskTypes: values.taskTypes as TaskType[],
      timeLimitMinutes: values.timeLimitMinutes,
      multiRound: values.multiRound,
      rounds: values.rounds?.map((round, index) => ({
        ...round,
        roundNumber: index + 1,
      })),
      isPrivate: values.isPrivate,
      createdBy: user.companyId,
    };

    await saveTemplate(templateData);
    const updatedTemplates = await getTemplates();
    setTemplates(updatedTemplates);

    toast({
      title: "Template Saved!",
      description: `"${values.title}" is now available as a template.`,
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          {!canCreateTask && (
            <div className="flex items-center gap-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-700">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h4 className="font-semibold">Task Limit Reached</h4>
                <p className="text-sm">
                  You have created {subscription?.usage.tasksCreated}/
                  {plan?.limits.tasks} tasks. You can save new tasks as drafts,
                  but you must upgrade your plan to publish them.
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-yellow-700"
                  asChild
                >
                  <Link href="/company/subscription">Upgrade Plan</Link>
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-6 rounded-md border p-6">
            <h3 className="text-lg font-medium">Task Information</h3>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Build a Responsive Navbar"
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
                  <FormLabel className="flex items-center justify-between">
                    <span>Task Description</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAiDialogOpen(true)}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-primary" />
                      Generate with AI
                    </Button>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a general overview of the task and its objectives."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="roleCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role/Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupedRoles.map((group) => (
                          <SelectGroup key={group.label}>
                            <SelectGroupLabel>{group.label}</SelectGroupLabel>
                            <SelectItem value={group.label}>
                              {group.label} (General)
                            </SelectItem>
                            {group.subRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a difficulty level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="Expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-6 rounded-md border p-6">
            <h3 className="text-lg font-medium">Task Resources</h3>
            <FormField
              control={form.control}
              name="projectFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" /> Project Brief / Attachment
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.zip,.doc,.docx"
                      onChange={(e) =>
                        onChange(e.target.files ? e.target.files[0] : null)
                      }
                      {...rest}
                    />
                  </FormControl>
                  <FormDescription>
                    Optionally attach a supporting document for candidates
                    (e.g., project brief, design specs).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6 rounded-md border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="multiRound"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Multi-Round Task
                      </FormLabel>
                      <FormDescription>
                        Enable to create sequential rounds.
                      </FormDescription>
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
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Private Task</FormLabel>
                      <FormDescription>
                        Only assigned candidates can see this task.
                      </FormDescription>
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

            {!watchedMultiRound ? (
              <>
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed, step-by-step instructions for the candidate."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedOutputs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Outputs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the final deliverables (e.g., 'A link to a GitHub repository', 'A PDF document')."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-md border bg-muted/50 p-4 space-y-4 relative"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Round {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name={`rounds.${index}.instructions`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={`Instructions for round ${
                                index + 1
                              }`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rounds.${index}.expectedOutputs`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Outputs</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={`Expected outputs for round ${
                                index + 1
                              }`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rounds.${index}.timeLimitMinutes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (minutes, optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 60"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      instructions: "",
                      expectedOutputs: "",
                      timeLimitMinutes: undefined,
                    })
                  }
                >
                  Add Round
                </Button>
                <FormMessage>
                  {form.formState.errors.rounds?.message}
                </FormMessage>
              </div>
            )}
          </div>

          <div className="space-y-6 rounded-md border p-6">
            <h3 className="text-lg font-medium">Task Type</h3>
            <FormField
              control={form.control}
              name="taskTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Select Task Types
                    </FormLabel>
                    <FormDescription>
                      {watchedRoleCategory
                        ? "Choose one or more types that apply to this task."
                        : "Please select a Role/Position to see available task types."}
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {availableTaskTypes.length > 0 ? (
                      availableTaskTypes.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="taskTypes"
                          render={({ field }) => (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value || []),
                                          item,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    ) : (
                      <div className="col-span-full">
                        <p className="text-sm text-muted-foreground">
                          Please select a role category to see available task
                          types.
                        </p>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6 rounded-md border p-6">
            <h3 className="text-lg font-medium">Timing</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="timeLimitMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Overall Time Limit (minutes, optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 120"
                        {...field}
                        value={field.value ?? ""}
                        disabled={watchedMultiRound}
                      />
                    </FormControl>
                    <FormDescription>
                      For single-round tasks. Leave blank for no time limit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Submission Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The final date candidates can submit their work.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-6 rounded-md border p-6">
            <h3 className="text-lg font-medium">Templates</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Load from Template</Label>
                <Select onValueChange={handleLoadTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template to pre-fill the form" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem
                        key={template.templateId}
                        value={template.templateId}
                      >
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecting a template will overwrite existing content in the
                  form.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveTemplate}
                >
                  Save as Template
                </Button>
                <p className="text-sm text-muted-foreground pt-2">
                  Save the current task configuration as a template for future
                  use.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit((values) => onSubmit(values, "draft"))}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit((values) =>
                onSubmit(values, "published")
              )}
              disabled={!canCreateTask}
            >
              Publish Task
            </Button>
          </div>
        </form>
      </Form>
      <AiAssistantDialog
        isOpen={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        onDescriptionUpdate={handleDescriptionUpdate}
        initialTitle={form.watch("title")}
      />
    </>
  );
}
