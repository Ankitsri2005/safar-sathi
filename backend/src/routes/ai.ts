import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

const router = Router();
router.use(authenticate);

async function proxyToAIService(method: string, path: string, body?: any): Promise<any> {
  const url = `${AI_SERVICE_URL}${path}`;
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET") init.body = JSON.stringify(body);
  const resp = await fetch(url, init);
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`AI service error ${resp.status}: ${err}`);
  }
  return resp.json();
}

router.post("/analyze/:touristId", async (req: Request, res: Response) => {
  try {
    const result = await proxyToAIService("POST", "/api/analyze/movement", {
      tourist_id: req.params.touristId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

router.get("/tourist/:touristId", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit || 10;
    const result = await proxyToAIService("GET", `/api/analyze/tourist/${req.params.touristId}?limit=${limit}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch analyses" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const result = await proxyToAIService("GET", "/api/analyze/stats");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch AI stats" });
  }
});

router.post("/analyze-all", async (_req: Request, res: Response) => {
  try {
    const result = await proxyToAIService("POST", "/api/analyze/batch");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Batch analysis failed" });
  }
});

export default router;
