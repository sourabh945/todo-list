import { z } from "zod";

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: z.string({ error: "title should be a string" }).trim().optional(),
      desc: z.string({ error: "desc should be a string" }).trim().optional(),
      priority: z
        .string({ error: "priority should be a string" })
        .trim()
        .optional(),
      status: z
        .string({ error: "status should be a string" })
        .trim()
        .optional(),
      dueDate: z.date({ error: "dueDate should be a date" }).optional(),
    })
    .strict(),
});

export const createTaskSchema = z.object({
  body: z
    .object({
      title: z.string({ error: "title should be a string" }).trim().min(3),
      desc: z.string({ error: "desc should be a string" }).trim(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      status: z.enum(["pending", "in-progress", "done"]).optional(),
      dueDate: z.coerce
        .date()
        .refine((date) => date > new Date(), "Due date must be in the future")
        .optional(),
    })
    .strict(),
});
