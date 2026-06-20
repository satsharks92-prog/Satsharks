import mongoose, { Schema, Document } from "mongoose";

export interface IQuestionOption {
  label: string;
  text: string;
}

export interface IQuestion extends Document {
  text: string;
  options: IQuestionOption[];
  correctAnswer: string;
  explanation: string;
  category: mongoose.Types.ObjectId;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  section: "READING_WRITING" | "MATH";
  tags: string[];
  source: "MANUAL" | "AI_EXTRACTED";
  status: "DRAFT" | "REVIEW" | "PUBLISHED";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    text: { type: String, required: true },
    options: [
      {
        label: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctAnswer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },
    explanation: { type: String, default: "" },
    category: {
      type: Schema.Types.ObjectId,
      ref: "QuestionCategory",
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      required: true,
    },
    section: {
      type: String,
      enum: ["READING_WRITING", "MATH"],
      required: true,
    },
    tags: [{ type: String }],
    source: {
      type: String,
      enum: ["MANUAL", "AI_EXTRACTED"],
      default: "MANUAL",
    },
    status: {
      type: String,
      enum: ["DRAFT", "REVIEW", "PUBLISHED"],
      default: "DRAFT",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

QuestionSchema.index({ category: 1, difficulty: 1 });
QuestionSchema.index({ section: 1, status: 1 });
QuestionSchema.index({ tags: 1 });

export default mongoose.model<IQuestion>("Question", QuestionSchema);
