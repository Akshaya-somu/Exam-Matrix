import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server as IOServer } from "socket.io";
import QRCode from "qrcode";
import { networkInterfaces } from "os";
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

// Get local network IP address
function getLocalIP(): string {
  const nets = networkInterfaces();

  // Prioritize WiFi and Ethernet adapters, skip virtual adapters
  const preferredNames = ["Wi-Fi", "WiFi", "Ethernet", "eth0", "en0", "wlan0"];

  // First pass: look for preferred adapter names
  for (const name of Object.keys(nets)) {
    const lowerName = name.toLowerCase();
    const isPreferred = preferredNames.some((pref) =>
      lowerName.includes(pref.toLowerCase())
    );

    if (isPreferred) {
      const netInfo = nets[name];
      if (!netInfo) continue;

      for (const net of netInfo) {
        // Skip internal (loopback), non-IPv4, and link-local addresses
        if (
          net.family === "IPv4" &&
          !net.internal &&
          !net.address.startsWith("169.254")
        ) {
          return net.address;
        }
      }
    }
  }

  // Second pass: accept any non-virtual adapter
  for (const name of Object.keys(nets)) {
    const lowerName = name.toLowerCase();
    // Skip known virtual adapters
    if (
      lowerName.includes("vmware") ||
      lowerName.includes("virtualbox") ||
      lowerName.includes("vethernet") ||
      lowerName.includes("hyper-v") ||
      lowerName.includes("docker")
    ) {
      continue;
    }

    const netInfo = nets[name];
    if (!netInfo) continue;

    for (const net of netInfo) {
      if (
        net.family === "IPv4" &&
        !net.internal &&
        !net.address.startsWith("169.254")
      ) {
        return net.address;
      }
    }
  }

  return "localhost";
}

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

  // Store active video streams by session ID
  const activeStreams = new Map<
    string,
    { studentId: string; examId: string; streams: Set<string> }
  >();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // WebRTC signaling for phone camera
    socket.on(
      "phone:connect",
      (data: { sessionId: string; studentId: string; examId: string }) => {
        console.log("Phone connecting:", data.sessionId);
        if (!activeStreams.has(data.sessionId)) {
          activeStreams.set(data.sessionId, {
            studentId: data.studentId,
            examId: data.examId,
            streams: new Set([socket.id]),
          });
        } else {
          activeStreams.get(data.sessionId)?.streams.add(socket.id);
        }
        socket.join(`exam:${data.examId}`);
        socket.join(`session:${data.sessionId}`);
        io.to(`exam:${data.examId}`).emit("student:stream:ready", {
          sessionId: data.sessionId,
          studentId: data.studentId,
          socketId: socket.id,
        });
      }
    );

    // WebRTC offer/answer signaling
    socket.on(
      "webrtc:offer",
      (data: { to: string; offer: any; sessionId: string }) => {
        socket.to(data.to).emit("webrtc:offer", {
          from: socket.id,
          offer: data.offer,
          sessionId: data.sessionId,
        });
      }
    );

    socket.on("webrtc:answer", (data: { to: string; answer: any }) => {
      socket.to(data.to).emit("webrtc:answer", {
        from: socket.id,
        answer: data.answer,
      });
    });

    socket.on(
      "webrtc:ice-candidate",
      (data: { to: string; candidate: any }) => {
        socket.to(data.to).emit("webrtc:ice-candidate", {
          from: socket.id,
          candidate: data.candidate,
        });
      }
    );

    // Student stream started
    socket.on(
      "stream:started",
      (data: { sessionId: string; type: "webcam" | "phone" }) => {
        io.to(`session:${data.sessionId}`).emit("stream:update", {
          sessionId: data.sessionId,
          type: data.type,
          active: true,
        });
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // Clean up streams
      for (const [sessionId, data] of activeStreams.entries()) {
        if (data.streams.has(socket.id)) {
          data.streams.delete(socket.id);
          if (data.streams.size === 0) {
            activeStreams.delete(sessionId);
          }
          io.to(`exam:${data.examId}`).emit("student:stream:disconnected", {
            sessionId,
            socketId: socket.id,
          });
        }
      }
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
    "/api/questions",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const question = await QuestionModel.create(req.body);
      res.status(201).json(question);
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

  // Generate QR code for phone camera connection
  app.get(
    "/api/sessions/:id/qrcode",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const sessionId = req.params.id;
      const session = await SessionModel.findById(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Generate connection URL with local network IP
      const port = process.env.PORT || "3000";
      const localIP = getLocalIP();
      const baseUrl = process.env.BASE_URL || `http://${localIP}:${port}`;
      const connectionUrl = `${baseUrl}/phone-camera/${sessionId}`;

      try {
        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(connectionUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        res.json({ qrCode: qrCodeDataUrl, url: connectionUrl });
      } catch (error) {
        console.error("QR code generation error:", error);
        res.status(500).json({ message: "Failed to generate QR code" });
      }
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
