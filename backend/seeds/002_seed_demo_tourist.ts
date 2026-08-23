import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

/**
 * Seeds one DEMO tourist with today's trip dates so the Critical Alert Map
 * always has an active tourist to display during presentations.
 */
export async function seed(knex: Knex): Promise<void> {
  const DEMO_ID_NUMBER = "DEMO-SIH-2024";

  // Check if already seeded
  const existing = await knex("tourists").where({ id_number: DEMO_ID_NUMBER }).first();
  if (existing) {
    // Refresh trip dates to today → today+7 so it's always in the active window
    const tripStart = new Date();
    tripStart.setHours(0, 0, 0, 0);
    const tripEnd = new Date();
    tripEnd.setDate(tripEnd.getDate() + 7);
    tripEnd.setHours(23, 59, 59, 0);

    await knex("tourists")
      .where({ id: existing.id })
      .update({ trip_start: tripStart, trip_end: tripEnd, current_lat: 27.3314, current_lng: 88.6138, updated_at: new Date() });

    console.log("Demo tourist trip dates refreshed:", DEMO_ID_NUMBER);
    return;
  }

  // Create a fresh demo tourist
  const touristId = uuidv4();
  const blockId = uuidv4();
  const digitalIdId = uuidv4();

  const tripStart = new Date();
  tripStart.setHours(0, 0, 0, 0);
  const tripEnd = new Date();
  tripEnd.setDate(tripEnd.getDate() + 7);
  tripEnd.setHours(23, 59, 59, 0);

  await knex("tourists").insert({
    id: touristId,
    full_name: "SIH Demo Tourist",
    id_type: "aadhaar",
    id_number: DEMO_ID_NUMBER,
    phone: "9999999999",
    email: "demo@sih2024.gov.in",
    emergency_contact_name: "SIH Control Room",
    emergency_contact_phone: "9999999998",
    trip_start: tripStart,
    trip_end: tripEnd,
    itinerary: JSON.stringify([
      { place: "Gangtok MG Marg", lat: 27.3314, lng: 88.6138, planned_date: new Date().toISOString().split("T")[0] },
      { place: "Nathula Pass", lat: 27.3869, lng: 88.8386, planned_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0] },
      { place: "Tsomgo Lake", lat: 27.3722, lng: 88.7627, planned_date: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0] },
    ]),
  });

  // Generate block hash
  const payload = JSON.stringify({ touristId, blockId, issued: new Date().toISOString() });
  const hash = crypto.createHash("sha256").update(payload).digest("hex");

  await knex("digital_ids").insert({
    id: digitalIdId,
    tourist_id: touristId,
    block_id: blockId,
    qr_data: JSON.stringify({ touristId, blockId }),
    status: "active",
    issued_at: new Date(),
    expires_at: tripEnd,
  });

  // Insert to blockchain ledger
  await knex("blockchain_ledger").insert({
    id: uuidv4(),
    block_id: blockId,
    tourist_id: touristId,
    digital_id_id: digitalIdId,
    payload_hash: hash,
    previous_hash: "GENESIS",
    timestamp: new Date(),
  }).catch(() => {}); // table may not exist in all migrations

  // Insert itinerary geofences
  const stops = [
    { place: "Gangtok MG Marg", lat: 27.3314, lng: 88.6138 },
    { place: "Nathula Pass", lat: 27.3869, lng: 88.8386 },
    { place: "Tsomgo Lake", lat: 27.3722, lng: 88.7627 },
  ];

  for (const stop of stops) {
    const delta = 0.015;
    const polygon = {
      type: "Polygon",
      coordinates: [[
        [stop.lng - delta, stop.lat - delta],
        [stop.lng + delta, stop.lat - delta],
        [stop.lng + delta, stop.lat + delta],
        [stop.lng - delta, stop.lat + delta],
        [stop.lng - delta, stop.lat - delta],
      ]],
    };
    await knex("zones").insert({
      id: uuidv4(),
      name: `Safe Corridor: ${stop.place} (SIH Demo Tourist)`,
      risk_level: "low",
      description: `Demo geofence for SIH judges presentation — ${stop.place}`,
      polygon_geojson: JSON.stringify(polygon),
      is_active: true,
    }).catch(() => {});
  }

  console.log("Demo tourist seeded successfully for SIH presentation:", touristId);
}
