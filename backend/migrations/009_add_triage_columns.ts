import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("alerts", (table) => {
    table.string("triage_status").defaultTo("pending");
    table.jsonb("triage_transcript").nullable();
    table.string("triage_recording_url").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("alerts", (table) => {
    table.dropColumn("triage_status");
    table.dropColumn("triage_transcript");
    table.dropColumn("triage_recording_url");
  });
}
