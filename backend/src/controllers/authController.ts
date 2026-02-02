// this file contain the controllers for the login and signup of the user
//
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

const signToken = (id: string): string => {
  const expiresIn = +(process.env.JWT_EXPIRES_IN ?? 10) * 24 * 3600 * 100;
  const secret =
    process.env.JWT_SECRET ?? process.env.JWT_PEM_KEY ?? "i love peaches";

  return jwt.sign({ id }, secret, {
    expiresIn: expiresIn,
  });
};

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };
    if (!username || !password) {
      return next(
        new AppError(
          "No Username and No password",
          "Please give the username and the password",
          400,
        ),
      );
    }

    //getting the user using credentials
    const user = await User.findByCredentials(username, password);

    const token = signToken(user._id.toString());

    res.status(200).json({
      status: "sucess",
      token: token,
      username: user.username,
    });
  },
);
