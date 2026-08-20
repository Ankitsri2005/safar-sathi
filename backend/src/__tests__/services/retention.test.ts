// Test data retention service
jest.mock("../../config/database", () => {
  const handler: any = (table?: string) => {
    const chain: Record<string, any> = {};
    const methods = [
      "where", "whereNot", "whereRaw", "select", "insert",
      "update", "del", "count", "first", "orderBy", "clone",
    ];
    for (const m of methods) chain[m] = jest.fn(() => chain);
    chain.then = (resolve: any) => resolve([]);
    chain.first = jest.fn(() => null);
    chain.del = jest.fn(() => 5); // pretend 5 rows deleted
    chain.update = jest.fn(() => 3); // pretend 3 rows updated
    return chain;
  };
  handler.raw = jest.fn(async () => ({ rows: [] }));
  return { __esModule: true, default: handler };
});

import {
  expireDigitalIds,
  purgeOldLocationPings,
  purgeOldNotifications,
  purgeOldAuditLogs,
  runRetentionCleanup,
} from "../../services/retention";

describe("Data Retention Service", () => {
  it("expireDigitalIds runs without error", async () => {
    const count = await expireDigitalIds();
    expect(typeof count).toBe("number");
  });

  it("purgeOldLocationPings runs without error", async () => {
    const count = await purgeOldLocationPings();
    expect(typeof count).toBe("number");
  });

  it("purgeOldNotifications runs without error", async () => {
    const count = await purgeOldNotifications();
    expect(typeof count).toBe("number");
  });

  it("purgeOldAuditLogs runs without error", async () => {
    const count = await purgeOldAuditLogs();
    expect(typeof count).toBe("number");
  });

  it("runRetentionCleanup returns summary object", async () => {
    const result = await runRetentionCleanup();
    expect(result).toHaveProperty("expired_ids");
    expect(result).toHaveProperty("old_pings");
    expect(result).toHaveProperty("old_notifications");
    expect(result).toHaveProperty("old_audit_logs");
    expect(result).toHaveProperty("expired_cooldowns");
  });
});
