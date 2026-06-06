import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "LOCAL_FREE" | "LOCAL_PAID" | "INTL_FREE" | "INTL_PAID" | "ADMIN";
  subscriptionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional for OAuth or mock
    role: {
      type: String,
      enum: ["LOCAL_FREE", "LOCAL_PAID", "INTL_FREE", "INTL_PAID", "ADMIN"],
      default: "LOCAL_FREE",
    },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
