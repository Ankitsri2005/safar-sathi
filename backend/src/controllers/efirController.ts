import { Request, Response } from "express";
import * as efirService from "../services/efir";
import { logFromRequest } from "../services/audit";
import path from "path";
import { EfirStatus } from "../types";

export async function generateEfir(req: Request, res: Response) {
  try {
    const efir = await efirService.generateEfir(
      req.params.alertId,
      req.user!.userId,
      {
        incident_type: req.body.incident_type,
        incident_severity: req.body.incident_severity,
        incident_description: req.body.incident_description,
        location_history: req.body.location_history,
      }
    );
    await logFromRequest(req, "efir_generation", {
      resource_type: "efir",
      resource_id: efir.id,
      details: { efir_number: efir.efir_number, alert_id: req.params.alertId },
    });
    res.status(201).json({
      message: "E-FIR generated successfully",
      efir,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate E-FIR", details: error.message });
  }
}

export async function listEfirs(req: Request, res: Response) {
  try {
    const { status, search, page, limit } = req.query;
    const result = await efirService.listEfirs({
      status: status as EfirStatus | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to list E-FIRs" });
  }
}

export async function getEfirById(req: Request, res: Response) {
  try {
    const efir = await efirService.getEfirById(req.params.id);
    if (!efir) return res.status(404).json({ error: "E-FIR not found" });
    res.json(efir);
  } catch {
    res.status(500).json({ error: "Failed to fetch E-FIR" });
  }
}

export async function downloadEfir(req: Request, res: Response) {
  try {
    const efir = await efirService.getEfirById(req.params.id);
    if (!efir || !efir.pdf_url) {
      return res.status(404).json({ error: "E-FIR not found or PDF not available" });
    }
    await logFromRequest(req, "data_export", {
      resource_type: "efir",
      resource_id: req.params.id,
      details: { efir_number: efir.efir_number, action: "pdf_download" },
    });
    const filePath = path.resolve(__dirname, "../..", efir.pdf_url);
    res.download(filePath, `${efir.efir_number || efir.id}.pdf`);
  } catch {
    res.status(500).json({ error: "Failed to download E-FIR" });
  }
}

export async function updateEfirStatus(req: Request, res: Response) {
  try {
    const efir = await efirService.updateEfirStatus(
      req.params.id,
      req.body.status,
      req.body.resolution_status
    );
    if (!efir) return res.status(404).json({ error: "E-FIR not found" });
    await logFromRequest(req, "efir_generation", {
      resource_type: "efir",
      resource_id: req.params.id,
      details: { action: "status_change", new_status: req.body.status },
    });
    res.json(efir);
  } catch {
    res.status(500).json({ error: "Failed to update E-FIR" });
  }
}

export async function deleteEfir(req: Request, res: Response) {
  try {
    const deleted = await efirService.deleteEfir(req.params.id);
    if (!deleted) return res.status(404).json({ error: "E-FIR not found" });
    await logFromRequest(req, "data_export", {
      resource_type: "efir",
      resource_id: req.params.id,
      details: { action: "delete" },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete E-FIR" });
  }
}
