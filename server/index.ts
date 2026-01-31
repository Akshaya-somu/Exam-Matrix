import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer as createHttpServer } from "http";
import { connectMongo } from "./db/connection";
import { seedDatabase } from "./db/seed";

const app = express();

/**
 * IMPORTANT:
 * On Render, DO NOT create HTTPS servers.
 * Render already handles HTTPS.
 */
const httpServer = createHttpServer(app);
console.log("✓ HTTP server started (HTTPS handled)");

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await connectMongo();
  await seedDatabase();
  await registerRoutes(httpServer, app);

  /**
   * ROOT / HEALTH ROUTE
   * This fixes Render 502 when opening the backend URL
   */
  app.get("/health", (_req, res) => {
  res.status(200).send("Exam Matrix Backend is running 🚀");
});
;

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  /**
   * Serve frontend in production
   */
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  /**
   * Render-required port binding
   */
  const port = parseInt(process.env.PORT || "10000", 10);
  const host = "0.0.0.0";

  httpServer.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
