import { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
  // Clean tables
  await knex("efirs").del();
  await knex("location_pings").del();
  await knex("alerts").del();
  await knex("zones").del();
  await knex("blockchain_ledger").del();
  await knex("digital_ids").del();
  await knex("tourists").del();
  await knex("users").del();

  // Seed admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await knex("users").insert({
    username: "admin",
    password_hash: adminPassword,
    full_name: "System Admin",
    role: "admin",
    jurisdiction: "National",
    is_active: true,
  });

  // Seed police officer
  const policePassword = await bcrypt.hash("police123", 12);
  await knex("users").insert({
    username: "officer1",
    password_hash: policePassword,
    full_name: "Inspector Rajesh Kumar",
    role: "police",
    jurisdiction: "Sikkim",
    is_active: true,
  });

  // Seed tourism dept staff
  const tourismPassword = await bcrypt.hash("tourism123", 12);
  await knex("users").insert({
    username: "tourism1",
    password_hash: tourismPassword,
    full_name: "Tourism Officer Priya Sharma",
    role: "tourism_dept",
    jurisdiction: "Sikkim",
    is_active: true,
  });

  console.log("Seed data inserted:");
  console.log("  admin / admin123");
  console.log("  officer1 / police123");
  console.log("  tourism1 / tourism123");
}
