import { Router } from "express";
import validate from "../middleware/validation.middleware.js";
import {
  createTask,
  updateTask,
  getActiveTasks,
  getDoneTasks,
  deleteTask,
  getStats,
} from "../controllers/task.controller.js";
import requiredAuth from "../middleware/auth.middleware.js";
import { createTaskSchema, updateTaskSchema } from "../schema/task.schema.js";

const router = Router();

router.post("/", requiredAuth, validate(createTaskSchema), createTask);
router.put("/:id", requiredAuth, validate(updateTaskSchema), updateTask);
router.delete("/:id", requiredAuth, deleteTask);
router.get("/active", requiredAuth, getActiveTasks);
router.get("/done", requiredAuth, getDoneTasks);
router.get("/stats", requiredAuth, getStats);

export default router;
