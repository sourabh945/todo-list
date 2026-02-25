import { describe, it, expect } from "vitest";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

describe("User Model", () => {
  describe("User creation", () => {
    it("should create a valid user", async () => {
      const user = await User.create({
        username: "validuser1",
        name: "Valid User",
        password: "securepass",
      });
      expect(user.username).toBe("validuser1");
      expect(user.name).toBe("Valid User");
      expect(user._id).toBeDefined();
    });

    it("should hash the password before saving", async () => {
      const plainPassword = "mypassword1";
      const user = await User.create({
        username: "hashtestxx", // exactly 10 chars
        password: plainPassword,
      });
      const rawUser = await User.findById(user._id).select("+password").lean();
      expect(rawUser!.password).not.toBe(plainPassword);
      expect(await bcrypt.compare(plainPassword, rawUser!.password)).toBe(true);
    });

    it("should fail without required username", async () => {
      await expect(User.create({ password: "password123" })).rejects.toThrow();
    });

    it("should fail without required password", async () => {
      await expect(User.create({ username: "nopwduser1" })).rejects.toThrow();
    });

    it("should fail with duplicate username", async () => {
      await User.create({ username: "duplicate1", password: "password123" });
      await expect(
        User.create({ username: "duplicate1", password: "otherpass" }),
      ).rejects.toThrow();
    });

    it("should accept null name", async () => {
      const user = await User.create({
        username: "nonameusrx", // exactly 10 chars
        password: "password123",
        name: null,
      });
      expect(user.name).toBeNull();
    });
  });

  describe("findByCredentials", () => {
    it("should return user on correct credentials", async () => {
      await User.create({
        username: "logintestx", // exactly 10 chars
        name: "Login Test",
        password: "correctpass",
      });
      const user = await User.findByCredentials("logintestx", "correctpass");
      expect(user.username).toBe("logintestx");
      expect(user.name).toBe("Login Test");
    });

    it("should throw on wrong password", async () => {
      await User.create({
        username: "wrongpassx", // exactly 10 chars
        password: "correctpass",
      });
      await expect(
        User.findByCredentials("wrongpassx", "wrongpassword"),
      ).rejects.toThrow("Invalid login credentials");
    });

    it("should throw on non-existent user", async () => {
      await expect(
        User.findByCredentials("nobody1234", "somepassword"),
      ).rejects.toThrow("Invalid login credentials");
    });

    it("should not return password field in result", async () => {
      await User.create({
        username: "nopwdfldxx", // exactly 10 chars
        password: "securepass1",
      });
      const user = await User.findByCredentials("nopwdfldxx", "securepass1");
      expect((user as { password?: string }).password).toBeUndefined();
    });
  });
});
