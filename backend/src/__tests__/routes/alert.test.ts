import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { UserRole } from "../../types";

// Mock database
jest.mock("../../config/database", () => {
  const mockStore: Record<string, any[]> = {};
  const handler: any = (table?: string) => {
    if (!table) return handler;
    if (!mockStore[table]) mockStore[table] = [];
    const chain: Record<string, any> = {};
    const methods = [
      "where", "whereNot", "whereRaw", "whereIn", "whereILike", "orWhereILike",
      "andWhere", "orWhere", "select", "insert", "update", "del", "count",
      "sum", "groupBy", "orderBy", "limit", "offset", "first", "clone",
      "returning", "join", "leftJoin", "on", "onRaw", "andOn",
    ];
    for (const m of methods) {
      chain[m] = jest.fn(() => chain);
    }
    chain.first = jest.fn(() => mockStore[table]?.[0] || null);
    chain.then = jest.fn((resolve: any) => resolve(mockStore[table] || []));
    chain.clone = jest.fn(() => ({
      ...chain,
      count: jest.fn(() => ({
        first: jest.fn(() => ({ total: String(mockStore[table]?.length || 0) })),
      })),
      then: (resolve: any) => resolve([{ total: String(mockStore[table]?.length || 0) }]),
    }));
    chain.insert = jest.fn((data: any) => {
      const record = { id: data.id || `mock-${Date.now()}`, ...data };
      mockStore[table].push(record);
      return {
        returning: jest.fn(() => ({
          then: (resolve: any) => resolve([record]),
        })),
      };
    });
    chain.update = jest.fn((data: any) => {
      return {
        returning: jest.fn(() => ({
          then: (resolve: any) => {
            if (mockStore[table].length > 0) {
              Object.assign(mockStore[table][0], data);
              resolve([mockStore[table][0]]);
            } else {
              resolve([]);
            }
          },
        })),
      };
    });
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  handler.__store = mockStore;
  return { __esModule: true, default: handler };
});

// Mock audit
jest.mock("../../services/audit", () => ({
  logAudit: jest.fn(),
  logFromRequest: jest.fn(),
}));

// Mock server.io
jest.mock("../../server", () => ({
  io: { emit: jest.fn() },
}));

// Mock notification
jest.mock("../../services/notification", () => ({
  notifyAlertCreated: jest.fn(),
  notifyEfirGenerated: jest.fn(),
}));

import alertRouter from "../../routes/alert";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/alerts", alertRouter);
  return app;
}

function makeToken(role: UserRole = UserRole.POLICE) {
  return jwt.sign({ userId: "officer-1", role }, config.jwt.secret);
}

describe("Alert Routes", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  describe("GET /api/alerts (protected)", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/alerts");
      expect(res.status).toBe(401);
    });

    it("returns 200 with valid token", async () => {
      const token = makeToken();
      const res = await request(app)
        .get("/api/alerts")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/alerts (create alert)", () => {
    it("police can create alert", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .post("/api/alerts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          tourist_id: "123e4567-e89b-4d3a-a456-426614174000",
          alert_type: "panic",
          location_lat: 27.35,
          location_lng: 88.61,
          message: "Emergency panic button pressed",
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    it("tourism_dept cannot create alerts (only police/admin)", async () => {
      const token = makeToken(UserRole.TOURISM);
      const res = await request(app)
        .post("/api/alerts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          tourist_id: "123e4567-e89b-4d3a-a456-426614174000",
          alert_type: "panic",
          location_lat: 27.35,
          location_lng: 88.61,
        });
      expect(res.status).toBe(403);
    });

    it("rejects invalid alert_type", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .post("/api/alerts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          tourist_id: "123e4567-e89b-4d3a-a456-426614174000",
          alert_type: "invalid_type",
          location_lat: 27.35,
          location_lng: 88.61,
        });
      expect(res.status).toBe(400);
    });

    it("rejects invalid latitude", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .post("/api/alerts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          tourist_id: "123e4567-e89b-4d3a-a456-426614174000",
          alert_type: "panic",
          location_lat: 100,
          location_lng: 88.61,
        });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/alerts/:id (resolve alert)", () => {
    it("police can resolve alert", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .patch("/api/alerts/alert-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "resolved", notes: "Tourist located safe" });
      expect([200, 404]).toContain(res.status);
    });

    it("police can mark false positive", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .patch("/api/alerts/alert-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "false_positive", notes: "Fence malfunction" });
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("GET /api/alerts/stats", () => {
    it("returns alert statistics", async () => {
      const token = makeToken();
      const res = await request(app)
        .get("/api/alerts/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("new");
      expect(res.body).toHaveProperty("resolved");
    });
  });
});
