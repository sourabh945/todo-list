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
      title: z.string({ error: "title should be a string" }).trim(),
      desc: z.string({ error: "desc should be a string" }).trim(),
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
