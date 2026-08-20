import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { UserRole } from "../../types";

// Mock database (needed for auth middleware)
jest.mock("../../config/database", () => {
  const handler: any = () => {
    const chain: Record<string, any> = {};
    const methods = [
      "where", "select", "insert", "first", "orderBy", "join",
      "count", "groupBy", "limit", "offset", "returning",
    ];
    for (const m of methods) chain[m] = jest.fn(() => chain);
    chain.then = (resolve: any) => resolve([]);
    chain.first = jest.fn(() => null);
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  return { __esModule: true, default: handler };
});

// Mock global.fetch for AI proxy
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import aiRouter from "../../routes/ai";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/ai", aiRouter);
  return app;
}

function makeToken() {
  return jwt.sign({ userId: "u1", role: UserRole.POLICE }, config.jwt.secret);
}

describe("AI Routes (Backend Proxy)", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("POST /api/ai/analyze/:touristId", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).post("/api/ai/analyze/tourist-1");
      expect(res.status).toBe(401);
    });

    it("proxies to AI service and returns anomaly analysis", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-1",
          anomaly_score: 0.85,
          is_anomaly: true,
          reasons: ["Unusual velocity spike detected", "Off-route movement pattern"],
          recommended_action: "Immediate verification recommended",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.tourist_id).toBe("tourist-1");
      expect(res.body.anomaly_score).toBe(0.85);
      expect(res.body.is_anomaly).toBe(true);
      expect(res.body.reasons).toContain("Unusual velocity spike detected");
    });

    it("returns 500 when AI service is down", async () => {
      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });

    it("returns normal score for normal movement", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-normal",
          anomaly_score: 0.12,
          is_anomaly: false,
          reasons: [],
          recommended_action: "No action required",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-normal")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.is_anomaly).toBe(false);
      expect(res.body.anomaly_score).toBeLessThan(0.5);
    });
  });

  describe("GET /api/ai/tourist/:touristId", () => {
    it("returns analysis history for a tourist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([
          { tourist_id: "t1", anomaly_score: 0.3, is_anomaly: false, created_at: "2026-09-01T10:00:00Z" },
          { tourist_id: "t1", anomaly_score: 0.8, is_anomaly: true, created_at: "2026-09-01T11:00:00Z" },
        ]),
      });

      const token = makeToken();
      const res = await request(app)
        .get("/api/ai/tourist/t1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    it("AI failure returns 500 but does not crash", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "Service unavailable",
      });

      const token = makeToken();
      const res = await request(app)
        .get("/api/ai/tourist/t1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain("503");
    });
  });

  describe("GET /api/ai/stats", () => {
    it("returns AI service statistics", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_analyses: 150,
          anomalies_detected: 12,
          avg_score: 0.34,
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .get("/api/ai/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.total_analyses).toBe(150);
    });
  });

  describe("POST /api/ai/analyze-all", () => {
    it("triggers batch analysis", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ analyzed: 50, anomalies: 3 }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze-all")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.analyzed).toBe(50);
    });
  });
});
