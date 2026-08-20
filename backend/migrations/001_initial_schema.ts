import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Enable PostGIS extension
  await knex.raw("CREATE EXTENSION IF NOT EXISTS postgis");

  // Users table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("username").unique().notNullable();
    table.string("password_hash").notNullable();
    table.string("full_name").notNullable();
    table.enum("role", ["police", "tourism_dept", "admin"]).notNullable();
    table.string("jurisdiction").notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  // Tourists table
  await knex.schema.createTable("tourists", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("full_name").notNullable();
    table.string("id_type").notNullable();
    table.string("id_number").notNullable();
    table.string("phone").notNullable();
    table.string("email").notNullable();
    table.string("emergency_contact_name").notNullable();
    table.string("emergency_contact_phone").notNullable();
    table.string("photo_url");
    table.date("trip_start").notNullable();
    table.date("trip_end").notNullable();
    table.jsonb("itinerary").notNullable();
    table.timestamps(true, true);
  });

  // Digital IDs table
  await knex.schema.createTable("digital_ids", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("tourist_id").references("id").inTable("tourists").onDelete("CASCADE");
    table.uuid("block_id").notNullable();
    table.text("qr_data").notNullable();
    table.enum("status", ["active", "expired", "revoked"]).defaultTo("active");
    table.timestamp("issued_at").defaultTo(knex.fn.now());
    table.timestamp("expires_at").notNullable();
  });

  // Blockchain ledger table
  await knex.schema.createTable("blockchain_ledger", (table) => {
    table.uuid("block_id").primary();
    table.uuid("tourist_id").references("id").inTable("tourists").onDelete("CASCADE");
    table.string("data_hash", 64).notNullable();
    table.timestamp("issue_timestamp").notNullable();
    table.timestamp("expiry_timestamp").notNullable();
    table.string("previous_block_hash", 64).notNullable();
    table.string("current_block_hash", 64).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Zones table (with PostGIS polygon)
  await knex.schema.createTable("zones", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.enum("risk_level", ["low", "medium", "high", "restricted"]).notNullable();
    table.text("description");
    table.jsonb("polygon_geojson").notNullable();
    table.timestamps(true, true);
  });

  // Alerts table
  await knex.schema.createTable("alerts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("tourist_id").references("id").inTable("tourists").onDelete("CASCADE");
    table.enum("alert_type", ["panic", "anomaly", "geofence_breach"]).notNullable();
    table.decimal("location_lat", 10, 7).notNullable();
    table.decimal("location_lng", 10, 7).notNullable();
    table.string("location_name");
    table.enum("status", ["new", "under_review", "resolved"]).defaultTo("new");
    table.text("message");
    table.uuid("resolved_by").references("id").inTable("users");
    table.timestamp("resolved_at");
    table.timestamps(true, true);
  });

  // Location pings table
  await knex.schema.createTable("location_pings", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("tourist_id").references("id").inTable("tourists").onDelete("CASCADE");
    table.decimal("lat", 10, 7).notNullable();
    table.decimal("lng", 10, 7).notNullable();
    table.enum("source", ["phone"]).defaultTo("phone");
    table.timestamp("timestamp").defaultTo(knex.fn.now());
    table.index(["tourist_id", "timestamp"]);
  });

  // E-FIRs table
  await knex.schema.createTable("efirs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("alert_id").references("id").inTable("alerts").onDelete("CASCADE");
    table.uuid("tourist_id").references("id").inTable("tourists").onDelete("CASCADE");
    table.enum("status", ["draft", "filed", "closed"]).defaultTo("draft");
    table.string("pdf_url");
    table.uuid("filed_by").references("id").inTable("users");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("efirs");
  await knex.schema.dropTableIfExists("location_pings");
  await knex.schema.dropTableIfExists("alerts");
  await knex.schema.dropTableIfExists("zones");
  await knex.schema.dropTableIfExists("blockchain_ledger");
  await knex.schema.dropTableIfExists("digital_ids");
  await knex.schema.dropTableIfExists("tourists");
  await knex.schema.dropTableIfExists("users");
}
