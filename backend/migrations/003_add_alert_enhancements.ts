import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add severity column to alerts
  await knex.schema.alterTable("alerts", (table) => {
    table.string("severity").defaultTo("medium");
  });

  // Migrate existing alert_type values to new enum
  // First, add new values to the enum (PostgreSQL doesn't support ALTER TYPE directly)
  // We need to recreate the enum columns
  await knex.raw(`
    ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_alert_type_check;
  `);

  await knex.raw(`
    ALTER TABLE alerts ADD CONSTRAINT alerts_alert_type_check
    CHECK (alert_type IN ('panic', 'restricted_zone_entry', 'high_risk_zone_entry', 'no_location_update', 'route_deviation', 'prolonged_stop', 'manual'));
  `);

  await knex.raw(`
    ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_status_check;
  `);

  await knex.raw(`
    ALTER TABLE alerts ADD CONSTRAINT alerts_status_check
    CHECK (status IN ('new', 'acknowledged', 'under_review', 'escalated', 'resolved', 'false_positive'));
  `);

  // Create alert_cooldowns table for duplicate prevention
  await knex.schema.createTable("alert_cooldowns", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("tourist_id").references("id").inTable("tourists").onDelete("CASCADE");
    table.string("alert_type").notNullable();
    table.timestamp("last_fired_at").defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.unique(["tourist_id", "alert_type"]);
  });

  // Index for fast cooldown lookups
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_alert_cooldowns_lookup
    ON alert_cooldowns (tourist_id, alert_type, last_fired_at);
  `);

  // Create alert_timeline table for incident timeline
  await knex.schema.createTable("alert_timeline", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("alert_id").references("id").inTable("alerts").onDelete("CASCADE");
    table.string("action").notNullable();
    table.string("performed_by");
    table.text("notes");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_alert_timeline_alert_id
    ON alert_timeline (alert_id, created_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("alert_timeline");
  await knex.schema.dropTableIfExists("alert_cooldowns");
  await knex.schema.alterTable("alerts", (table) => {
    table.dropColumn("severity");
  });
  // Restore original enum constraints
  await knex.raw(`ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_alert_type_check`);
  await knex.raw(`ALTER TABLE alerts ADD CONSTRAINT alerts_alert_type_check CHECK (alert_type IN ('panic', 'anomaly', 'geofence_breach'))`);
  await knex.raw(`ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_status_check`);
  await knex.raw(`ALTER TABLE alerts ADD CONSTRAINT alerts_status_check CHECK (status IN ('new', 'under_review', 'resolved'))`);
}
