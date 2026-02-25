// this file contain the task model for the application
// it use the MONGODB as DB
//
import {
  Schema,
  model,
  Types,
  Document,
  Model,
  WithTimestamps,
  VirtualType,
  UpdateQuery,
  InferRawDocType,
  models,
} from "mongoose";
import { ErrorType, ModelErrorHandler } from "./ModelErrorHandlers.js";

interface TaskDoc extends Document, WithTimestamps<Document> {
  user_id: Types.ObjectId;
  title: string;
  desc: string | null;
  _status: number;
  _priority: number;
  dueDate: Date | null;
}

interface TaskVirtual extends VirtualType<TaskDoc> {
  status: string;
  priority: string;
}

type empty = object;

interface stats {
  pending: number;
  inProgress: number;
  dueThisWeek: number;
  dueToday: number;
}

interface TaskModel extends Model<TaskDoc, empty, TaskVirtual> {
  getAllActiveTasksForUser(
    userId: string | Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<Types.Array<InferRawDocType<TaskDoc>>>;
  getAllDoneTasksForUser(
    userId: string | Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<Types.Array<InferRawDocType<TaskDoc>>>;
  updateTask(
    taskId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    updates: UpdateQuery<TaskDoc>,
  ): Promise<boolean>;
  deleteTask(
    userId: string | Types.ObjectId,
    taskId: string | Types.ObjectId,
  ): Promise<boolean>;
  getStatsForUser(userId: string | Types.ObjectId): Promise<stats>;
}

const taskSchema = new Schema<TaskDoc, TaskModel, empty, TaskVirtual>(
  {
    user_id: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    title: {
      type: String,
      required: [true, "You must provide a task title"],
      trim: true,
      minLength: [3, "Title must be at least 3 characters"],
    },
    desc: { type: String },
    _status: {
      type: Number,
      required: true,
      default: 2,
      enum: {
        values: [1, 2, 3],
        message: "status can be only pending, in-progress, and done ",
      },
    },
    _priority: {
      type: Number,
      enum: {
        values: [1, 2, 3],
        message: "Invalid priority, only low, medium, high are choices",
      },
      required: true,
      default: 2,
    },

    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value: Date | null) {
          return !value || value.getTime() > Date.now();
        },
        message: "The due date cannot be in the past!",
      },
    },
  },
  {
    timestamps: true, // This adds 'createdAt' and 'updatedAt' automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const statusMap: Record<number, string> = {
  1: "in-progress",
  2: "pending",
  3: "done",
};

const reverseStatusMap: Record<string, number> = {
  "in-progress": 1,
  pending: 2,
  done: 3,
};

const priorityMap: Record<number, string> = {
  1: "low",
  2: "medium",
  3: "high",
};

const reversePriorityMap: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

//adding the virtuals

taskSchema
  .virtual("status")
  .get(function () {
    return statusMap[this._status];
  })
  .set(function (label: string) {
    this._status = reverseStatusMap[label];
  });

taskSchema
  .virtual("priority")
  .get(function () {
    return priorityMap[this._priority];
  })
  .set(function (label: string) {
    this._priority = reversePriorityMap[label];
  });

//adding indexing

taskSchema.index({ user_id: 1, _status: 1 });

//adding statics

/*
This function is for get the count of the active tasks ( status: pending or in-progress )
*/

/**this function is for get the all active tasks ( status: pending or in-progress ) for a user with peginations
 * Default values are page = 1 and limit = 20
 */
taskSchema.statics.getAllActiveTasksForUser = async function (
  userId: string | Types.ObjectId,
  page = 1,
  limit = 20,
) {
  try {
    const skip = (page - 1) * limit;
    const activeTasks = await this.find({
      user_id: new Types.ObjectId(userId),
      _status: {
        $in: [reverseStatusMap.pending, reverseStatusMap["in-progress"]],
      },
    })
      .sort({ dueDate: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit as number)
      .lean();
    return activeTasks;
  } catch (err) {
    throw ModelErrorHandler(err as ErrorType);
  }
};

/**
 * This is for get the all done tasks ( status: done ) for a user with peginations
 * Default values are page = 1 and limit = 20
 */
taskSchema.statics.getAllDoneTasksForUser = async function (
  userId: string | Types.ObjectId,
  page = 1,
  limit = 20,
) {
  try {
    const skip = (page - 1) * limit;
    const doneTasks = await this.find({
      user_id: new Types.ObjectId(userId),
      _status: reverseStatusMap.done,
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit as number)
      .lean();
    return doneTasks;
  } catch (err) {
    throw ModelErrorHandler(err as ErrorType);
  }
};

/*
 * This is for update a task for a user using taskid and user id
 */
taskSchema.statics.updateTask = async function (
  userId: string | Types.ObjectId,
  taskId: string | Types.ObjectId,
  options: UpdateQuery<TaskDoc>,
) {
  try {
    const result = await this.updateOne(
      { _id: new Types.ObjectId(taskId), user_id: new Types.ObjectId(userId) },
      { $set: { ...options } },
    );
    return result.matchedCount > 0;
  } catch (err) {
    throw ModelErrorHandler(err as Error);
  }
};

taskSchema.statics.deleteTask = async function (
  userId: string | Types.ObjectId,
  taskId: string | Types.ObjectId,
) {
  try {
    const result = await this.deleteOne({
      _id: new Types.ObjectId(taskId),
      user_id: new Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  } catch (err) {
    throw ModelErrorHandler(err as Error);
  }
};

taskSchema.statics.getStatsForUser = async function (
  userId: string | Types.ObjectId,
): Promise<stats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const [pending, inProgress, dueThisWeek, dueToday] = await Promise.all([
      this.countDocuments({
        user_id: new Types.ObjectId(userId),
        _status: reverseStatusMap.pending,
      }),
      this.countDocuments({
        user_id: new Types.ObjectId(userId),
        _status: reverseStatusMap["in-progress"],
      }),
      this.countDocuments({
        user_id: new Types.ObjectId(userId),
        _status: { $ne: reverseStatusMap.done },
        dueDate: { $gte: today, $lt: nextWeek },
      }),
      this.countDocuments({
        user_id: new Types.ObjectId(userId),
        _status: { $ne: reverseStatusMap.done },
        dueDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    return { pending, inProgress, dueThisWeek, dueToday };
  } catch (err) {
    throw ModelErrorHandler(err as ErrorType);
  }
};

export const Task = (models.Task as TaskModel) || model<TaskDoc, TaskModel>("Task", taskSchema);
