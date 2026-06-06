import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not found in .env. Running with mock data services.");
      return false;
    }
    
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("MongoDB Connected");
    return true;
  } catch (error) {
    console.error("MongoDB Connection Error: ", error);
    process.exit(1);
  }
};
