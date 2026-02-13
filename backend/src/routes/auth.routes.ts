import { Router, Request, Response } from "express";
import validate from "../middleware/validation.middleware.js";
import { login, signup } from "../controllers/auth.controller.js";
import requiredAuth from "../middleware/auth.middleware.js";
import { loginSchema, signupSchema } from "../schema/auth.schema.js";

const router = Router();

router.post("/login", validate(loginSchema), login); //route for login
router.post("/signup", validate(signupSchema), signup); // route for signup
router.post("/test", requiredAuth, (_req: Request, res: Response) => {
  res.status(200).json({ status: "success", error: [] });
}); // route for test

export default router;
