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
  Error,
} from "mongoose";
import AppError from "../utils/AppError";

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

interface TaskModel extends Model<TaskDoc, empty, TaskVirtual> {
  getAllActiveTasksForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Types.Array<TaskDoc>>;
  getAllDoneTasksForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Types.Array<TaskDoc>>;
  updateTask(
    taskId: string,
    userId: string,
    updates: UpdateQuery<TaskDoc>,
  ): Promise<boolean>;
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

/**
 * Gets all active tasks for a specific user with pagination.
 * Active Tasks are defined as: 'in-progress' or 'pending'.
 * * @param {string} userId - The _id of the User (usually from JWT).
 * @param {number} [page=1] - The current page for pagination, default = 1
 * @param {number} [limit=20] - The number of records per page, default = 20
 * @returns {Promise<Types.Array<Object>>} - A promise that resolves to an array of task objects.
 */
taskSchema.statics.getAllActiveTasksForUser = async function (
  userId: string,
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;
  const activeTasks = await this.find({
    user_id: new Types.ObjectId(userId),
    _status: {
      $in: [reverseStatusMap.pending, reverseStatusMap["in-progress"]],
    },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit as number)
    .lean();
  return activeTasks;
};

/**
 * This is for get the all done tasks ( status: done ) for a user with peginations
 * * @param {string} userId - The _id of the User (usually from JWT).
 * @param {number} [page=1] - The current page for pagination, default = 1
 * @param {number} [limit=20] - The number of records per page, default = 20
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of task objects.
 */
taskSchema.statics.getDoneTasksForUser = async function (
  userId: string,
  page = 1,
  limit = 20,
) {
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
};

taskSchema.statics.updateTask = async function (
  userId: string,
  taskId: string,
  options: UpdateQuery<TaskDoc>,
) {
  try {
    const result = await this.updateOne(
      { _id: new Types.ObjectId(taskId), user_id: new Types.ObjectId(userId) },
      { $set: { ...options } },
    );
    return result.matchedCount > 0;
  } catch (err) {
    if (err instanceof Error.ValidationError)
      throw new AppError(err.message, err.message, 400);
    else if (err instanceof Error.CastError)
      throw new AppError(err.message, err.message, 400);
    else if (err instanceof Error)
      throw new AppError(err.message, "Internal Server Error", 500);
    else
      throw new AppError(
        "Unknown Error on update of Task",
        "Internal Server Error",
        500,
      );
  }
};

export const Task = model<TaskDoc, TaskModel>("Task", taskSchema);
