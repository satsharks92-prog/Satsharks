import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../src/models/User";

dotenv.config();

const users = [
  {
    name: "Admin User",
    email: "admin@satsharks.com",
    password: "password123",
    role: "ADMIN",
    isActive: true,
  },
  {
    name: "Local Free",
    email: "localfree@test.com",
    password: "password123",
    role: "STUDENT",
    region: "LOCAL",
    subscription: "FREE",
    isActive: true,
  },
  {
    name: "Local Paid",
    email: "localpaid@test.com",
    password: "password123",
    role: "STUDENT",
    region: "LOCAL",
    subscription: "PAID",
    isActive: true,
  },
  {
    name: "International Free",
    email: "internationalfree@test.com",
    password: "password123",
    role: "STUDENT",
    region: "INTERNATIONAL",
    subscription: "FREE",
    isActive: true,
  },
  {
    name: "International Paid",
    email: "internationalpaid@test.com",
    password: "password123",
    role: "STUDENT",
    region: "INTERNATIONAL",
    subscription: "PAID",
    isActive: true,
  },
];

const seedDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("No DATABASE_URL found. Skipping seed.");
      process.exit(0);
    }
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Insert new
    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, password: hashed });
      console.log(`Created user: ${u.email}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
};

seedDB();
