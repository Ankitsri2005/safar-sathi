import { Request, Response } from "express";
import * as efirService from "../services/efir";
import path from "path";

export async function generateEfir(req: Request, res: Response) {
  try {
    const efir = await efirService.generateEfir(
      req.params.alertId,
      req.user!.userId
    );
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
    const { status, page, limit } = req.query;
    const result = await efirService.listEfirs({
      status: status as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to list E-FIRs" });
  }
}

export async function downloadEfir(req: Request, res: Response) {
  try {
    const efirs = await efirService.listEfirs({ limit: 1000 });
    const efir = efirs.data.find((e) => e.id === req.params.id);
    if (!efir || !efir.pdf_url) {
      return res.status(404).json({ error: "E-FIR not found" });
    }
    const filePath = path.resolve(__dirname, "../..", efir.pdf_url);
    res.download(filePath);
  } catch {
    res.status(500).json({ error: "Failed to download E-FIR" });
  }
}

export async function updateEfirStatus(req: Request, res: Response) {
  try {
    const efir = await efirService.updateEfirStatus(req.params.id, req.body.status);
    if (!efir) return res.status(404).json({ error: "E-FIR not found" });
    res.json(efir);
  } catch {
    res.status(500).json({ error: "Failed to update E-FIR" });
  }
}
