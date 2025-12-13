import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error(
    "MONGO_URI environment variable is not defined. Please add it to your .env file."
  );
}

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    console.log("✓ MongoDB already connected");
    return mongoose.connection;
  }

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✓ MongoDB connected successfully");
    console.log(`Database: ${mongoose.connection.db.databaseName}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

    return mongoose.connection;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    process.exit(1);
  }
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected");
  }
}
