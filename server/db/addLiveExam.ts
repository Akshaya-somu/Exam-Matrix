import { connectMongo } from "./connection";
import { ExamModel, QuestionModel } from "./models";

async function addLiveExam() {
  await connectMongo();

  console.log("🔍 Checking for existing live exams...");

  const existingLive = await ExamModel.findOne({ status: "live" });

  if (existingLive) {
    console.log("✓ Live exam already exists:", existingLive.name);

    // Check if questions exist
    const questionCount = await QuestionModel.countDocuments({
      examId: existingLive._id,
    });
    if (questionCount === 0) {
      console.log("➕ Adding questions to existing exam...");
      await addQuestionsToExam(existingLive._id);
    } else {
      console.log(`✓ Exam has ${questionCount} questions`);
    }

    console.log("\n📝 You can start this exam now!");
    process.exit(0);
    return;
  }

  console.log("➕ Creating new live exam...");

  const now = new Date();
  const examEnd = new Date(now);
  examEnd.setHours(now.getHours() + 2);

  const liveExam = await ExamModel.create({
    name: "Live Mathematics Test",
    startAt: now,
    endAt: examEnd,
    durationMinutes: 120,
    status: "live",
  });

  console.log("✅ Live exam created successfully!");
  console.log("➕ Adding questions to exam...");

  await addQuestionsToExam(liveExam._id);

  console.log("\n=== EXAM DETAILS ===");
  console.log("Name:", liveExam.name);
  console.log("Status: LIVE 🔴");
  console.log("Duration:", liveExam.durationMinutes, "minutes");
  console.log("Questions: 5");
  console.log("\n🎓 Login as student (student/student123) to start the exam!");

  process.exit(0);
}

async function addQuestionsToExam(examId: any) {
  const questions = [
    {
      examId,
      questionText: "What is the value of π (pi) to two decimal places?",
      questionType: "short_answer",
      points: 10,
      order: 1,
    },
    {
      examId,
      questionText:
        "Solve for x: 2x + 5 = 15. Show your work and explain each step.",
      questionType: "essay",
      points: 15,
      order: 2,
    },
    {
      examId,
      questionText:
        "What is the Pythagorean theorem? Explain its applications in real life.",
      questionType: "essay",
      points: 20,
      order: 3,
    },
    {
      examId,
      questionText:
        "Calculate the area of a circle with radius 7 cm. (Use π = 3.14)",
      questionType: "short_answer",
      points: 15,
      order: 4,
    },
    {
      examId,
      questionText:
        "Explain the difference between mean, median, and mode. Provide an example for each.",
      questionType: "essay",
      points: 20,
      order: 5,
    },
  ];

  await QuestionModel.insertMany(questions);
  console.log("✓ Added 5 questions to the exam");
}

addLiveExam().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
