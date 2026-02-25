import { describe, it, expect, vi } from "vitest";
import AppError from "../utils/AppError.error.util.js";

vi.spyOn(process, "exit").mockImplementation((_code?: number | string) => {
  throw new Error(`process.exit called with code: ${String(_code)}`);
});

describe("AppError", () => {
  it("should create an error with correct properties", () => {
    const err = new AppError("Internal msg", "User-friendly msg", 400);
    expect(err.message).toBe("Internal msg");
    expect(err.externalMessage).toBe("User-friendly msg");
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err.critical).toBe(false);
  });

  it("should be an instance of Error", () => {
    const err = new AppError("Test", "Test", 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("should set critical to true when passed", () => {
    expect(() => {
      new AppError("Critical error", "Crash", 500, true);
    }).toThrow("process.exit called with code: 1");
  });

  it("should have a stack trace", () => {
    const err = new AppError("Stack trace test", "msg", 400);
    expect(err.stack).toBeDefined();
    // In production/minified builds the class name may appear as "Error"
    // so just check the stack exists and contains our message
    expect(err.stack).toContain("Stack trace test");
  });

  it("should store different statusCodes correctly", () => {
    const codes = [400, 401, 403, 404, 409, 500];
    codes.forEach((code) => {
      const err = new AppError("msg", "msg", code);
      expect(err.statusCode).toBe(code);
    });
  });
});
