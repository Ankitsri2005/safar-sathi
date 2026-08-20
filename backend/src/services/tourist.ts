import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import db from "../config/database";
import { Tourist, DigitalId, IdStatus, ItineraryItem } from "../types";
import * as blockchain from "./blockchain";

const TOURIST_TABLE = "tourists";
const DIGITAL_ID_TABLE = "digital_ids";

export async function registerTourist(data: {
  full_name: string;
  id_type: string;
  id_number: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  trip_start: string;
  trip_end: string;
  itinerary: ItineraryItem[];
}): Promise<{ tourist: Tourist; digitalId: DigitalId; qrDataUrl: string }> {
  const touristId = uuidv4();

  // Store tourist record
  const [tourist] = await db(TOURIST_TABLE)
    .insert({
      id: touristId,
      full_name: data.full_name,
      id_type: data.id_type,
      id_number: data.id_number,
      phone: data.phone,
      email: data.email,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      trip_start: data.trip_start,
      trip_end: data.trip_end,
      itinerary: JSON.stringify(data.itinerary),
    })
    .returning("*");

  // Create blockchain block
  const block = await blockchain.createBlock(touristId, {
    touristId,
    kycRef: `${data.id_type}:${data.id_number}`,
    itinerary: data.itinerary,
    tripStart: data.trip_start,
    tripEnd: data.trip_end,
  });

  // Generate QR code with touristId + blockId
  const qrPayload = JSON.stringify({ touristId, blockId: block.block_id });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 300 });

  // Create digital ID record
  const [digitalId] = await db(DIGITAL_ID_TABLE)
    .insert({
      id: uuidv4(),
      tourist_id: touristId,
      block_id: block.block_id,
      qr_data: qrPayload,
      status: IdStatus.ACTIVE,
      issued_at: new Date(),
      expires_at: data.trip_end,
    })
    .returning("*");

  return { tourist, digitalId, qrDataUrl };
}

export async function verifyDigitalId(
  touristId: string,
  blockId: string
): Promise<{
  valid: boolean;
  status: string;
  tourist: Partial<Tourist> | null;
  blockchainResult: Awaited<ReturnType<typeof blockchain.verifyBlock>>;
}> {
  // Fetch the digital ID
  const digitalId = await db(DIGITAL_ID_TABLE)
    .where({ tourist_id: touristId, block_id: blockId })
    .first();

  if (!digitalId) {
    return {
      valid: false,
      status: "not_found",
      tourist: null,
      blockchainResult: {
        valid: false,
        chainIntact: false,
        dataIntact: false,
        expired: false,
        block: null,
      },
    };
  }

  // Verify blockchain
  const blockchainResult = await blockchain.verifyBlock(blockId);

  // Fetch tourist (masked)
  const tourist = await db(TOURIST_TABLE).where({ id: touristId }).first();

  const maskedTourist = tourist
    ? {
        full_name: tourist.full_name,
        photo_url: tourist.photo_url,
        id_type: tourist.id_type,
      }
    : null;

  return {
    valid: blockchainResult.valid && digitalId.status === IdStatus.ACTIVE,
    status: blockchainResult.expired ? "expired" : digitalId.status,
    tourist: maskedTourist,
    blockchainResult,
  };
}

export async function getDigitalIdByTouristId(
  touristId: string
): Promise<DigitalId | null> {
  const record = await db(DIGITAL_ID_TABLE)
    .where({ tourist_id: touristId })
    .orderBy("issued_at", "desc")
    .first();
  return record || null;
}

export async function listDigitalIds(filters?: {
  status?: IdStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: (DigitalId & { tourist_name: string })[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  let query = db(DIGITAL_ID_TABLE)
    .join(TOURIST_TABLE, "digital_ids.tourist_id", "tourists.id")
    .select(
      "digital_ids.*",
      "tourists.full_name as tourist_name",
      "tourists.id_type"
    );

  if (filters?.status) {
    query = query.where("digital_ids.status", filters.status);
  }
  if (filters?.search) {
    query = query.where(function () {
      this.whereILike("tourists.full_name", `%${filters.search}%`)
        .orWhereILike("tourists.id_number", `%${filters.search}%`);
    });
  }

  const countResult = await query.clone().count("digital_ids.id as total").first();
  const total = parseInt((countResult as any)?.total || "0", 10);

  const data = await query
    .orderBy("digital_ids.issued_at", "desc")
    .offset((page - 1) * limit)
    .limit(limit);

  return { data, total };
}

export async function getTouristById(id: string): Promise<Tourist | null> {
  const tourist = await db(TOURIST_TABLE).where({ id }).first();
  return tourist || null;
}

export async function recordLocationPing(data: {
  tourist_id: string;
  lat: number;
  lng: number;
}): Promise<void> {
  await db("location_pings").insert({
    id: uuidv4(),
    tourist_id: data.tourist_id,
    lat: data.lat,
    lng: data.lng,
    source: "phone",
    timestamp: new Date(),
  });

  // Broadcast location update to connected dashboard clients
  try {
    const { io } = await import("../server");
    io.emit("location:update", {
      tourist_id: data.tourist_id,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  } catch {}
}
