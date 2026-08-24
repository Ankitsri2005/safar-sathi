import { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
  const users = [
    {
      username: "admin",
      password: "admin123",
      full_name: "System Admin",
      role: "admin",
      jurisdiction: "National",
      is_active: true,
    },
    {
      username: "police1",
      password: "police123",
      full_name: "Sub-Inspector Tashi Namgyal",
      role: "police",
      jurisdiction: "East Sikkim",
      is_active: true,
    },
    {
      username: "officer1",
      password: "police123",
      full_name: "Inspector Rajesh Kumar",
      role: "police",
      jurisdiction: "Sikkim",
      is_active: true,
    },
    {
      username: "tourism1",
      password: "tourism123",
      full_name: "Tourism Officer Priya Sharma",
      role: "tourism_dept",
      jurisdiction: "Sikkim",
      is_active: true,
    },
  ];

  for (const u of users) {
    const existing = await knex("users").where({ username: u.username }).first();
    if (!existing) {
      const password_hash = await bcrypt.hash(u.password, 12);
      await knex("users").insert({
        username: u.username,
        password_hash,
        full_name: u.full_name,
        role: u.role,
        jurisdiction: u.jurisdiction,
        is_active: u.is_active,
      });
      console.log(`Seeded user: ${u.username}`);
    } else {
      console.log(`User already exists: ${u.username}`);
    }
  }
}

