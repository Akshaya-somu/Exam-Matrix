import bcrypt from "bcryptjs";
import { connectMongo } from "./connection";
import { UserModel, StudentModel, ExamModel } from "./models";

export async function seedDatabase() {
  await connectMongo();

  // Check if data already exists
  const userCount = await UserModel.countDocuments();
  if (userCount > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  await UserModel.create({
    username: "admin",
    passwordHash: adminPassword,
    role: "admin",
  });

  // Create proctor user
  const proctorPassword = await bcrypt.hash("proctor123", 10);
  await UserModel.create({
    username: "proctor",
    passwordHash: proctorPassword,
    role: "proctor",
  });

  // Create student user
  const studentPassword = await bcrypt.hash("student123", 10);
  await UserModel.create({
    username: "student",
    passwordHash: studentPassword,
    role: "student",
  });

  // Create sample students
  await StudentModel.create([
    {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
    },
    {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+1234567891",
    },
  ]);

  // Create sample exam
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const examEnd = new Date(tomorrow);
  examEnd.setHours(12, 0, 0, 0);

  await ExamModel.create({
    name: "Mathematics Mid-term Exam",
    startAt: tomorrow,
    endAt: examEnd,
    durationMinutes: 120,
    status: "upcoming",
  });

  console.log("✓ Database seeded successfully!");
  console.log("\nDefault credentials:");
  console.log("Admin - username: admin, password: admin123");
  console.log("Proctor - username: proctor, password: proctor123");
  console.log("Student - username: student, password: student123");
}
