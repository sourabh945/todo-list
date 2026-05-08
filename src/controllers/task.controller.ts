import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.error.util.js";
import { Task } from "../models/task.model.js";
import AppError from "../utils/AppError.error.util.js";

/*
Creating the task
*/
export const createTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const taskBody = req.body as {
    title: string;
    desc: string;
    priority: string;
    status: string;
    dueDate: Date;
  };

  const task = await Task.create({ user_id: userId, ...taskBody });

  res.status(201).json({ status: "success", task: task });
});

/*
update the task
*/
export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const id = req.params.id;
  if (!id || typeof id !== "string") {
    throw new AppError("Invalid task ID", "Invalid task ID", 400);
  }
  const updates = req.body as { string: string };
  const result = await Task.updateTask(userId, id, updates);
  if (result) {
    res
      .status(203)
      .json({ status: "success", message: "Task updated successfully" });
  } else {
    throw new AppError("Task not found", "Task not found", 404);
  }
});

/*
Get all active tasks [status: inprogress or pending] as using pagnization
*/
export const getActiveTasks = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (limit > 25 || limit < 1) {
      throw new AppError(
        "Limit must be between 1 and 25",
        "Invalid limit",
        400,
      );
    }
    if (page < 0) {
      throw new AppError(
        "Page must be greater than or equal to 0",
        "Invalid page",
        400,
      );
    }

    const tasks = await Task.getAllActiveTasksForUser(userId, page, limit);

    if (tasks) {
      res.status(200).json({ status: "success", tasks: tasks });
    } else {
      throw new AppError("No active tasks found", "No active tasks found", 404);
    }
  },
);

/*
Get all the done tasks [status: done]
*/
export const getDoneTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  if (limit > 25 || limit < 1) {
    throw new AppError("Limit must be between 1 and 25", "Invalid limit", 400);
  }
  if (page < 0) {
    throw new AppError(
      "Page must be greater than or equal to 0",
      "Invalid page",
      400,
    );
  }

  const tasks = await Task.getAllDoneTasksForUser(userId, page, limit);

  if (tasks) {
    res.status(200).json({ status: "success", tasks: tasks });
  } else {
    throw new AppError("No active tasks found", "No active tasks found", 404);
  }
});

/*
delete a task
*/
export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const id = req.params.id as string;

  const result = await Task.deleteTask(userId, id);

  if (result) {
    res.status(200).json({ status: "success", message: "Task deleted" });
  } else {
    throw new AppError("Task not found", "Task not found", 404);
  }
});

/*
Get the status of all tasks
*/
export const getStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const stats = await Task.getStatsForUser(userId);

  if (stats) {
    res.status(200).json({ status: "success", stats: stats });
  } else {
    throw new AppError("No active tasks found", "No active tasks found", 404);
  }
});
