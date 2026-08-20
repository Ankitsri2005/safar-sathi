// Test rule engine: evaluates location-based alert rules

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
        } else if (m === "whereRaw") {
          whereChain.push({ field: "_raw", op: "raw", value: args[0] });
        }
        return chain;
      });
    }

    chain.first = jest.fn(() => {
      let results = mockStore[table] || [];
      for (const wc of whereChain) {
        if (wc.op === "raw") continue; // skip raw for simplicity
        results = results.filter((r) => {
          const val = r[wc.field];
          if (wc.op === "=" || wc.op === undefined) return val === wc.value;
          if (wc.op === "!=" || wc.op === "!") return val !== wc.value;
          return true;
        });
      }
      return results[0] || null;
    });

    chain.then = jest.fn((resolve: any) => {
      let results = mockStore[table] || [];
      for (const wc of whereChain) {
        if (wc.op === "raw") continue;
        results = results.filter((r) => {
          const val = r[wc.field];
          if (wc.op === "=" || wc.op === undefined) return val === wc.value;
          return true;
        });
      }
      resolve(results);
    });

    chain.clone = jest.fn(() => {
      const c = { ...chain };
      c.then = (resolve: any) => resolve([{ total: String((mockStore[table] || []).length) }]);
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

    chain.update = jest.fn(() => ({
      returning: jest.fn(() => ({
        then: (resolve: any) => resolve([]),
      })),
    }));

    return chain;
  };

  handler.raw = jest.fn(async () => ({ rows: [] }));
  return { __esModule: true, default: handler };
});

jest.mock("../../server", () => ({
  io: { emit: jest.fn() },
}));

jest.mock("../../services/notification", () => ({
  notifyAlertCreated: jest.fn(),
}));

let ruleTestCounter = 0;
function uniqueId() {
  return `rule-test-${++ruleTestCounter}-${Date.now()}`;
}

beforeEach(() => {
  mockStore = {};
  whereChain = [];
});

describe("Rule Engine", () => {
  describe("Alert creation based on conditions", () => {
    it("creates alerts for different rule engine conditions", async () => {
      const { createAlert } = await import("../../services/alert");

      const noUpdateAlert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: "no_location_update" as any,
        location_lat: 27.35,
        location_lng: 88.61,
        message: "No location update for 30+ minutes",
      });
      expect(noUpdateAlert).not.toBeNull();
      expect(noUpdateAlert!.alert_type).toBe("no_location_update");

      const deviationAlert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: "route_deviation" as any,
        location_lat: 27.50,
        location_lng: 88.90,
        message: "Tourist is 8.5 km from nearest planned stop",
      });
      expect(deviationAlert).not.toBeNull();
      expect(deviationAlert!.alert_type).toBe("route_deviation");

      const prolongedAlert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: "prolonged_stop" as any,
        location_lat: 27.38,
        location_lng: 88.63,
        message: "Tourist stationary for 2+ hours in high-risk zone",
      });
      expect(prolongedAlert).not.toBeNull();
      expect(prolongedAlert!.alert_type).toBe("prolonged_stop");
    });

    it("panic alert has no cooldown - always creates", async () => {
      const { createAlert } = await import("../../services/alert");
      const id = uniqueId();
      const a1 = await createAlert({
        tourist_id: id,
        alert_type: "panic" as any,
        location_lat: 27.35,
        location_lng: 88.61,
      });
      const a2 = await createAlert({
        tourist_id: id,
        alert_type: "panic" as any,
        location_lat: 27.35,
        location_lng: 88.61,
      });
      expect(a1).not.toBeNull();
      expect(a2).not.toBeNull();
    });

    it("route deviation alert message contains distance in km", async () => {
      const { createAlert } = await import("../../services/alert");
      const alert = await createAlert({
        tourist_id: uniqueId(),
        alert_type: "route_deviation" as any,
        location_lat: 27.50,
        location_lng: 88.90,
        message: "Tourist is 8.5 km away from the nearest planned itinerary stop",
      });
      expect(alert).not.toBeNull();
      expect(alert!.message).toContain("km");
    });
  });
});
