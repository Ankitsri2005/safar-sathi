import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // ── user_devices: Push notification device tokens ──
  await knex.schema.createTable("user_devices", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("device_token", 500).notNullable();
    t.string("platform", 20).notNullable().defaultTo("web"); // web | android | ios
    t.boolean("is_active").notNullable().defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.raw(
    `CREATE UNIQUE INDEX idx_user_devices_token ON user_devices(device_token)`
  );
  await knex.schema.raw(
    `CREATE INDEX idx_user_devices_user ON user_devices(user_id, is_active)`
  );

  // ── tracking_sessions: Tourist monitoring sessions ──
  await knex.schema.createTable("tracking_sessions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("tourist_id").notNullable().references("id").inTable("tourists").onDelete("CASCADE");
    t.timestamp("started_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("ended_at");
    t.string("status", 20).notNullable().defaultTo("active"); // active | ended | expired
    t.string("started_by", 100); // authority who initiated
    t.jsonb("metadata"); // device info, consent, etc.
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.raw(
    `CREATE INDEX idx_tracking_sessions_tourist ON tracking_sessions(tourist_id, status)`
  );
  await knex.schema.raw(
    `CREATE INDEX idx_tracking_sessions_status ON tracking_sessions(status, started_at DESC)`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tracking_sessions");
  await knex.schema.dropTableIfExists("user_devices");
}
