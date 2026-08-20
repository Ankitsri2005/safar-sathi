// Test dashboard service functions
jest.mock("../../config/database", () => {
  const handler: any = (table?: string) => {
    const chain: Record<string, any> = {};
    const methods = [
      "where", "whereNot", "whereRaw", "whereIn", "select", "insert",
      "update", "del", "count", "sum", "groupBy", "orderBy", "limit",
      "offset", "first", "clone", "returning", "join", "leftJoin",
      "on", "onRaw", "andOn",
    ];
    for (const m of methods) chain[m] = jest.fn(() => chain);
    chain.then = (resolve: any) => resolve([{ count: "0", total: "0" }]);
    chain.first = jest.fn(() => ({ count: "0" }));
    chain.clone = jest.fn(() => ({
      ...chain,
      count: jest.fn(() => ({
        first: jest.fn(() => ({ total: "0" })),
      })),
    }));
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  return { __esModule: true, default: handler };
});

import {
  getOverviewStats,
  getDigitalIdStats,
  getZoneRiskDistribution,
} from "../../services/dashboard";

describe("Dashboard Service", () => {
  describe("getOverviewStats", () => {
    it("returns overview with expected fields", async () => {
      const stats = await getOverviewStats();
      expect(stats).toHaveProperty("active_tourists");
      expect(stats).toHaveProperty("active_alerts");
      expect(stats).toHaveProperty("ids_issued_today");
      expect(stats).toHaveProperty("total_active_ids");
      expect(typeof stats.active_tourists).toBe("number");
    });
  });

  describe("getDigitalIdStats", () => {
    it("returns digital ID stats", async () => {
      const stats = await getDigitalIdStats();
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("expired");
      expect(stats).toHaveProperty("revoked");
      expect(stats).toHaveProperty("total");
    });
  });

  describe("getZoneRiskDistribution", () => {
    it("returns zone risk distribution", async () => {
      const result = await getZoneRiskDistribution();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
