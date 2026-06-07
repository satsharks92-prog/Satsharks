import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "STUDENT";
  region?: "LOCAL" | "INTERNATIONAL";
  subscription?: "FREE" | "PAID";
  isActive: boolean;
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
    region: {
      type: String,
      enum: ["LOCAL", "INTERNATIONAL"],
      required: function (this: any) {
        return this.role === "STUDENT";
      },
    },
    subscription: {
      type: String,
      enum: ["FREE", "PAID"],
      required: function (this: any) {
        return this.role === "STUDENT";
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
