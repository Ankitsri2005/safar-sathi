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
      "where", "whereNot", "whereRaw", "whereIn", "select", "insert",
      "update", "del", "count", "groupBy", "orderBy", "limit", "offset",
      "first", "clone", "returning", "join", "on", "onRaw", "whereILike", "orWhereILike",
    ];
    for (const m of methods) {
      chain[m] = jest.fn(() => chain);
    }
    chain.first = jest.fn(() => mockStore[table]?.[0] || null);
    chain.then = jest.fn((resolve: any) => resolve(mockStore[table] || []));
    chain.clone = jest.fn(() => chain);
    chain.insert = jest.fn((data: any) => {
      const record = { id: data.id || `mock-${Date.now()}`, ...data };
      mockStore[table].push(record);
      return {
        returning: jest.fn(() => ({
          then: (resolve: any) => resolve([record]),
        })),
      };
    });
    chain.update = jest.fn(() => ({
      returning: jest.fn(() => ({
        then: (resolve: any) => resolve([mockStore[table]?.[0] || {}]),
      })),
    }));
    chain.del = jest.fn(() => 1);
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

import zoneRouter from "../../routes/zone";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/zones", zoneRouter);
  return app;
}

function makeToken(role: UserRole = UserRole.ADMIN) {
  return jwt.sign({ userId: "admin-1", role }, config.jwt.secret);
}

describe("Zone Routes", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  describe("GET /api/zones (protected)", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/zones");
      expect(res.status).toBe(401);
    });

    it("returns 200 for authenticated user", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .get("/api/zones")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/zones (admin only)", () => {
    it("admin can create zone", async () => {
      const token = makeToken(UserRole.ADMIN);
      const res = await request(app)
        .post("/api/zones")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Restricted Military Area",
          risk_level: "restricted",
          description: "No tourist entry allowed",
          polygon_geojson: JSON.stringify({
            type: "Polygon",
            coordinates: [[[88.5, 27.3], [88.7, 27.3], [88.7, 27.5], [88.5, 27.5], [88.5, 27.3]]],
          }),
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Restricted Military Area");
      expect(res.body.risk_level).toBe("restricted");
    });

    it("police cannot create zone", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .post("/api/zones")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Zone",
          risk_level: "medium",
          polygon_geojson: "{}",
        });
      expect(res.status).toBe(403);
    });

    it("rejects invalid risk_level", async () => {
      const token = makeToken(UserRole.ADMIN);
      const res = await request(app)
        .post("/api/zones")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Zone",
          risk_level: "extreme",
          polygon_geojson: "{}",
        });
      expect(res.status).toBe(400);
    });

    it("rejects missing name", async () => {
      const token = makeToken(UserRole.ADMIN);
      const res = await request(app)
        .post("/api/zones")
        .set("Authorization", `Bearer ${token}`)
        .send({
          risk_level: "medium",
          polygon_geojson: "{}",
        });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/zones/check", () => {
    it("returns 400 without lat/lng", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .get("/api/zones/check")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("returns zone check result", async () => {
      const token = makeToken(UserRole.POLICE);
      const res = await request(app)
        .get("/api/zones/check?lat=27.35&lng=88.61")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("PUT /api/zones/:id (admin only)", () => {
    it("admin can update zone", async () => {
      const token = makeToken(UserRole.ADMIN);
      const res = await request(app)
        .put("/api/zones/zone-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Zone" });
      expect([200, 404]).toContain(res.status);
    });

    it("tourism cannot update zone", async () => {
      const token = makeToken(UserRole.TOURISM);
      const res = await request(app)
        .put("/api/zones/zone-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hacked Zone" });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/zones/:id (admin only)", () => {
    it("admin can delete zone", async () => {
      const token = makeToken(UserRole.ADMIN);
      const res = await request(app)
        .delete("/api/zones/zone-1")
        .set("Authorization", `Bearer ${token}`);
      expect([200, 404]).toContain(res.status);
    });
  });
});
