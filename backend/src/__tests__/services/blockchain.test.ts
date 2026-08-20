import crypto from "crypto";
import { config } from "../../config";

// We test the blockchain service logic: hashing, chaining, verification.
// Mock database for blockchain tests
jest.mock("../../config/database", () => {
  const blocks: any[] = [];
  const handler: any = (table?: string) => {
    const chain: Record<string, any> = {};
    const methods = [
      "where", "whereNot", "whereRaw", "select", "insert", "first",
      "orderBy", "clone", "returning",
    ];
    for (const m of methods) {
      chain[m] = jest.fn(() => chain);
    }
    chain.first = jest.fn(() => blocks[blocks.length - 1] || null);
    chain.then = jest.fn((resolve: any) => resolve(blocks));
    chain.insert = jest.fn((data: any) => {
      blocks.push(data);
      return {
        returning: jest.fn(() => ({
          then: (resolve: any) => resolve([data]),
        })),
      };
    });
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  handler.__blocks = blocks;
  return { __esModule: true, default: handler };
});

import { createBlock, verifyBlock, getDataHash } from "../../services/blockchain";

describe("Blockchain Service", () => {
  describe("createBlock", () => {
    it("creates a block with correct hash chain", async () => {
      const block = await createBlock("tourist-1", {
        touristId: "tourist-1",
        kycRef: "aadhaar:123456789012",
        itinerary: [],
        tripStart: "2026-09-01",
        tripEnd: "2026-09-07",
      });

      expect(block.block_id).toBeDefined();
      expect(block.tourist_id).toBe("tourist-1");
      expect(block.data_hash).toBeDefined();
      expect(block.previous_block_hash).toBeDefined();
      expect(block.current_block_hash).toBeDefined();
      // First block links to genesis (all zeros)
      expect(block.previous_block_hash).toBe("0".repeat(64));
    });

    it("generates unique block IDs", async () => {
      const block1 = await createBlock("t1", { data: "1", tripEnd: "2026-12-31" });
      const block2 = await createBlock("t2", { data: "2", tripEnd: "2026-12-31" });
      expect(block1.block_id).not.toBe(block2.block_id);
    });
  });

  describe("verifyBlock", () => {
    it("returns valid: false for non-existent block", async () => {
      const result = await verifyBlock("non-existent-id");
      expect(result.valid).toBe(false);
      expect(result.chainIntact).toBe(false);
      expect(result.block).toBeNull();
    });

    it("verifies a created block successfully", async () => {
      const block = await createBlock("tourist-verify", {
        touristId: "tourist-verify",
        data: "test",
        tripEnd: "2026-12-31",
      });

      const result = await verifyBlock(block.block_id);
      expect(result.dataIntact).toBe(true);
      expect(result.chainIntact).toBe(true);
    });
  });

  describe("getDataHash", () => {
    it("produces deterministic hash for same data", async () => {
      const hash1 = await getDataHash({ key: "value" });
      const hash2 = await getDataHash({ key: "value" });
      expect(hash1).toBe(hash2);
    });

    it("produces different hash for different data", async () => {
      const hash1 = await getDataHash({ key: "value1" });
      const hash2 = await getDataHash({ key: "value2" });
      expect(hash1).not.toBe(hash2);
    });

    it("produces 64-char hex string", async () => {
      const hash = await getDataHash({ test: true });
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
