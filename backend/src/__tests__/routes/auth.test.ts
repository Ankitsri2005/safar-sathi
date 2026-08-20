import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../../config";
import { UserRole } from "../../types";

// Mock the database module
jest.mock("../../config/database", () => {
  const mockUser: Record<string, any> = {};
  const handler: any = (table?: string) => {
    const t = table || "unknown";
    const chain: Record<string, any> = {};
    const methods = [
      "where", "whereNot", "whereRaw", "whereIn", "select", "insert",
      "update", "del", "count", "groupBy", "orderBy", "limit", "offset",
      "first", "clone", "returning", "join", "on", "onRaw",
    ];
    for (const m of methods) {
      chain[m] = jest.fn(() => chain);
    }
    chain.then = (resolve: any) => resolve([mockUser[t] || {}]);
    chain.first = jest.fn(() => mockUser[t] || null);
    chain.insert = jest.fn(() => ({
      ...chain,
      returning: jest.fn(() => ({
        then: (resolve: any) => resolve([{ id: "new-id", ...mockUser[t] }]),
      })),
    }));
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  handler.__mockUser = mockUser;
  return { __esModule: true, default: handler };
});

// Mock audit service
jest.mock("../../services/audit", () => ({
  logAudit: jest.fn(),
  logFromRequest: jest.fn(),
}));

import authRouter from "../../routes/auth";
import db from "../../config/database";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  return app;
}

describe("Auth Routes", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    const mockUser = (db as any).__mockUser;
    delete mockUser["users"];
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 if username missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "test" });
      expect(res.status).toBe(400);
    });

    it("returns 400 if password missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin" });
      expect(res.status).toBe(400);
    });

    it("returns 401 for invalid credentials (user not found)", async () => {
      const mockUser = (db as any).__mockUser;
      mockUser["users"] = null;
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "wrongpass" });
      expect(res.status).toBe(401);
    });

    it("returns 401 for wrong password", async () => {
      const hash = await bcrypt.hash("correctpass", 12);
      const mockUser = (db as any).__mockUser;
      mockUser["users"] = {
        id: "user-1",
        username: "admin",
        password_hash: hash,
        full_name: "Admin User",
        role: UserRole.ADMIN,
        jurisdiction: "Sikkim",
        is_active: true,
      };
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "wrongpass" });
      expect(res.status).toBe(401);
    });

    it("returns 403 for deactivated account", async () => {
      const hash = await bcrypt.hash("pass123", 12);
      const mockUser = (db as any).__mockUser;
      mockUser["users"] = {
        id: "user-1",
        username: "admin",
        password_hash: hash,
        full_name: "Admin User",
        role: UserRole.ADMIN,
        jurisdiction: "Sikkim",
        is_active: false,
      };
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "pass123" });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/deactivated/i);
    });

    it("returns token and user on successful login", async () => {
      const hash = await bcrypt.hash("pass123", 12);
      const mockUser = (db as any).__mockUser;
      mockUser["users"] = {
        id: "user-1",
        username: "admin",
        password_hash: hash,
        full_name: "Admin User",
        role: UserRole.ADMIN,
        jurisdiction: "Sikkim",
        is_active: true,
      };
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "pass123" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe("admin");
      expect(res.body.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    it("returns user info with valid token", async () => {
      const token = jwt.sign(
        { userId: "user-1", role: UserRole.ADMIN },
        config.jwt.secret
      );
      const mockUser = (db as any).__mockUser;
      mockUser["users"] = {
        id: "user-1",
        username: "admin",
        full_name: "Admin User",
        role: UserRole.ADMIN,
        jurisdiction: "Sikkim",
      };
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.username).toBe("admin");
    });
  });

  describe("GET /api/auth/users (admin only)", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/auth/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin role", async () => {
      const token = jwt.sign(
        { userId: "officer-1", role: UserRole.POLICE },
        config.jwt.secret
      );
      const res = await request(app)
        .get("/api/auth/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("returns 200 for admin role", async () => {
      const token = jwt.sign(
        { userId: "admin-1", role: UserRole.ADMIN },
        config.jwt.secret
      );
      const mockUser = (db as any).__mockUser;
      mockUser["users"] = [
        { id: "u1", username: "admin", role: UserRole.ADMIN },
      ];
      const res = await request(app)
        .get("/api/auth/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
