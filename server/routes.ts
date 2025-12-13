import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server as IOServer } from "socket.io";
import { connectMongo } from "./db/connection";
import {
  UserModel,
  StudentModel,
  ExamModel,
  SessionModel,
  AlertModel,
  EventModel,
  QuestionModel,
  AnswerModel,
} from "./db/models";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "15m";
const JWT_REFRESH_EXPIRES_IN = "7d";

type AuthPayload = {
  sub: string;
  role: string;
  username: string;
  type?: "refresh";
};

function signTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ ...payload, type: "refresh" }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ message: "Missing Authorization header" });
  const token = header.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectMongo();

  const io = new IOServer(httpServer, {
    path: "/ws",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("join", (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  app.post(
    "/api/auth/login",
    asyncHandler(async (req: Request, res: Response) => {
      const { username, password } = req.body;
      if (!username || !password)
        return res
          .status(400)
          .json({ message: "Username and password required" });

      const user = await UserModel.findOne({ username });
      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      const tokens = signTokens({
        sub: user.id,
        role: user.role,
        username: user.username,
      });
      res.json({
        user: { id: user.id, username: user.username, role: user.role },
        ...tokens,
      });
    })
  );

  app.post(
    "/api/auth/refresh",
    asyncHandler(async (req: Request, res: Response) => {
      const { refreshToken } = req.body;
      if (!refreshToken)
        return res.status(400).json({ message: "refreshToken required" });
      try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as AuthPayload;
        if (decoded.type !== "refresh") throw new Error("Invalid token type");
        const tokens = signTokens({
          sub: decoded.sub,
          role: decoded.role,
          username: decoded.username,
        });
        return res.json(tokens);
      } catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
    })
  );

  app.post(
    "/api/auth/register",
    asyncHandler(async (req: Request, res: Response) => {
      const { username, password, role } = req.body;
      if (!username || !password)
        return res
          .status(400)
          .json({ message: "Username and password required" });
      const existing = await UserModel.findOne({ username });
      if (existing)
        return res.status(409).json({ message: "Username already exists" });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({
        username,
        passwordHash,
        role: role || "admin",
      });
      res
        .status(201)
        .json({ id: user.id, username: user.username, role: user.role });
    })
  );

  app.get(
    "/api/students",
    authMiddleware,
    asyncHandler(async (_req: Request, res: Response) => {
      const students = await StudentModel.find().sort({ createdAt: -1 }).lean();
      res.json(students);
    })
  );

  app.post(
    "/api/students",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const student = await StudentModel.create(req.body);
      res.status(201).json(student);
    })
  );

  app.get(
    "/api/exams",
    authMiddleware,
    asyncHandler(async (_req: Request, res: Response) => {
      const exams = await ExamModel.find().sort({ startAt: 1 }).lean();
      res.json(exams);
    })
  );

  app.post(
    "/api/exams",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const exam = await ExamModel.create(req.body);
      res.status(201).json(exam);
    })
  );

  app.get(
    "/api/exams/:id",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const exam = await ExamModel.findById(req.params.id).lean();
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      res.json(exam);
    })
  );

  app.get(
    "/api/exams/:id/questions",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const questions = await QuestionModel.find({ examId: req.params.id })
        .sort({ order: 1 })
        .lean();
      res.json(questions);
    })
  );

  app.post(
    "/api/sessions/:id/answers",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const { questionId, answerText } = req.body;
      const answer = await AnswerModel.findOneAndUpdate(
        { sessionId: req.params.id, questionId },
        { answerText, submittedAt: new Date() },
        { upsert: true, new: true }
      );
      res.json(answer);
    })
  );

  app.get(
    "/api/sessions",
    authMiddleware,
    asyncHandler(async (_req: Request, res: Response) => {
      const sessions = await SessionModel.find()
        .populate("examId")
        .populate("studentId")
        .sort({ createdAt: -1 })
        .lean();
      res.json(sessions);
    })
  );

  app.post(
    "/api/sessions",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const session = await SessionModel.create(req.body);
      res.status(201).json(session);
    })
  );

  app.post(
    "/api/sessions/:id/events",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const event = await EventModel.create({
        sessionId: id,
        type: req.body.type,
        payload: req.body.payload,
      });
      // simple alert creation for key types
      if (
        ["tab_switch", "multiple_faces", "absent", "phone_detected"].includes(
          req.body.type
        )
      ) {
        const alert = await AlertModel.create({
          sessionId: id,
          type: req.body.type,
          severity: req.body.severity || "medium",
          meta: req.body.payload,
        });
        io.emit("alert", alert);
      }
      io.to(id).emit("event", event);
      res.status(201).json(event);
    })
  );

  app.get(
    "/api/sessions/:id/alerts",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const alerts = await AlertModel.find({ sessionId: req.params.id })
        .sort({ createdAt: -1 })
        .lean();
      res.json(alerts);
    })
  );

  app.patch(
    "/api/sessions/:id",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const session = await SessionModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      )
        .populate("examId")
        .populate("studentId");
      if (!session)
        return res.status(404).json({ message: "Session not found" });
      io.emit("session:update", session);
      res.json(session);
    })
  );

  app.get(
    "/api/health",
    asyncHandler(async (_req: Request, res: Response) => {
      res.json({ status: "ok", uptime: process.uptime() });
    })
  );

  return httpServer;
}
