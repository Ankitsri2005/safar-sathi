// Test alert cooldown, severity mapping, and creation logic
// Smart mock database that actually filters by where() clauses

let mockStore: Record<string, any[]> = {};
let whereChain: Record<string, any>[] = [];

jest.mock("../../config/database", () => {
  const handler: any = (table?: string) => {
    if (!table) return handler;
    if (!mockStore[table]) mockStore[table] = [];
    whereChain = [];

    const chain: Record<string, any> = {};
    const methods = [
      "where", "whereNot", "whereRaw", "whereIn", "whereILike", "orWhereILike",
      "andWhere", "orWhere", "select", "insert", "update", "del", "count",
      "sum", "groupBy", "orderBy", "limit", "offset", "clone",
      "returning", "join", "leftJoin", "on", "onRaw", "andOn",
    ];
    for (const m of methods) {
      chain[m] = jest.fn((...args: any[]) => {
        if (m === "where" && args.length >= 2 && typeof args[1] === "string") {
          whereChain.push({ field: args[0], op: args[1], value: args[2] });
        } else if (m === "where" && args.length === 1 && typeof args[0] === "object") {
          for (const [k, v] of Object.entries(args[0])) {
            whereChain.push({ field: k, op: "=", value: v });
          }
        }
        return chain;
      });
    }

    chain.first = jest.fn(() => {
      let results = mockStore[table] || [];
      for (const wc of whereChain) {
        results = results.filter((r) => {
          const val = r[wc.field];
          if (wc.op === "=" || wc.op === undefined) return val === wc.value;
          if (wc.op === "!=" || wc.op === "!") return val !== wc.value;
          if (wc.op === ">=") return val >= wc.value;
          if (wc.op === "<=") return val <= wc.value;
          if (wc.op === "like") return typeof val === "string" && val.includes(String(wc.value).replace(/%/g, ""));
          if (wc.op === "ilike") return typeof val === "string" && val.toLowerCase().includes(String(wc.value).replace(/%/g, "").toLowerCase());
          return true;
        });
      }
      return results[0] || null;
    });

    chain.then = jest.fn((resolve: any) => {
      let results = mockStore[table] || [];
      for (const wc of whereChain) {
        results = results.filter((r) => {
          const val = r[wc.field];
          if (wc.op === "=" || wc.op === undefined) return val === wc.value;
          if (wc.op === "!=" || wc.op === "!") return val !== wc.value;
          if (wc.op === ">=") return val >= wc.value;
          if (wc.op === "<=") return val <= wc.value;
          return true;
        });
      }
      resolve(results);
    });

    chain.clone = jest.fn(() => {
      const c = { ...chain };
      c.then = (resolve: any) => resolve([{ total: String((mockStore[table] || []).length) }]);
      c.first = jest.fn(() => ({ total: String((mockStore[table] || []).length) }));
      return c;
    });

    chain.insert = jest.fn((data: any) => {
      const record = { id: data.id || `mock-${Date.now()}-${Math.random()}`, ...data };
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
            const items = mockStore[table] || [];
            if (items.length > 0) {
              Object.assign(items[0], data);
              resolve([items[0]]);
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

  return { __esModule: true, default: handler };
});

// Mock server.io
jest.mock("../../server", () => ({
  io: { emit: jest.fn() },
}));

// Mock notification
jest.mock("../../services/notification", () => ({
  notifyAlertCreated: jest.fn(),
}));

import { createAlert, getAlertStats } from "../../services/alert";
import { AlertType, AlertStatus } from "../../types";

let testCounter = 0;
function uniqueId() {
  return `tourist-alert-${++testCounter}-${Date.now()}`;
}

beforeEach(() => {
  mockStore = {};
  whereChain = [];
});

describe("Alert Service", () => {
  describe("createAlert", () => {
    it("creates a panic alert with critical severity", async () => {
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: AlertType.PANIC,
        location_lat: 27.35,
        location_lng: 88.61,
        message: "Tourist pressed panic button",
      });
      expect(alert).not.toBeNull();
      expect(alert!.alert_type).toBe(AlertType.PANIC);
      expect(alert!.severity).toBe("critical");
      expect(alert!.status).toBe(AlertStatus.NEW);
    });

    it("creates restricted zone alert with critical severity", async () => {
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: AlertType.RESTRICTED_ZONE_ENTRY,
        location_lat: 27.40,
        location_lng: 88.65,
      });
      expect(alert).not.toBeNull();
      expect(alert!.severity).toBe("critical");
    });

    it("creates high-risk zone alert with high severity", async () => {
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: AlertType.HIGH_RISK_ZONE_ENTRY,
        location_lat: 27.42,
        location_lng: 88.70,
      });
      expect(alert).not.toBeNull();
      expect(alert!.severity).toBe("high");
    });

    it("creates no-location-update alert with medium severity", async () => {
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: AlertType.NO_LOCATION_UPDATE,
        location_lat: 27.35,
        location_lng: 88.61,
      });
      expect(alert).not.toBeNull();
      expect(alert!.severity).toBe("medium");
    });

    it("creates route deviation alert with medium severity", async () => {
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: AlertType.ROUTE_DEVIATION,
        location_lat: 27.50,
        location_lng: 88.90,
      });
      expect(alert).not.toBeNull();
      expect(alert!.severity).toBe("medium");
    });

    it("creates prolonged stop alert with high severity", async () => {
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: AlertType.PROLONGED_STOP,
        location_lat: 27.38,
        location_lng: 88.63,
      });
      expect(alert).not.toBeNull();
      expect(alert!.severity).toBe("high");
    });

    it("manual alert always creates (no cooldown)", async () => {
      const id = uniqueId();
      const alert1 = await createAlert({
        tourist_id: id,
        alert_type: AlertType.MANUAL,
        location_lat: 27.35,
        location_lng: 88.61,
      });
      const alert2 = await createAlert({
        tourist_id: id,
        alert_type: AlertType.MANUAL,
        location_lat: 27.35,
        location_lng: 88.61,
      });
      expect(alert1).not.toBeNull();
      expect(alert2).not.toBeNull();
    });

    it("allows custom severity override", async () => {
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: AlertType.ROUTE_DEVIATION,
        location_lat: 27.35,
        location_lng: 88.61,
        severity: "critical",
      });
      expect(alert).not.toBeNull();
      expect(alert!.severity).toBe("critical");
    });

    it("panic alert never suppressed by cooldown", async () => {
      const id = uniqueId();
      const a1 = await createAlert({
        tourist_id: id,
        alert_type: AlertType.PANIC,
        location_lat: 27.35,
        location_lng: 88.61,
      });
      const a2 = await createAlert({
        tourist_id: id,
        alert_type: AlertType.PANIC,
        location_lat: 27.35,
        location_lng: 88.61,
      });
      expect(a1).not.toBeNull();
      expect(a2).not.toBeNull();
    });
  });

  describe("getAlertStats", () => {
    it("returns stats object with expected fields", async () => {
      const stats = await getAlertStats();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("new");
      expect(stats).toHaveProperty("acknowledged");
      expect(stats).toHaveProperty("resolved");
      expect(stats).toHaveProperty("false_positive");
      expect(typeof stats.total).toBe("number");
    });
  });
});
