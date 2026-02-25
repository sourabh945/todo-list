import { describe, it, expect, beforeEach } from "vitest";
import { Types } from "mongoose";
import { Task } from "../models/task.model.js";

const USER_ID = new Types.ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa");
const OTHER_USER_ID = new Types.ObjectId("bbbbbbbbbbbbbbbbbbbbbbbb");

const futureDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

async function seedTask(overrides = {}) {
  return Task.create({
    user_id: USER_ID,
    title: "Seed Task",
    desc: "Seeded for testing",
    dueDate: futureDate(),
    ...overrides,
  });
}

describe("Task Model", () => {
  describe("Task creation", () => {
    it("should create a task with default status=pending and priority=medium", async () => {
      const task = await Task.create({
        user_id: USER_ID,
        title: "Default Task",
        desc: "Some desc",
      });

      expect(task.status).toBe("pending");
      expect(task.priority).toBe("medium");
    });

    it("should create a task with explicit status and priority", async () => {
      const task = await Task.create({
        user_id: USER_ID,
        title: "Explicit Task",
        desc: "With values",
        status: "in-progress",
        priority: "high",
      });

      expect(task.status).toBe("in-progress");
      expect(task.priority).toBe("high");
    });

    it("should fail with a past dueDate", async () => {
      await expect(
        Task.create({
          user_id: USER_ID,
          title: "Past Due",
          desc: "Should fail",
          dueDate: new Date("2020-01-01"),
        }),
      ).rejects.toThrow();
    });

    it("should fail with title shorter than 3 chars", async () => {
      await expect(
        Task.create({
          user_id: USER_ID,
          title: "ab",
          desc: "Short title",
        }),
      ).rejects.toThrow();
    });

    it("should fail without required title", async () => {
      await expect(
        Task.create({ user_id: USER_ID, desc: "No title" }),
      ).rejects.toThrow();
    });

    it("should have immutable user_id", async () => {
      const task = await seedTask();
      task.user_id = OTHER_USER_ID;

      // Mongoose immutable fields won't persist the change
      await task.save();
      const refetched = await Task.findById(task._id);
      expect(refetched!.user_id.toString()).toBe(USER_ID.toString());
    });
  });

  describe("getAllActiveTasksForUser", () => {
    beforeEach(async () => {
      await seedTask({ title: "Active 1", status: "pending" });
      await seedTask({ title: "Active 2", status: "in-progress" });
      await seedTask({ title: "Done 1", status: "done" });
      await seedTask({ title: "Other User", user_id: OTHER_USER_ID });
    });

    it("should return only pending and in-progress tasks for user", async () => {
      const tasks = await Task.getAllActiveTasksForUser(USER_ID, 1, 20);

      expect(tasks.length).toBe(2);
      // All tasks should belong to USER_ID
      tasks.forEach((t) => {
        expect(t.user_id.toString()).toBe(USER_ID.toString());
      });
    });

    it("should not return done tasks", async () => {
      const tasks = await Task.getAllActiveTasksForUser(USER_ID, 1, 20);
      const statuses = tasks.map((t) => t._status);

      // _status 3 = done
      expect(statuses).not.toContain(3);
    });

    it("should not return tasks from other users", async () => {
      const tasks = await Task.getAllActiveTasksForUser(USER_ID, 1, 20);
      tasks.forEach((t) => {
        expect(t.user_id.toString()).toBe(USER_ID.toString());
      });
    });

    it("should respect pagination limit", async () => {
      const tasks = await Task.getAllActiveTasksForUser(USER_ID, 1, 1);
      expect(tasks.length).toBe(1);
    });

    it("should return empty array on page 2 when only 2 tasks exist", async () => {
      const tasks = await Task.getAllActiveTasksForUser(USER_ID, 2, 10);
      expect(tasks.length).toBe(0);
    });
  });

  describe("getAllDoneTasksForUser", () => {
    beforeEach(async () => {
      await seedTask({ title: "Done A", status: "done" });
      await seedTask({ title: "Done B", status: "done" });
      await seedTask({ title: "Pending C", status: "pending" });
    });

    it("should return only done tasks", async () => {
      const tasks = await Task.getAllDoneTasksForUser(USER_ID, 1, 20);
      expect(tasks.length).toBe(2);
    });

    it("should not include pending or in-progress", async () => {
      const tasks = await Task.getAllDoneTasksForUser(USER_ID, 1, 20);
      tasks.forEach((t) => {
        expect(t._status).toBe(3); // done
      });
    });
  });

  describe("updateTask", () => {
    it("should update a task and return true", async () => {
      const task = await seedTask({ title: "Old Title" });
      const result = await Task.updateTask(USER_ID, task._id, {
        title: "New Title",
      });

      expect(result).toBe(true);

      const updated = await Task.findById(task._id);
      expect(updated!.title).toBe("New Title");
    });

    it("should return false for non-existent task", async () => {
      const fakeId = new Types.ObjectId();
      const result = await Task.updateTask(USER_ID, fakeId, {
        title: "Ghost",
      });

      expect(result).toBe(false);
    });

    it("should not update another user's task", async () => {
      const task = await seedTask({ title: "Private Task" });
      const result = await Task.updateTask(OTHER_USER_ID, task._id, {
        title: "Hacked",
      });

      expect(result).toBe(false);
      const unchanged = await Task.findById(task._id);
      expect(unchanged!.title).toBe("Private Task");
    });
  });

  describe("deleteTask", () => {
    it("should delete a task and return true", async () => {
      const task = await seedTask({ title: "Doomed Task" });
      const result = await Task.deleteTask(USER_ID, task._id);

      expect(result).toBe(true);
      const deleted = await Task.findById(task._id);
      expect(deleted).toBeNull();
    });

    it("should return false for non-existent task", async () => {
      const fakeId = new Types.ObjectId();
      const result = await Task.deleteTask(USER_ID, fakeId);

      expect(result).toBe(false);
    });

    it("should not delete another user's task", async () => {
      const task = await seedTask({ title: "Keep Me" });
      const result = await Task.deleteTask(OTHER_USER_ID, task._id);

      expect(result).toBe(false);
      const stillThere = await Task.findById(task._id);
      expect(stillThere).not.toBeNull();
    });
  });

  describe("getStatsForUser", () => {
    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 0);

      await seedTask({ title: "Pending 1", status: "pending" });
      await seedTask({ title: "Pending 2", status: "pending" });
      await seedTask({ title: "In Progress 1", status: "in-progress" });
      await seedTask({ title: "Done 1", status: "done" });
      await seedTask({
        title: "DueToday",
        status: "pending",
        dueDate: tomorrow,
      });
    });

    it("should count pending tasks correctly", async () => {
      const stats = await Task.getStatsForUser(USER_ID);
      expect(stats.pending).toBe(3); // P1, P2, DueToday
    });

    it("should count in-progress tasks correctly", async () => {
      const stats = await Task.getStatsForUser(USER_ID);
      expect(stats.inProgress).toBe(1);
    });

    it("should not count done tasks in pending or inProgress", async () => {
      const stats = await Task.getStatsForUser(USER_ID);
      // done task should NOT be in pending or inProgress counts
      expect(stats.pending + stats.inProgress).toBe(4);
    });

    it("should count tasks due this week", async () => {
      const stats = await Task.getStatsForUser(USER_ID);
      expect(stats.dueThisWeek).toBeGreaterThanOrEqual(1);
    });

    it("should return zero stats for user with no tasks", async () => {
      const emptyUserId = new Types.ObjectId();
      const stats = await Task.getStatsForUser(emptyUserId);

      expect(stats.pending).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.dueThisWeek).toBe(0);
      expect(stats.dueToday).toBe(0);
    });
  });
});
