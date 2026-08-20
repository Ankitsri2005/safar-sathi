import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE audit_event AS ENUM (
        'login', 'logout', 'tourist_record_access', 'id_verification',
        'alert_viewing', 'alert_resolution', 'zone_creation', 'zone_modification',
        'user_modification', 'user_creation', 'user_disable', 'password_reset',
        'efir_generation', 'data_export', 'system_config', 'escalation'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.schema.createTable("audit_logs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").references("id").inTable("users").onDelete("SET NULL");
    t.string("user_name", 255);
    t.string("user_role", 50);
    t.specificType("event_type", "audit_event").notNullable();
    t.string("resource_type", 100);
    t.uuid("resource_id");
    t.jsonb("details");
    t.string("ip_address", 45);
    t.string("user_agent", 500);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC)`);
  await knex.schema.raw(`CREATE INDEX idx_audit_event ON audit_logs(event_type, created_at DESC)`);
  await knex.schema.raw(`CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id)`);
  await knex.schema.raw(`CREATE INDEX idx_audit_created ON audit_logs(created_at DESC)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_logs");
  await knex.raw("DROP TYPE IF EXISTS audit_event CASCADE");
}
