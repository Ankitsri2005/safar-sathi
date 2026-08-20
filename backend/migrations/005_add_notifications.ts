import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Notification types
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE notification_type AS ENUM (
        'panic_alert', 'restricted_zone_entry', 'high_risk_zone_entry',
        'ai_anomaly', 'alert_escalation', 'digital_id_expiry',
        'efir_generation', 'system'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE notification_channel AS ENUM (
        'in_app', 'push', 'sms', 'email', 'escalation'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE notification_status AS ENUM (
        'pending', 'sent', 'delivered', 'failed', 'retrying'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Notifications table
  await knex.schema.createTable("notifications", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("recipient_id").references("id").inTable("users").onDelete("CASCADE");
    t.string("recipient_phone", 20);
    t.string("recipient_email", 255);
    t.specificType("notification_type", "notification_type").notNullable();
    t.specificType("channel", "notification_channel").notNullable();
    t.string("title", 255).notNullable();
    t.text("body").notNullable();
    t.jsonb("metadata");
    t.specificType("status", "notification_status").defaultTo("pending");
    t.text("error_message");
    t.integer("retry_count").defaultTo(0);
    t.integer("max_retries").defaultTo(3);
    t.timestamp("sent_at");
    t.timestamp("delivered_at");
    t.timestamp("next_retry_at");
    t.boolean("read").defaultTo(false);
    t.timestamp("read_at");
    t.timestamps(true, true);
  });

  await knex.schema.raw(
    `CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC)`
  );
  await knex.schema.raw(
    `CREATE INDEX idx_notifications_status ON notifications(status, next_retry_at) WHERE status IN ('pending', 'retrying')`
  );
  await knex.schema.raw(
    `CREATE INDEX idx_notifications_type ON notifications(notification_type, created_at DESC)`
  );

  // Notification preferences per user
  await knex.schema.createTable("notification_preferences", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").references("id").inTable("users").onDelete("CASCADE").unique();
    t.boolean("panic_alert_push").defaultTo(true);
    t.boolean("panic_alert_sms").defaultTo(true);
    t.boolean("panic_alert_in_app").defaultTo(true);
    t.boolean("restricted_zone_push").defaultTo(true);
    t.boolean("restricted_zone_sms").defaultTo(true);
    t.boolean("restricted_zone_in_app").defaultTo(true);
    t.boolean("high_risk_zone_push").defaultTo(true);
    t.boolean("high_risk_zone_sms").defaultTo(false);
    t.boolean("high_risk_zone_in_app").defaultTo(true);
    t.boolean("ai_anomaly_push").defaultTo(true);
    t.boolean("ai_anomaly_sms").defaultTo(false);
    t.boolean("ai_anomaly_in_app").defaultTo(true);
    t.boolean("escalation_push").defaultTo(true);
    t.boolean("escalation_sms").defaultTo(true);
    t.boolean("escalation_in_app").defaultTo(true);
    t.boolean("digital_id_expiry_push").defaultTo(true);
    t.boolean("digital_id_expiry_in_app").defaultTo(true);
    t.boolean("efir_push").defaultTo(true);
    t.boolean("efir_in_app").defaultTo(true);
    t.boolean("sms_enabled").defaultTo(true);
    t.boolean("push_enabled").defaultTo(true);
    t.timestamps(true, true);
  });

  // Escalation rules
  await knex.schema.createTable("escalation_rules", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("name", 100).notNullable();
    t.specificType("alert_type", "alert_type_enum").nullable();
    t.specificType("severity", "alert_severity").nullable();
    t.integer("escalate_after_minutes").notNullable().defaultTo(10);
    t.uuid("escalate_to_user_id").references("id").inTable("users").onDelete("SET NULL");
    t.string("escalate_to_role", 50);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.raw(
    `CREATE INDEX idx_escalation_rules_active ON escalation_rules(is_active) WHERE is_active = true`
  );

  // Escalation log
  await knex.schema.createTable("escalation_log", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("alert_id").references("id").inTable("alerts").onDelete("CASCADE");
    t.uuid("escalated_from_user_id").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("escalated_to_user_id").references("id").inTable("users").onDelete("SET NULL");
    t.integer("escalation_level").defaultTo(1);
    t.text("reason");
    t.timestamps(true, true);
  });

  await knex.schema.raw(
    `CREATE INDEX idx_escalation_log_alert ON escalation_log(alert_id)`
  );

  // Insert default escalation rules
  await knex("escalation_rules").insert([
    {
      name: "Panic → Immediate escalation",
      alert_type: "panic",
      escalate_after_minutes: 0,
      escalate_to_role: "admin",
      is_active: true,
    },
    {
      name: "Critical alert escalation",
      severity: "critical",
      escalate_after_minutes: 5,
      escalate_to_role: "admin",
      is_active: true,
    },
    {
      name: "High severity escalation",
      severity: "high",
      escalate_after_minutes: 15,
      escalate_to_role: "tourism_dept",
      is_active: true,
    },
    {
      name: "Unacknowledged medium alert",
      severity: "medium",
      escalate_after_minutes: 30,
      escalate_to_role: "tourism_dept",
      is_active: true,
    },
    {
      name: "Default escalation",
      escalate_after_minutes: 60,
      escalate_to_role: "admin",
      is_active: true,
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("escalation_log");
  await knex.schema.dropTableIfExists("escalation_rules");
  await knex.schema.dropTableIfExists("notification_preferences");
  await knex.schema.dropTableIfExists("notifications");
  await knex.raw("DROP TYPE IF EXISTS notification_status CASCADE");
  await knex.raw("DROP TYPE IF EXISTS notification_channel CASCADE");
  await knex.raw("DROP TYPE IF EXISTS notification_type CASCADE");
}
