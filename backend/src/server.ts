import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";

import { config } from "./config";
import { errorHandler, notFound } from "./middleware";
import {
  authRoutes,
  touristRoutes,
  alertRoutes,
  zoneRoutes,
  efirRoutes,
  dashboardRoutes,
} from "./routes";

const app = express();
const httpServer = createServer(app);

// Socket.io
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", touristRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/efirs", efirRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
