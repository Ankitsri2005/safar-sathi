import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";

import { config } from "./config";
import { errorHandler, notFound } from "./middleware";
import { apiLimiter, authLimiter, publicLimiter } from "./middleware/rateLimiter";
import { authenticate } from "./middleware/auth";
import {
  authRoutes,
  touristRoutes,
  alertRoutes,
  zoneRoutes,
  efirRoutes,
  dashboardRoutes,
} from "./routes";
import aiRoutes from "./routes/ai";
import notificationRoutes from "./routes/notification";
import userManagerRoutes from "./routes/userManager";
import trackingRoutes from "./routes/tracking";
import { evaluateAllRules } from "./services/ruleEngine";
import { runEscalationCheck } from "./services/escalation";
import { runRetentionCleanup } from "./services/retention";

const app = express();
const httpServer = createServer(app);

// Socket.io
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ── Security Middleware ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(morgan("combined")); // "combined" logs more details than "dev" for security auditing
app.use(express.json({ limit: "1mb" })); // Reduced from 10mb
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ── Rate Limiting ────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ── Secure Static Files (require auth for /uploads/efirs/) ───────
app.use("/uploads/efirs", authenticate, (req: Request, res: Response, next: NextFunction) => {
  // Authentication already applied via authenticate middleware above.
  // Further restrict: only admin, police, tourism can download EFIR PDFs
  const role = req.user?.role;
  if (role !== "admin" && role !== "police" && role !== "tourism_dept") {
    return res.status(403).json({ error: "Insufficient permissions to download E-FIR" });
  }
  next();
}, express.static(path.resolve(__dirname, "../uploads/efirs")));

// Serve other uploads (avatars, etc.) with basic auth
app.use("/uploads", authenticate, express.static(path.resolve(__dirname, "../uploads")));

// ── API Routes (with role-appropriate rate limiting) ──────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", publicLimiter, touristRoutes);  // tourist routes include public registration
app.use("/api/alerts", alertRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/efirs", efirRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userManagerRoutes);
app.use("/api/tracking", trackingRoutes);

// Health check (unauthenticated, no rate limit)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`JWT expires in: ${config.jwt.expiresIn}`);
  console.log(`CORS origin: ${config.cors.origin}`);

  // Run rule engine every 60 seconds
  setInterval(async () => {
    try {
      await evaluateAllRules();
    } catch (err) {
      console.error("Rule engine error:", err);
    }
  }, 60000);

  // Run AI analysis every 5 minutes via ai-service
  setInterval(async () => {
    try {
      const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";
      await fetch(`${AI_URL}/api/analyze/batch`, { method: "POST" });
    } catch (err) {
      console.error("AI analysis error:", err);
    }
  }, 300000);

  // Run escalation check every 2 minutes
  setInterval(async () => {
    try {
      await runEscalationCheck();
    } catch (err) {
      console.error("Escalation check error:", err);
    }
  }, 120000);

  // Run data retention cleanup every 6 hours
  setInterval(async () => {
    try {
      await runRetentionCleanup();
    } catch (err) {
      console.error("Retention cleanup error:", err);
    }
  }, 6 * 60 * 60 * 1000);
});

export default app;
