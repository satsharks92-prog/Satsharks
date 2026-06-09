import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "STUDENT";
  country: string;
  region: "LOCAL" | "INTERNATIONAL";
  subscription: "FREE" | "PAID";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["ADMIN", "STUDENT"],
      default: "STUDENT",
    },
    country: {
      type: String,
      required: true,
      default: "Unknown",
    },
    region: {
      type: String,
      enum: ["LOCAL", "INTERNATIONAL"],
      required: true,
      default: "INTERNATIONAL",
    },
    subscription: {
      type: String,
      enum: ["FREE", "PAID"],
      required: true,
      default: "FREE",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      required: true,
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
