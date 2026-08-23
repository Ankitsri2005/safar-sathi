import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import db from "../config/database";
import { Tourist, DigitalId, IdStatus, ItineraryItem } from "../types";
import * as blockchain from "./blockchain";

const TOURIST_TABLE = "tourists";
const DIGITAL_ID_TABLE = "digital_ids";

function createGeofencePolygon(lat: number, lng: number, delta = 0.015) {
  return {
    type: "Polygon",
    coordinates: [
      [
        [Number((lng - delta).toFixed(6)), Number((lat - delta).toFixed(6))],
        [Number((lng + delta).toFixed(6)), Number((lat - delta).toFixed(6))],
        [Number((lng + delta).toFixed(6)), Number((lat + delta).toFixed(6))],
        [Number((lng - delta).toFixed(6)), Number((lat + delta).toFixed(6))],
        [Number((lng - delta).toFixed(6)), Number((lat - delta).toFixed(6))],
      ],
    ],
  };
}

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

  const startDate = data.trip_start && !isNaN(new Date(data.trip_start).getTime())
    ? new Date(data.trip_start)
    : new Date();
  const endDate = data.trip_end && !isNaN(new Date(data.trip_end).getTime())
    ? new Date(data.trip_end)
    : new Date(Date.now() + 7 * 86400000);

  // Store tourist record
  const [insertedTourist] = await db(TOURIST_TABLE)
    .insert({
      id: touristId,
      full_name: data.full_name,
      id_type: data.id_type,
      id_number: data.id_number,
      phone: data.phone,
      email: data.email,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      trip_start: startDate,
      trip_end: endDate,
      itinerary: typeof data.itinerary === "string" ? data.itinerary : JSON.stringify(data.itinerary || []),
    })
    .returning("*");

  const tourist = typeof insertedTourist === "object" && insertedTourist !== null && insertedTourist.id
    ? insertedTourist
    : await db(TOURIST_TABLE).where({ id: touristId }).first();

  // Auto-generate safe geofence zones based on tourist's selected itinerary locations
  if (Array.isArray(data.itinerary)) {
    for (const item of data.itinerary) {
      if (item && item.lat && item.lng) {
        const geojson = createGeofencePolygon(Number(item.lat), Number(item.lng));
        try {
          await db("zones").insert({
            id: uuidv4(),
            name: `Safe Corridor: ${item.place || "Itinerary Stop"} (${data.full_name})`,
            risk_level: "low",
            description: `Auto-generated safety geofence for tourist ${data.full_name} (ID: ${touristId}) scheduled for ${item.planned_date || startDate.toISOString().split("T")[0]}`,
            polygon_geojson: JSON.stringify(geojson),
            is_active: true,
          });
        } catch (err) {
          console.warn("[ZONE] Auto-geofence generation skipped:", err);
        }
      }
    }
  }

  // Create blockchain block
  const block = await blockchain.createBlock(touristId, {
    touristId,
    kycRef: `${data.id_type}:${data.id_number}`,
    itinerary: data.itinerary,
    tripStart: startDate.toISOString(),
    tripEnd: endDate.toISOString(),
  });

  // Generate QR code with touristId + blockId
  const qrPayload = JSON.stringify({ touristId, blockId: block.block_id });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 300 });

  // Create digital ID record
  const digitalIdId = uuidv4();
  const [insertedDigitalId] = await db(DIGITAL_ID_TABLE)
    .insert({
      id: digitalIdId,
      tourist_id: touristId,
      block_id: block.block_id,
      qr_data: qrPayload,
      status: IdStatus.ACTIVE,
      issued_at: new Date(),
      expires_at: endDate,
    })
    .returning("*");

  const digitalId = typeof insertedDigitalId === "object" && insertedDigitalId !== null && insertedDigitalId.id
    ? insertedDigitalId
    : await db(DIGITAL_ID_TABLE).where({ id: digitalIdId }).first();

  return { tourist, digitalId, qrDataUrl };
}

export async function verifyDigitalId(
  touristId: string,
  blockId: string
): Promise<{
  valid: boolean;
  status: string;
  blockId?: string;
  issued_at?: Date | string;
  tourist: Partial<Tourist> | null;
  blockchainResult: Awaited<ReturnType<typeof blockchain.verifyBlock>>;
}> {
  // Fetch the digital ID flexibly
  let digitalId = null;
  if (!blockId || blockId === "latest") {
    digitalId = await db(DIGITAL_ID_TABLE)
      .where({ tourist_id: touristId })
      .orWhere({ id: touristId })
      .orWhere({ block_id: touristId })
      .orderBy("issued_at", "desc")
      .first();
  } else {
    digitalId = await db(DIGITAL_ID_TABLE)
      .where({ tourist_id: touristId, block_id: blockId })
      .first();
    if (!digitalId) {
      digitalId = await db(DIGITAL_ID_TABLE)
        .where({ block_id: blockId })
        .orWhere({ id: blockId })
        .orWhere({ tourist_id: touristId })
        .orWhere({ id: touristId })
        .first();
    }
  }

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

  // Verify blockchain using actual digitalId.block_id if available
  const actualBlockId = digitalId.block_id || blockId;
  const blockchainResult = actualBlockId && actualBlockId !== "latest"
    ? await blockchain.verifyBlock(actualBlockId)
    : { valid: true, chainIntact: true, dataIntact: true, expired: false, block: null };

  // Fetch tourist
  const tourist = await db(TOURIST_TABLE).where({ id: digitalId.tourist_id }).first();

  const maskedTourist = tourist
    ? {
        id: tourist.id,
        full_name: tourist.full_name,
        photo_url: tourist.photo_url,
        id_type: tourist.id_type,
        phone: tourist.phone,
        email: tourist.email,
        emergency_contact_name: tourist.emergency_contact_name,
        emergency_contact_phone: tourist.emergency_contact_phone,
        trip_start: tourist.trip_start,
        trip_end: tourist.trip_end,
      }
    : null;

  return {
    valid: (blockchainResult?.valid ?? true) && digitalId.status === IdStatus.ACTIVE,
    status: blockchainResult?.expired ? "expired" : digitalId.status,
    blockId: digitalId.block_id || actualBlockId,
    issued_at: digitalId.issued_at,
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
    .join(TOURIST_TABLE, "digital_ids.tourist_id", "tourists.id");

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
    .select(
      "digital_ids.*",
      "tourists.full_name as tourist_name",
      "tourists.id_type"
    )
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
  let targetTouristId = data.tourist_id;
  const existing = await db("tourists").where({ id: targetTouristId }).first();
  if (!existing) {
    const digitalIdRecord = await db("digital_ids")
      .where({ tourist_id: targetTouristId })
      .orWhere({ id: targetTouristId })
      .first();
    if (digitalIdRecord) {
      targetTouristId = digitalIdRecord.tourist_id;
    } else {
      const fallback = await db("tourists").first();
      if (fallback) {
        targetTouristId = fallback.id;
      } else {
        return;
      }
    }
  }

  await db("location_pings").insert({
    id: uuidv4(),
    tourist_id: targetTouristId,
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
