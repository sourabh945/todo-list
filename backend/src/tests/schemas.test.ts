import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "../schema/auth.schema.js";
import { createTaskSchema, updateTaskSchema } from "../schema/task.schema.js";

describe("Auth Schemas", () => {
  describe("signupSchema", () => {
    const valid = {
      body: { username: "testuser11", password: "password123" },
    };

    it("should pass with valid data", () => {
      expect(() => signupSchema.parse(valid)).not.toThrow();
    });

    it("should pass with optional name", () => {
      expect(() =>
        signupSchema.parse({
          body: { ...valid.body, name: "John Doe" },
        }),
      ).not.toThrow();
    });

    it("should fail if username is not 10 chars", () => {
      expect(() =>
        signupSchema.parse({ body: { ...valid.body, username: "short" } }),
      ).toThrow();
    });

    it("should fail if username has special chars", () => {
      expect(() =>
        signupSchema.parse({ body: { ...valid.body, username: "invalid!@#$" } }),
      ).toThrow();
    });

    it("should fail if password < 8 chars", () => {
      expect(() =>
        signupSchema.parse({ body: { ...valid.body, password: "short" } }),
      ).toThrow();
    });

    it("should fail if password > 100 chars", () => {
      expect(() =>
        signupSchema.parse({
          body: { ...valid.body, password: "a".repeat(101) },
        }),
      ).toThrow();
    });

    it("should fail with unknown fields (strict mode)", () => {
      expect(() =>
        signupSchema.parse({ body: { ...valid.body, role: "admin" } }),
      ).toThrow();
    });

    it("should fail if name > 100 chars", () => {
      expect(() =>
        signupSchema.parse({
          body: { ...valid.body, name: "a".repeat(101) },
        }),
      ).toThrow();
    });
  });

  describe("loginSchema", () => {
    const valid = {
      body: { username: "testuser11", password: "password123" },
    };

    it("should pass with valid credentials", () => {
      expect(() => loginSchema.parse(valid)).not.toThrow();
    });

    it("should fail without username", () => {
      expect(() =>
        loginSchema.parse({ body: { password: "password123" } }),
      ).toThrow();
    });

    it("should fail without password", () => {
      expect(() =>
        loginSchema.parse({ body: { username: "testuser11" } }),
      ).toThrow();
    });
  });
});

describe("Task Schemas", () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  describe("createTaskSchema", () => {
    const valid = {
      body: {
        title: "My Task",
        desc: "My description",
        priority: "medium",
        status: "pending",
        dueDate: futureDate,
      },
    };

    it("should pass with valid data", () => {
      expect(() => createTaskSchema.parse(valid)).not.toThrow();
    });

    it("should pass with only required fields", () => {
      expect(() =>
        createTaskSchema.parse({ body: { title: "Min Task", desc: "desc" } }),
      ).not.toThrow();
    });

    it("should fail without title", () => {
      expect(() =>
        createTaskSchema.parse({ body: { desc: "no title" } }),
      ).toThrow();
    });

    it("should fail if title < 3 chars", () => {
      expect(() =>
        createTaskSchema.parse({ body: { ...valid.body, title: "ab" } }),
      ).toThrow();
    });

    it("should fail with invalid priority", () => {
      expect(() =>
        createTaskSchema.parse({ body: { ...valid.body, priority: "ultra" } }),
      ).toThrow();
    });

    it("should fail with invalid status", () => {
      expect(() =>
        createTaskSchema.parse({ body: { ...valid.body, status: "wip" } }),
      ).toThrow();
    });

    it("should fail with past dueDate", () => {
      expect(() =>
        createTaskSchema.parse({
          body: { ...valid.body, dueDate: new Date("2020-01-01") },
        }),
      ).toThrow();
    });

    it("should fail with unknown extra fields", () => {
      expect(() =>
        createTaskSchema.parse({
          body: { ...valid.body, unknownField: "bad" },
        }),
      ).toThrow();
    });

    it("should accept all valid priority values", () => {
      ["low", "medium", "high"].forEach((p) => {
        expect(() =>
          createTaskSchema.parse({ body: { ...valid.body, priority: p } }),
        ).not.toThrow();
      });
    });

    it("should accept all valid status values", () => {
      ["pending", "in-progress", "done"].forEach((s) => {
        expect(() =>
          createTaskSchema.parse({ body: { ...valid.body, status: s } }),
        ).not.toThrow();
      });
    });
  });

  describe("updateTaskSchema", () => {
    it("should pass with an empty body (all optional)", () => {
      expect(() => updateTaskSchema.parse({ body: {} })).not.toThrow();
    });

    it("should pass with partial update", () => {
      expect(() =>
        updateTaskSchema.parse({ body: { title: "New Title" } }),
      ).not.toThrow();
    });

    it("should fail with unknown fields", () => {
      expect(() =>
        updateTaskSchema.parse({ body: { unknownField: "value" } }),
      ).toThrow();
    });
  });
});
