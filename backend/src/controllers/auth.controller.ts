// this file contain the controllers for the login and signup of the user
//
import { Request, Response } from "express";
import User from "../models/user.model";
import catchAsync from "../utils/catchAsync.error.util";
import { signToken } from "../utils/token.auth.util";

export const signup = catchAsync(async (req: Request, res: Response) => {
  const { username, name, password } = req.body as {
    username: string;
    name: string;
    password: string;
  };

  const user = await User.create({ username, name, password });

  const token = signToken({
    id: String(user._id),
    username: String(user.username),
  });

  res.status(201).json({
    status: "success",
    token,
    data: {
      username: user.username,
      name: user.name,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username: string;
    password: string;
  };

  const user = await User.findByCredentials(username, password);

  const token = signToken({
    id: String(user._id),
    username: String(user.username),
  });

  res.status(200).json({
    status: "success",
    token,
    data: {
      username: user.username,
      name: user.name,
    },
  });
});
