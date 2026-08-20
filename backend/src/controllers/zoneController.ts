import { Request, Response } from "express";
import * as zoneService from "../services/zone";

export async function createZone(req: Request, res: Response) {
  try {
    const zone = await zoneService.createZone(req.body);
    res.status(201).json(zone);
  } catch {
    res.status(500).json({ error: "Failed to create zone" });
  }
}

export async function listZones(_req: Request, res: Response) {
  try {
    const zones = await zoneService.listZones();
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

export async function deleteZone(req: Request, res: Response) {
  try {
    const deleted = await zoneService.deleteZone(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Zone not found" });
    res.json({ message: "Zone deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete zone" });
  }
}
