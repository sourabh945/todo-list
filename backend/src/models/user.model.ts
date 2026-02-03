// this file contain the model for the user
// the MONGODb is used as the DB

import { Schema, model, Model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError";

interface IUserBase {
  username: string;
  name: string | null;
}

interface IUserDocument extends Document, IUserBase {
  _id: Types.ObjectId;
  password: string;
  __v?: number;
}

export type IUser = IUserBase & { _id: Types.ObjectId };

interface IUserModel extends Model<IUserDocument> {
  findByCredentials(username: string, password: string): Promise<IUser>;
}

const userSchema = new Schema<IUserDocument, IUserModel>({
  username: {
    type: String,
    required: true,
    unique: true,
    maxLength: 10,
    match: [
      /^[A-Za-z0-9]+$/,
      "username {VALUE} is not follow the username regex [A-Za-z0-9]{10}",
    ],
  },
  name: { type: String },
  password: { type: String, required: true },
});

// Hashing Function ( run before saving )
userSchema.pre<IUserDocument>("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.statics.findByCredentials = async function (
  username: string,
  password: string,
): Promise<IUser> {
  const user = await this.findOne({ username }).select("+password").lean();
  if (!user)
    throw new AppError(
      "Invalid login credenitals",
      "Invalid login credenitals",
      401,
    );
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    throw new AppError(
      "Invalid login credenitals",
      "Invalid login credenitals",
      401,
    );
  const { password: __, __v: ___, ...userWithoutPassword } = user;
  return userWithoutPassword as IUser;
};

export const User = model<IUserDocument, IUserModel>("User", userSchema);
