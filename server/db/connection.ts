import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://somuakshaya14_db_user:jBHxiCKRqKkvpAmz@cluster0.b8vqdb4.mongodb.net/exam-matrix?retryWrites=true&w=majority&appName=Cluster0";

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    console.log("✓ MongoDB already connected");
    return mongoose.connection;
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✓ MongoDB connected successfully");
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    return mongoose.connection;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    throw error;
  }
}
