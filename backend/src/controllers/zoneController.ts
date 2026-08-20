import { Request, Response } from "express";
import * as zoneService from "../services/zone";
import { logFromRequest } from "../services/audit";

export async function createZone(req: Request, res: Response) {
  try {
    const zone = await zoneService.createZone(req.body);
    await logFromRequest(req, "zone_creation", {
      resource_type: "zone",
      resource_id: zone.id,
      details: { name: req.body.name, risk_level: req.body.risk_level },
    });
    res.status(201).json(zone);
  } catch {
    res.status(500).json({ error: "Failed to create zone" });
  }
}

export async function listZones(req: Request, res: Response) {
  try {
    const is_active = req.query.active !== undefined
      ? req.query.active === "true"
      : undefined;
    const zones = await zoneService.listZones({ is_active });
    res.json(zones);
  } catch {
    res.status(500).json({ error: "Failed to list zones" });
  }
}

export async function getZone(req: Request, res: Response) {
  try {
    const zone = await zoneService.getZoneById(req.params.id);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json(zone);
  } catch {
    res.status(500).json({ error: "Failed to get zone" });
  }
}

export async function updateZone(req: Request, res: Response) {
  try {
    const zone = await zoneService.updateZone(req.params.id, req.body);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json(zone);
  } catch {
    res.status(500).json({ error: "Failed to update zone" });
  }
}

export async function deactivateZone(req: Request, res: Response) {
  try {
    const zone = await zoneService.deactivateZone(req.params.id);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json({ message: "Zone deactivated", zone });
  } catch {
    res.status(500).json({ error: "Failed to deactivate zone" });
  }
}

export async function deleteZone(req: Request, res: Response) {
  try {
    const deleted = await zoneService.deleteZone(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Zone not found" });
    res.json({ message: "Zone deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete zone" });
  }
}

/**
 * Check which zone contains a given lat/lng point.
 * Used by the frontend to determine a tourist's current risk zone.
 */
export async function checkZone(req: Request, res: Response) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng query parameters required" });
    }
    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: "Invalid lat/lng values" });
    }
    const zone = await zoneService.findZoneForPoint(latNum, lngNum);
    if (zone) {
      res.json({ zone });
    } else {
      res.json({ zone: null, message: "No zone found for this location" });
    }
  } catch {
    res.status(500).json({ error: "Failed to check zone" });
  }
}
