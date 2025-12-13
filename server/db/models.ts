import mongoose, { Schema, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "proctor", "student"],
      default: "admin",
    },
  },
  { timestamps: true }
);

const StudentSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
  },
  { timestamps: true }
);

const ExamSchema = new Schema(
  {
    name: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    status: {
      type: String,
      enum: ["upcoming", "live", "finished"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

const SessionSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "flagged"],
      default: "pending",
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    deviceLinks: {
      laptopStreamUrl: { type: String },
      phoneStreamUrl: { type: String },
    },
    lastHeartbeat: { type: Date },
  },
  { timestamps: true }
);

const AlertSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    type: {
      type: String,
      enum: ["tab_switch", "multiple_faces", "absent", "phone_detected"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const EventSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const DeviceSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    kind: { type: String, enum: ["laptop", "phone"], required: true },
    lastSeenAt: { type: Date },
    streamUrl: { type: String },
  },
  { timestamps: true }
);

const QuestionSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["multiple_choice", "short_answer", "essay"],
      default: "essay",
    },
    options: [{ type: String }],
    correctAnswer: { type: String },
    points: { type: Number, default: 10 },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

const AnswerSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    answerText: { type: String },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model("User", UserSchema);
export const StudentModel =
  mongoose.models.Student || mongoose.model("Student", StudentSchema);
export const ExamModel =
  mongoose.models.Exam || mongoose.model("Exam", ExamSchema);
export const SessionModel =
  mongoose.models.Session || mongoose.model("Session", SessionSchema);
export const AlertModel =
  mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
export const EventModel =
  mongoose.models.Event || mongoose.model("Event", EventSchema);
export const DeviceModel =
  mongoose.models.Device || mongoose.model("Device", DeviceSchema);
export const QuestionModel =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);
export const AnswerModel =
  mongoose.models.Answer || mongoose.model("Answer", AnswerSchema);

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type StudentDoc = InferSchemaType<typeof StudentSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ExamDoc = InferSchemaType<typeof ExamSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type SessionDoc = InferSchemaType<typeof SessionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type AlertDoc = InferSchemaType<typeof AlertSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type EventDoc = InferSchemaType<typeof EventSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type DeviceDoc = InferSchemaType<typeof DeviceSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type QuestionDoc = InferSchemaType<typeof QuestionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type AnswerDoc = InferSchemaType<typeof AnswerSchema> & {
  _id: mongoose.Types.ObjectId;
};
