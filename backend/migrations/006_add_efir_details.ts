import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create E-FIR resolution status type
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE efir_status AS ENUM (
        'draft',
        'generated',
        'filed',
        'closed',
        'cancelled'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Add new E-FIR columns
  await knex.schema.alterTable("efirs", (t) => {
    t.string("efir_number", 30).unique();
    t.string("incident_type", 50);
    t.specificType("incident_severity", "alert_severity");
    t.timestamp("incident_date");
    t.decimal("last_known_lat", 10, 7);
    t.decimal("last_known_lng", 10, 7);
    t.string("last_known_location_name", 255);
    t.jsonb("location_history");
    t.jsonb("officer_info");
    t.text("incident_description");
    t.specificType("resolution_status", "efir_status").defaultTo("draft");
    t.string("verification_status", 50).defaultTo("pending");
    t.string("blockchain_hash", 255);
  });

  // Generate efir_number for existing records
  const existing = await knex("efirs").select("id", "created_at");
  for (let i = 0; i < existing.length; i++) {
    const num = `EFIR-${new Date(existing[i].created_at).getFullYear()}-${String(i + 1).padStart(4, "0")}`;
    await knex("efirs").where({ id: existing[i].id }).update({ efir_number: num });
  }

  // Add indexes
  await knex.schema.raw(`CREATE INDEX idx_efirs_number ON efirs(efir_number)`);
  await knex.schema.raw(`CREATE INDEX idx_efirs_tourist ON efirs(tourist_id)`);
  await knex.schema.raw(`CREATE INDEX idx_efirs_alert ON efirs(alert_id)`);
  await knex.schema.raw(`CREATE INDEX idx_efirs_status ON efirs(status)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("efirs", (t) => {
    t.dropColumns([
      "efir_number", "incident_type", "incident_severity", "incident_date",
      "last_known_lat", "last_known_lng", "last_known_location_name",
      "location_history", "officer_info", "incident_description",
      "resolution_status", "verification_status", "blockchain_hash",
    ]);
  });
  await knex.raw(`DROP TYPE IF EXISTS efir_status;`);
}
