import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../../config";
import { UserRole } from "../../types";

// Mock database
jest.mock("../../config/database", () => {
  const mockStore: Record<string, any[]> = {};
  const handler: any = (table?: string) => {
    const chain: Record<string, any> = {};
    if (!mockStore[table]) mockStore[table] = [];
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
    chain.clone = jest.fn(() => {
      const c = { ...chain, then: (resolve: any) => resolve([{ total: String(mockStore[table]?.length || 0) }]) };
      return c;
    });
    chain.insert = jest.fn((data: any) => {
      const record = { id: data.id || `mock-${Date.now()}`, ...data };
      mockStore[table].push(record);
      return {
        returning: jest.fn(() => ({
          then: (resolve: any) => resolve([record]),
        })),
      };
    });
    chain.offset = jest.fn(() => chain);
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  handler.__store = mockStore;
  return { __esModule: true, default: handler };
});

// Mock blockchain
jest.mock("../../services/blockchain", () => ({
  createBlock: jest.fn(async () => ({
    block_id: "block-123",
    tourist_id: "tourist-123",
    data_hash: "abc123",
    previous_block_hash: "0".repeat(64),
    current_block_hash: "hash123",
    issue_timestamp: new Date(),
    expiry_timestamp: new Date(),
  })),
  verifyBlock: jest.fn(async () => ({
    valid: true,
    chainIntact: true,
    dataIntact: true,
    expired: false,
    block: { block_id: "block-123" },
  })),
  getDataHash: jest.fn(async () => "hash123"),
}));

// Mock audit
jest.mock("../../services/audit", () => ({
  logAudit: jest.fn(),
  logFromRequest: jest.fn(),
}));

// Mock notification
jest.mock("../../services/notification", () => ({
  notifyAlertCreated: jest.fn(),
  notifyEfirGenerated: jest.fn(),
}));

// Mock server.io
jest.mock("../../server", () => ({
  io: { emit: jest.fn() },
}));

import touristRouter from "../../routes/tourist";
import db from "../../config/database";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/tourist", touristRouter);
  return app;
}

describe("Tourist Routes", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  describe("POST /api/tourist/register", () => {
    it("rejects registration with missing fields", async () => {
      const res = await request(app)
        .post("/api/tourist/register")
        .send({ full_name: "Test" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid id_type", async () => {
      const res = await request(app)
        .post("/api/tourist/register")
        .send({
          full_name: "Test Tourist",
          id_type: "invalid",
          id_number: "123456",
          phone: "1234567890",
          email: "test@test.com",
          emergency_contact_name: "Emergency",
          emergency_contact_phone: "0987654321",
          trip_start: "2026-09-01",
          trip_end: "2026-09-07",
          itinerary: [],
        });
      expect(res.status).toBe(400);
    });

    it("accepts valid registration", async () => {
      const res = await request(app)
        .post("/api/tourist/register")
        .send({
          full_name: "Test Tourist",
          id_type: "aadhaar",
          id_number: "123456789012",
          phone: "9876543210",
          email: "tourist@test.com",
          emergency_contact_name: "Emergency Contact",
          emergency_contact_phone: "0987654321",
          trip_start: "2026-09-01",
          trip_end: "2026-09-07",
          itinerary: [{ place: "Gangtok", lat: 27.35, lng: 88.61, planned_date: "2026-09-01" }],
        });
      expect(res.status).toBe(201);
      expect(res.body.tourist).toBeDefined();
      expect(res.body.digitalId).toBeDefined();
      expect(res.body.qrDataUrl).toBeDefined();
      expect(res.body.blockchainSecured).toBe(true);
    });

    it("returns QR code data URL as base64 data URI", async () => {
      const res = await request(app)
        .post("/api/tourist/register")
        .send({
          full_name: "QR Tourist",
          id_type: "passport",
          id_number: "AB1234567",
          phone: "1234567890",
          email: "qr@test.com",
          emergency_contact_name: "Emergency",
          emergency_contact_phone: "0987654321",
          trip_start: "2026-09-01",
          trip_end: "2026-09-07",
          itinerary: [],
        });
      expect(res.status).toBe(201);
      expect(res.body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("GET /api/tourist/verify-id/:touristId/:blockId", () => {
    it("returns verification result", async () => {
      const res = await request(app)
        .get("/api/tourist/verify-id/tourist-123/block-123");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("valid");
    });
  });

  describe("GET /api/tourist/tourists/:id (protected)", () => {
    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/tourist/tourists/some-id");
      expect(res.status).toBe(401);
    });

    it("returns tourist with valid token", async () => {
      const token = jwt.sign(
        { userId: "u1", role: UserRole.POLICE },
        config.jwt.secret
      );
      // Mock first() to return tourist data
      const mockStore = (db as any).__store;
      mockStore["tourists"] = [{
        id: "tourist-1",
        full_name: "Test Tourist",
        id_type: "aadhaar",
        id_number: "123456789012",
        phone: "9876543210",
      }];

      const res = await request(app)
        .get("/api/tourist/tourists/tourist-1")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("Panic button (creates alert via registration or manual)", () => {
    it("tourist registration creates a digital ID with blockchain", async () => {
      const res = await request(app)
        .post("/api/tourist/register")
        .send({
          full_name: "Panic Test",
          id_type: "aadhaar",
          id_number: "999999999999",
          phone: "1111111111",
          email: "panic@test.com",
          emergency_contact_name: "Mom",
          emergency_contact_phone: "2222222222",
          trip_start: "2026-09-01",
          trip_end: "2026-09-07",
          itinerary: [],
        });
      expect(res.status).toBe(201);
      expect(res.body.blockchainSecured).toBe(true);
      expect(res.body.digitalId.status).toBe("active");
    });
  });

  describe("Digital ID lifecycle", () => {
    it("digital ID is created with active status", async () => {
      const res = await request(app)
        .post("/api/tourist/register")
        .send({
          full_name: "ID Lifecycle",
          id_type: "passport",
          id_number: "XY1234567",
          phone: "3333333333",
          email: "lifecycle@test.com",
          emergency_contact_name: "Dad",
          emergency_contact_phone: "4444444444",
          trip_start: "2026-09-01",
          trip_end: "2026-09-07",
          itinerary: [],
        });
      expect(res.body.digitalId.status).toBe("active");
      expect(res.body.digitalId.qr_data).toBeDefined();
    });
  });
});
