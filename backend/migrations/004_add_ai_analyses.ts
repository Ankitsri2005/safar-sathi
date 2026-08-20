import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("ai_analyses", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("tourist_id").references("id").inTable("tourists").onDelete("CASCADE");
    table.float("anomaly_score").notNullable();
    table.string("risk_level").notNullable();
    table.jsonb("reasons").notNullable();
    table.jsonb("related_points").notNullable();
    table.text("recommended_action").notNullable();
    table.string("model_version").notNullable();
    table.jsonb("features");
    table.jsonb("contributions");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_ai_analyses_tourist
    ON ai_analyses (tourist_id, created_at DESC);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_ai_analyses_risk
    ON ai_analyses (risk_level, created_at DESC);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ai_analyses");
}
