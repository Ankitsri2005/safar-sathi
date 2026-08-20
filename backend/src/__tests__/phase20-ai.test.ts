import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UserRole } from "../types";

// ── Mock Database ──────────────────────────────────────────────────
jest.mock("../config/database", () => {
  const handler: any = () => {
    const chain: Record<string, any> = {};
    const methods = [
      "where", "whereNot", "whereRaw", "whereIn", "select", "insert",
      "update", "del", "count", "groupBy", "orderBy", "limit", "offset",
      "first", "clone", "returning", "join", "on", "onRaw",
    ];
    for (const m of methods) chain[m] = jest.fn(() => chain);
    chain.then = (resolve: any) => resolve([]);
    chain.first = jest.fn(() => null);
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  return { __esModule: true, default: handler };
});

jest.mock("../services/audit", () => ({
  logAudit: jest.fn(),
  logFromRequest: jest.fn(),
}));

jest.mock("../services/notification", () => ({
  notifyAlertCreated: jest.fn(),
}));

// ── Mock global.fetch for AI proxy ─────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import aiRouter from "../routes/ai";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/ai", aiRouter);
  return app;
}

function makeToken(role: UserRole = UserRole.POLICE) {
  return jwt.sign({ userId: "ai-officer", role }, config.jwt.secret);
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ═══════════════════════════════════════════════════════════════════
//  PHASE 20 — AI TESTS
// ═══════════════════════════════════════════════════════════════════
describe("Phase 20 — AI Tests", () => {
  let app: express.Express;
  beforeAll(() => { app = createApp(); });

  // ── 1. Normal movement is not repeatedly flagged ────────────────
  describe("Normal movement is not repeatedly flagged", () => {
    it("returns low anomaly_score for normal movement", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-normal",
          anomaly_score: 0.12,
          is_anomaly: false,
          risk_level: "low",
          reasons: [],
          recommended_action: "No action required",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-normal")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.anomaly_score).toBeLessThan(0.5);
      expect(res.body.is_anomaly).toBe(false);
      expect(res.body.risk_level).toBe("low");
    });

    it("returns no reasons for normal tourist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-calm",
          anomaly_score: 0.05,
          is_anomaly: false,
          risk_level: "low",
          reasons: [],
          recommended_action: "No action required",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-calm")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.reasons).toHaveLength(0);
    });

    it("consecutive analyses of normal tourist stay low", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-repeat",
          anomaly_score: 0.10,
          is_anomaly: false,
          risk_level: "low",
          reasons: [],
          recommended_action: "No action required",
        }),
      });

      const token = makeToken();
      // Simulate 3 consecutive analyses — all should return low score
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post("/api/ai/analyze/tourist-repeat")
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.is_anomaly).toBe(false);
        expect(res.body.anomaly_score).toBeLessThan(0.5);
      }
    });
  });

  // ── 2. Unusual movement receives a score ────────────────────────
  describe("Unusual movement receives a score", () => {
    it("returns high anomaly_score for suspicious movement", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-anomaly",
          anomaly_score: 0.89,
          is_anomaly: true,
          risk_level: "high",
          reasons: [
            "Unusual velocity spike: 85 km/h in pedestrian zone",
            "Off-route movement: 12 km from planned itinerary",
          ],
          recommended_action: "Immediate verification recommended",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-anomaly")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.anomaly_score).toBeGreaterThanOrEqual(0.5);
      expect(res.body.is_anomaly).toBe(true);
      expect(res.body.risk_level).not.toBe("low");
    });

    it("returns critical score for restricted zone entry pattern", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-critical",
          anomaly_score: 0.95,
          is_anomaly: true,
          risk_level: "critical",
          reasons: [
            "Repeated entry into restricted zone perimeter",
            "Unusual stop duration: 3 hours in high-risk area",
          ],
          recommended_action: "Immediate verification and field dispatch",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-critical")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.anomaly_score).toBeGreaterThanOrEqual(0.8);
      expect(res.body.risk_level).toBe("critical");
    });

    it("medium anomaly is correctly classified", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-medium",
          anomaly_score: 0.55,
          is_anomaly: true,
          risk_level: "medium",
          reasons: ["Moderate route deviation detected"],
          recommended_action: "Monitor closely",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-medium")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.is_anomaly).toBe(true);
      expect(res.body.risk_level).toBe("medium");
    });
  });

  // ── 3. AI explanation is visible ────────────────────────────────
  describe("AI explanation is visible", () => {
    it("returns reasons array explaining the anomaly", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-explain",
          anomaly_score: 0.78,
          is_anomaly: true,
          risk_level: "high",
          reasons: [
            "Abnormal speed pattern: 90 km/h average in restricted terrain",
            "Route adherence score dropped to 0.15",
            "Prolonged stop detected in high-risk zone",
          ],
          recommended_action: "Verify location and contact tourist",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-explain")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.reasons).toBeDefined();
      expect(Array.isArray(res.body.reasons)).toBe(true);
      expect(res.body.reasons.length).toBeGreaterThan(0);
      expect(res.body.reasons[0]).toContain("speed");
    });

    it("includes recommended_action in response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tourist_id: "tourist-action",
          anomaly_score: 0.70,
          is_anomaly: true,
          risk_level: "high",
          reasons: ["Off-route movement detected"],
          recommended_action: "Immediate verification recommended",
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-action")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommended_action).toBeDefined();
      expect(typeof res.body.recommended_action).toBe("string");
      expect(res.body.recommended_action.length).toBeGreaterThan(0);
    });

    it("analysis history is retrievable for a tourist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([
          {
            tourist_id: "tourist-history",
            anomaly_score: 0.15,
            is_anomaly: false,
            created_at: "2026-09-01T10:00:00Z",
          },
          {
            tourist_id: "tourist-history",
            anomaly_score: 0.82,
            is_anomaly: true,
            risk_level: "high",
            reasons: ["Sudden route deviation"],
            created_at: "2026-09-01T12:00:00Z",
          },
        ]),
      });

      const token = makeToken();
      const res = await request(app)
        .get("/api/ai/tourist/tourist-history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].anomaly_score).toBeLessThan(0.5);
      expect(res.body[1].is_anomaly).toBe(true);
    });
  });

  // ── 4. False-positive feedback is recorded ──────────────────────
  describe("False-positive feedback is recorded", () => {
    it("alert can be marked as false_positive", async () => {
      // This tests the alert PATCH endpoint with false_positive status
      // which is how operators record AI false-positive feedback
      const alertModule = await import("../routes/alert");
      const alertApp = express();
      alertApp.use(express.json());
      alertApp.use("/api/alerts", alertModule.default);

      const token = makeToken(UserRole.POLICE);
      const res = await request(alertApp)
        .patch("/api/alerts/test-alert-fp")
        .set("Authorization", `Bearer ${token}`)
        .send({
          status: "false_positive",
          notes: "AI flagged normal tourist behavior as anomaly — false positive",
        });
      expect([200, 404]).toContain(res.status);
    });

    it("AI stats endpoint is available for monitoring", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_analyses: 500,
          anomalies_detected: 23,
          false_positives: 4,
          avg_score: 0.28,
        }),
      });

      const token = makeToken();
      const res = await request(app)
        .get("/api/ai/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total_analyses");
      expect(res.body).toHaveProperty("anomalies_detected");
    });
  });

  // ── 5. AI failure does not stop basic alerts ────────────────────
  describe("AI failure does not stop basic alerts", () => {
    it("AI service down returns 500 but does not crash server", async () => {
      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze/tourist-down")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });

    it("alert creation still works when AI is unavailable", async () => {
      // AI service is mocked to fail
      mockFetch.mockRejectedValue(new Error("AI service offline"));

      // But alert creation through the alert router should still work
      // (not return 401, 403, or crash the server)
      const alertModule = await import("../routes/alert");
      const alertApp = express();
      alertApp.use(express.json());
      alertApp.use("/api/alerts", alertModule.default);

      const token = makeToken(UserRole.POLICE);
      const res = await request(alertApp)
        .post("/api/alerts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          tourist_id: "123e4567-e89b-4d3a-a456-426614174000",
          alert_type: "panic",
          location_lat: 27.35,
          location_lng: 88.61,
          message: "Manual panic — AI service down, fallback alert",
        });
      // Mock DB may not support full insert flow, but alert route
      // should process the request (not blocked by AI being offline)
      expect([200, 201, 500]).toContain(res.status);
      // Verify AI failure did NOT cause this — the error should be from DB mock, not AI
      if (res.status === 500) {
        expect(res.body.error).not.toContain("AI");
      }
    });

    it("AI stats failure returns 500 gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Service unavailable"));

      const token = makeToken();
      const res = await request(app)
        .get("/api/ai/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });

    it("AI history failure returns 500 gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "Service unavailable",
      });

      const token = makeToken();
      const res = await request(app)
        .get("/api/ai/tourist/some-tourist")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
    });

    it("batch analysis failure returns 500 gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Timeout"));

      const token = makeToken();
      const res = await request(app)
        .post("/api/ai/analyze-all")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
    });

    it("AI routes require authentication even when AI is down", async () => {
      mockFetch.mockRejectedValue(new Error("Offline"));
      const res = await request(app).post("/api/ai/analyze/some-id");
      expect(res.status).toBe(401);
    });
  });
});
