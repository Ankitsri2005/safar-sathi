import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import db from "../config/database";
import { Efir, EfirStatus, Alert } from "../types";

const TABLE = "efirs";
const UPLOAD_DIR = path.resolve(__dirname, "../../uploads/efirs");

/**
 * Generate sequential E-FIR number: EFIR-YYYY-NNNN
 */
async function generateEfirNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const last = await db(TABLE)
    .where("efir_number", "like", `EFIR-${year}-%`)
    .orderBy("efir_number", "desc")
    .first();
  const seq = last ? parseInt(last.efir_number.split("-")[2]) + 1 : 1;
  return `EFIR-${year}-${String(seq).padStart(4, "0")}`;
}

/**
 * Generate the full PDF for an E-FIR.
 */
async function generatePdf(
  efirId: string,
  efirNumber: string,
  alert: any,
  tourist: any,
  officer: any,
  locationHistory: any[],
  description: string,
  incidentDate: Date
): Promise<string> {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const filename = `${efirNumber}.pdf`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const primaryColor = "#1e3a5f";
  const accentColor = "#2563eb";
  const dangerColor = "#dc2626";

  // ── Header ──────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
  doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold")
    .text("ELECTRONIC FIRST INFORMATION REPORT", 50, 25, { align: "center" });
  doc.fontSize(10).font("Helvetica")
    .text("Smart Tourist Safety Monitoring & Incident Response System", 50, 55, { align: "center" });
  doc.fontSize(9)
    .text("Government of Sikkim | Department of Tourism", 50, 70, { align: "center" });

  doc.moveDown(4);

  // ── E-FIR Info Box ──────────────────────────────────────────
  doc.fillColor("#f0f4f8").roundedRect(50, doc.y, doc.page.width - 100, 60, 4).fill();
  const boxY = doc.y + 10;
  doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold")
    .text(`E-FIR Number: ${efirNumber}`, 65, boxY);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 300, boxY);
  doc.fillColor("#666").fontSize(10).font("Helvetica")
    .text(`Status: ${EfirStatus.DRAFT.toUpperCase()}`, 65, boxY + 18);
  doc.text(`Incident Date: ${incidentDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 300, boxY + 18);

  doc.y = boxY + 50;

  // ── Helper for section headers ──────────────────────────────
  const section = (title: string) => {
    doc.moveDown(0.8);
    doc.fillColor(accentColor).fontSize(12).font("Helvetica-Bold").text(title);
    doc.moveDown(0.3);
    doc.fillColor("#333").fontSize(10).font("Helvetica");
  };

  const field = (label: string, value: string) => {
    doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(value || "N/A");
  };

  // ── Incident Details ────────────────────────────────────────
  section("INCIDENT DETAILS");
  field("E-FIR Number", efirNumber);
  field("Linked Alert ID", alert.id);
  field("Incident Type", alert.alert_type?.replace(/_/g, " ").toUpperCase());
  field("Incident Severity", alert.severity?.toUpperCase());
  field("Date & Time of Incident",
    new Date(alert.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  );
  field("Location Name", alert.location_name || "N/A");
  field("GPS Coordinates", `${alert.location_lat}, ${alert.location_lng}`);
  field("Incident Description", description || alert.message || "No additional details");

  // ── Tourist Information ─────────────────────────────────────
  section("TOURIST INFORMATION");
  field("Full Name", tourist.full_name);
  field("Digital ID", tourist.id);
  field("ID Type", tourist.id_type);
  field("ID Number", tourist.id_number);
  field("Phone", tourist.phone);
  field("Email", tourist.email || "N/A");
  field("Emergency Contact", `${tourist.emergency_contact_name || "N/A"} (${tourist.emergency_contact_phone || "N/A"})`);

  // ── Location History ────────────────────────────────────────
  if (locationHistory && locationHistory.length > 0) {
    section("LOCATION HISTORY (Last 10 Pings)");
    const tableTop = doc.y;
    const colWidths = [30, 120, 120, 150];
    const headers = ["#", "Latitude", "Longitude", "Timestamp"];

    // Table header
    doc.fillColor(primaryColor);
    doc.rect(50, tableTop, doc.page.width - 100, 18).fill();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8);
    let x = 55;
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop + 5, { width: colWidths[i] });
      x += colWidths[i];
    });

    doc.fillColor("#333").font("Helvetica").fontSize(8);
    locationHistory.slice(0, 10).forEach((ping, i) => {
      const rowY = tableTop + 18 + i * 14;
      if (i % 2 === 0) {
        doc.fillColor("#f8f9fa");
        doc.rect(50, rowY, doc.page.width - 100, 14).fill();
      }
      doc.fillColor("#333");
      x = 55;
      const values = [
        String(i + 1),
        String(ping.lat?.toFixed(6) || "N/A"),
        String(ping.lng?.toFixed(6) || "N/A"),
        ping.timestamp ? new Date(ping.timestamp).toLocaleString("en-IN") : "N/A",
      ];
      values.forEach((v, j) => {
        doc.text(v, x, rowY + 3, { width: colWidths[j] });
        x += colWidths[j];
      });
    });
  }

  // ── Officer Information ─────────────────────────────────────
  if (officer) {
    section("FILING OFFICER");
    field("Name", officer.full_name || "N/A");
    field("Role", officer.role?.replace(/_/g, " ").toUpperCase() || "N/A");
    field("Jurisdiction", officer.jurisdiction || "N/A");
    field("Officer ID", officer.id || "N/A");
  }

  // ── Resolution Status ───────────────────────────────────────
  section("RESOLUTION & VERIFICATION");
  field("Resolution Status", "Under Investigation");
  field("Verification Status", "Pending");
  field("Blockchain Verification", crypto.createHash("sha256").update(efirId + alert.id).digest("hex").slice(0, 16));

  // ── Footer ──────────────────────────────────────────────────
  doc.moveDown(2);
  doc.fillColor("#999").fontSize(8).font("Helvetica")
    .text("This is a system-generated Electronic First Information Report.", { align: "center" })
    .text("Authorized access only. Unauthorized distribution is prohibited.", { align: "center" })
    .text(`Generated: ${new Date().toISOString()} | System: Smart Tourist Safety v1.0`, { align: "center" });

  doc.end();
  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return `/uploads/efirs/${filename}`;
}

/**
 * Get efir by ID with joined data.
 */
export async function getEfirById(id: string): Promise<any | null> {
  const efir = await db(TABLE)
    .join("tourists", "efirs.tourist_id", "tourists.id")
    .join("alerts", "efirs.alert_id", "alerts.id")
    .leftJoin("users", "efirs.filed_by", "users.id")
    .select(
      "efirs.*",
      "tourists.full_name as tourist_name",
      "tourists.id_number as tourist_id_number",
      "tourists.id_type as tourist_id_type",
      "tourists.phone as tourist_phone",
      "tourists.email as tourist_email",
      "tourists.emergency_contact_name",
      "tourists.emergency_contact_phone",
      "alerts.alert_type",
      "alerts.severity as alert_severity",
      "alerts.location_lat as alert_lat",
      "alerts.location_lng as alert_lng",
      "alerts.location_name as alert_location_name",
      "alerts.message as alert_message",
      "alerts.created_at as alert_created_at",
      "users.full_name as officer_name",
      "users.role as officer_role",
      "users.jurisdiction as officer_jurisdiction"
    )
    .where("efirs.id", id)
    .first();
  return efir || null;
}

/**
 * Generate an E-FIR from an alert with full details and PDF.
 */
export async function generateEfir(
  alertId: string,
  filedBy: string,
  data?: {
    incident_type?: string;
    incident_severity?: string;
    incident_description?: string;
    location_history?: any[];
  }
): Promise<any> {
  // Fetch alert + tourist
  const alert = await db("alerts")
    .join("tourists", "alerts.tourist_id", "tourists.id")
    .select(
      "alerts.*",
      "tourists.full_name as tourist_name",
      "tourists.id_number",
      "tourists.phone",
      "tourists.id_type",
      "tourists.email",
      "tourists.emergency_contact_name",
      "tourists.emergency_contact_phone",
      "tourists.id as tourist_uuid"
    )
    .where("alerts.id", alertId)
    .first();

  if (!alert) throw new Error("Alert not found");

  // Fetch officer
  const officer = await db("users").where({ id: filedBy }).first();

  // Fetch recent location history
  const locationHistory = data?.location_history || await db("location_pings")
    .where({ tourist_id: alert.tourist_id })
    .orderBy("timestamp", "desc")
    .limit(20)
    .select("lat", "lng", "timestamp") || [];

  const efirId = uuidv4();
  const efirNumber = await generateEfirNumber();
  const incidentDate = new Date(alert.created_at);
  const description = data?.incident_description || alert.message || "";

  // Generate PDF
  const pdfUrl = await generatePdf(
    efirId,
    efirNumber,
    alert,
    { ...alert, id: alert.tourist_uuid },
    officer,
    locationHistory,
    description,
    incidentDate
  );

  // Create blockchain hash
  const blockchainHash = crypto
    .createHash("sha256")
    .update(`${efirId}${alertId}${touristNameHash(alert.tourist_uuid)}${Date.now()}`)
    .digest("hex");

  // Store in DB
  const [efir] = await db(TABLE)
    .insert({
      id: efirId,
      efir_number: efirNumber,
      alert_id: alertId,
      tourist_id: alert.tourist_uuid,
      status: EfirStatus.GENERATED,
      pdf_url: pdfUrl,
      filed_by: filedBy,
      incident_type: data?.incident_type || alert.alert_type,
      incident_severity: data?.incident_severity || alert.severity,
      incident_date: incidentDate,
      last_known_lat: alert.location_lat,
      last_known_lng: alert.location_lng,
      last_known_location_name: alert.location_name,
      location_history: locationHistory,
      officer_info: officer ? {
        name: officer.full_name,
        role: officer.role,
        jurisdiction: officer.jurisdiction,
        id: officer.id,
      } : null,
      incident_description: description,
      resolution_status: "under_investigation",
      verification_status: "pending",
      blockchain_hash: blockchainHash,
    })
    .returning("*");

  // Notify officers
  try {
    const { notifyEfirGenerated } = await import("./notification");
    await notifyEfirGenerated(efirNumber, alertId, alert.tourist_uuid);
  } catch {}

  return efir;
}

function touristNameHash(id: string): string {
  return crypto.createHash("md5").update(id).digest("hex").slice(0, 8);
}

/**
 * List E-FIRs with pagination and filters.
 */
export async function listEfirs(filters?: {
  status?: EfirStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  let query = db(TABLE)
    .join("tourists", "efirs.tourist_id", "tourists.id")
    .select(
      "efirs.*",
      "tourists.full_name as tourist_name",
      "tourists.id_number as tourist_id_number"
    );

  if (filters?.status) {
    query = query.where("efirs.status", filters.status);
  }
  if (filters?.search) {
    query = query.where(function () {
      this.where("efirs.efir_number", "ilike", `%${filters.search}%`)
        .orWhere("tourists.full_name", "ilike", `%${filters.search}%`)
        .orWhere("tourists.id_number", "ilike", `%${filters.search}%`);
    });
  }

  const countResult = await query.clone().count("efirs.id as total").first();
  const total = parseInt((countResult as any)?.total || "0", 10);

  const data = await query
    .orderBy("efirs.created_at", "desc")
    .offset((page - 1) * limit)
    .limit(limit);

  return { data, total };
}

/**
 * Update E-FIR status.
 */
export async function updateEfirStatus(
  id: string,
  status: EfirStatus,
  resolutionStatus?: string
): Promise<any | null> {
  const updateData: Record<string, any> = { status, updated_at: new Date() };
  if (resolutionStatus) updateData.resolution_status = resolutionStatus;
  if (status === EfirStatus.FILED) updateData.verification_status = "verified";

  const [efir] = await db(TABLE)
    .where({ id })
    .update(updateData)
    .returning("*");
  return efir || null;
}

/**
 * Delete an E-FIR (and its PDF file).
 */
export async function deleteEfir(id: string): Promise<boolean> {
  const efir = await db(TABLE).where({ id }).first();
  if (!efir) return false;

  if (efir.pdf_url) {
    const filePath = path.resolve(__dirname, "../..", efir.pdf_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await db(TABLE).where({ id }).delete();
  return true;
}
