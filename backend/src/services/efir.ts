import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import db from "../config/database";
import { Efir, EfirStatus, Alert } from "../types";

const TABLE = "efirs";
const UPLOAD_DIR = path.resolve(__dirname, "../../uploads/efirs");

export async function generateEfir(
  alertId: string,
  filedBy: string
): Promise<Efir> {
  // Fetch alert + tourist data
  const alert: Alert & { tourist_name: string } = await db("alerts")
    .join("tourists", "alerts.tourist_id", "tourists.id")
    .select("alerts.*", "tourists.full_name as tourist_name", "tourists.id_number", "tourists.phone", "tourists.id_type")
    .where("alerts.id", alertId)
    .first();

  if (!alert) {
    throw new Error("Alert not found");
  }

  // Generate PDF
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const efirId = uuidv4();
  const filename = `EFIR_${efirId}.pdf`;
  const filePath = path.join(UPLOAD_DIR, filename);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(18).text("ELECTRONIC FIRST INFORMATION REPORT", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).text("Smart Tourist Safety Monitoring & Incident Response System", { align: "center" });
  doc.moveDown(1);

  // E-FIR Details
  doc.fontSize(14).text("E-FIR Details");
  doc.moveDown(0.3);
  doc.fontSize(11);
  doc.text(`E-FIR ID: ${efirId}`);
  doc.text(`Date Generated: ${new Date().toISOString()}`);
  doc.text(`Status: DRAFT`);
  doc.moveDown(0.5);

  // Tourist Details
  doc.fontSize(14).text("Tourist Information");
  doc.moveDown(0.3);
  doc.fontSize(11);
  doc.text(`Name: ${alert.tourist_name}`);
  doc.text(`ID Type: ${alert.id_type}`);
  doc.text(`ID Number: ${alert.id_number}`);
  doc.text(`Phone: ${alert.phone}`);
  doc.moveDown(0.5);

  // Incident Details
  doc.fontSize(14).text("Incident Details");
  doc.moveDown(0.3);
  doc.fontSize(11);
  doc.text(`Alert Type: ${alert.alert_type}`);
  doc.text(`Location: ${alert.location_lat}, ${alert.location_lng}`);
  doc.text(`Location Name: ${alert.location_name || "N/A"}`);
  doc.text(`Timestamp: ${alert.created_at}`);
  doc.text(`Description: ${alert.message || "No additional details"}`);
  doc.moveDown(0.5);

  // Footer
  doc.fontSize(10).text("This is a system-generated E-FIR. Blockchain verification ID: " + alertId, { align: "center" });

  doc.end();

  await new Promise<void>((resolve) => stream.on("finish", resolve));

  // Store in DB
  const [efir] = await db(TABLE)
    .insert({
      id: efirId,
      alert_id: alertId,
      tourist_id: alert.tourist_id,
      status: EfirStatus.DRAFT,
      pdf_url: `/uploads/efirs/${filename}`,
      filed_by: filedBy,
    })
    .returning("*");

  return efir;
}

export async function listEfirs(filters?: {
  status?: EfirStatus;
  page?: number;
  limit?: number;
}): Promise<{ data: (Efir & { tourist_name: string })[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  let query = db(TABLE)
    .join("tourists", "efirs.tourist_id", "tourists.id")
    .select("efirs.*", "tourists.full_name as tourist_name");

  if (filters?.status) {
    query = query.where("efirs.status", filters.status);
  }

  const countResult = await query.clone().count("efirs.id as total").first();
  const total = parseInt((countResult as any)?.total || "0", 10);

  const data = await query
    .orderBy("efirs.created_at", "desc")
    .offset((page - 1) * limit)
    .limit(limit);

  return { data, total };
}

export async function updateEfirStatus(
  id: string,
  status: EfirStatus
): Promise<Efir | null> {
  const [efir] = await db(TABLE)
    .where({ id })
    .update({ status, updated_at: new Date() })
    .returning("*");
  return efir || null;
}
