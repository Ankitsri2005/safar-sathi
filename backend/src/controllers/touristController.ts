import { Request, Response } from "express";
import * as touristService from "../services/tourist";
import { logFromRequest, logAudit } from "../services/audit";

export async function registerTourist(req: Request, res: Response) {
  try {
    const result = await touristService.registerTourist(req.body);
    await logAudit({
      event_type: "tourist_record_access",
      resource_type: "tourist",
      resource_id: result.tourist.id,
      details: { action: "registration", id_type: req.body.id_type },
      ip_address: req.ip,
    });
    res.status(201).json({
      message: "Tourist registered successfully",
      tourist: result.tourist,
      digitalId: result.digitalId,
      qrDataUrl: result.qrDataUrl,
      blockchainSecured: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
}

export async function verifyId(req: Request, res: Response) {
  try {
    const { touristId, blockId } = req.params;
    const result = await touristService.verifyDigitalId(touristId, blockId);
    await logAudit({
      event_type: "id_verification",
      resource_type: "tourist",
      resource_id: touristId,
      details: { valid: result.valid, status: result.status },
      ip_address: req.ip,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Verification failed" });
  }
}

export async function getTourist(req: Request, res: Response) {
  try {
    const tourist = await touristService.getTouristById(req.params.id);
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });
    await logFromRequest(req, "tourist_record_access", {
      resource_type: "tourist",
      resource_id: req.params.id,
      details: { action: "view_full_profile" },
    });
    res.json(tourist);
  } catch {
    res.status(500).json({ error: "Failed to get tourist" });
  }
}

export async function listDigitalIds(req: Request, res: Response) {
  try {
    const { status, search, page, limit } = req.query;
    const result = await touristService.listDigitalIds({
      status: status as any,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to list digital IDs" });
  }
}

export async function getDigitalIdByTourist(req: Request, res: Response) {
  try {
    const digitalId = await touristService.getDigitalIdByTouristId(req.params.touristId);
    if (!digitalId) return res.status(404).json({ error: "No digital ID found" });
    res.json(digitalId);
  } catch {
    res.status(500).json({ error: "Failed to get digital ID" });
  }
}

export async function locationPing(req: Request, res: Response) {
  try {
    await touristService.recordLocationPing(req.body);
    res.json({ message: "Location recorded" });
  } catch {
    res.status(500).json({ error: "Failed to record location" });
  }
}
