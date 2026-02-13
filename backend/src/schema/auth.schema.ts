import { z } from "zod";

export const signupSchema = z.object({
  body: z
    .object({
      username: z
        .string({ error: "Username should be a string" })
        .trim()
        .length(10, { error: "Username should be length of 10" })
        .regex(/^[a-zA-Z0-9]+$/, {
          error: "Username should only contain alphanumeric characters",
        }),
      name: z
        .string({ error: "Name should be a string" })
        .trim()
        .max(100, "Name should not longer than 100 characters")
        .optional(),
      password: z
        .string({ error: "Password must be a string" })
        .min(8, { error: "Password must be atleast 8 character long" })
        .max(100, { error: "Password should not longer than 100 character" }),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      username: z
        .string({ error: "Username should be a string" })
        .trim()
        .length(10, { error: "Username should be length of 10" })
        .regex(/^[a-zA-Z0-9]+$/, {
          error: "Username should only contain alphanumeric characters",
        }),
      password: z
        .string({ error: "Password must be a string" })
        .min(8, { error: "Password must be atleast 8 character long" })
        .max(100, { error: "Password should not longer than 100 character" }),
    })
    .strict(),
});
