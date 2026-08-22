import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../config/database";
import { User, UserRole } from "../types";
import { logAudit } from "./audit";

const TABLE = "users";

/**
 * Create a new user.
 */
export async function createUser(data: {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  jurisdiction: string;
  email?: string;
  phone?: string;
}): Promise<User> {
  const id = uuidv4();
  const password_hash = await bcrypt.hash(data.password, 12);
  const [user] = await db(TABLE)
    .insert({ id, ...data, password_hash, is_active: true })
    .returning("*");

  await logAudit({
    event_type: "user_creation",
    resource_type: "user",
    resource_id: id,
    details: { username: data.username, role: data.role, full_name: data.full_name },
  });

  return user;
}

/**
 * Find user by username.
 */
export async function findByUsername(username: string): Promise<User | null> {
  const user = await db(TABLE).where({ username }).first();
  return user || null;
}

/**
 * Find user by ID (without password).
 */
export async function findById(id: string): Promise<Omit<User, "password_hash"> | null> {
  const user = await db(TABLE)
    .where({ id })
    .select("id", "username", "full_name", "role", "jurisdiction", "is_active", "created_at", "updated_at")
    .first();
  return user || null;
}

/**
 * List all users (without passwords).
 */
export async function listUsers(filters?: {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Omit<User, "password_hash">[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;

  let query = db(TABLE).select(
    "id", "username", "full_name", "role", "jurisdiction",
    "is_active", "created_at", "updated_at"
  );

  if (filters?.role) query = query.where("role", filters.role);
  if (filters?.is_active !== undefined) query = query.where("is_active", filters.is_active);
  if (filters?.search) {
    query = query.where(function () {
      this.where("full_name", "ilike", `%${filters.search}%`)
        .orWhere("username", "ilike", `%${filters.search}%`)
        .orWhere("jurisdiction", "ilike", `%${filters.search}%`);
    });
  }

  const countResult = await query.clone().count("id as total").first();
  const total = parseInt((countResult as any)?.total || "0", 10);

  const data = await query.orderBy("created_at", "desc").offset((page - 1) * limit).limit(limit);
  return { data, total };
}

/**
 * Update user details.
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<User, "full_name" | "role" | "jurisdiction" | "is_active">>
): Promise<Omit<User, "password_hash"> | null> {
  const [user] = await db(TABLE)
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning(["id", "username", "full_name", "role", "jurisdiction", "is_active", "created_at", "updated_at"]);

  if (user) {
    await logAudit({
      event_type: data.is_active === false ? "user_disable" : "user_modification",
      resource_type: "user",
      resource_id: id,
      details: { changes: data },
    });
  }

  return user || null;
}

/**
 * Reset a user's password.
 */
export async function resetPassword(id: string, newPassword: string): Promise<boolean> {
  const password_hash = await bcrypt.hash(newPassword, 12);
  const result = await db(TABLE).where({ id }).update({
    password_hash,
    updated_at: new Date(),
  });

  if (result > 0) {
    await logAudit({
      event_type: "password_reset",
      resource_type: "user",
      resource_id: id,
      details: { action: "password_reset" },
    });
    return true;
  }
  return false;
}

/**
 * Disable a user account.
 */
export async function disableUser(id: string): Promise<Omit<User, "password_hash"> | null> {
  return updateUser(id, { is_active: false } as any);
}

/**
 * Enable a user account.
 */
export async function enableUser(id: string): Promise<Omit<User, "password_hash"> | null> {
  return updateUser(id, { is_active: true } as any);
}

/**
 * Verify password for login.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generate JWT token.
 */
export function generateToken(user: User): string {
  const jwt = require("jsonwebtoken");
  const { config } = require("../config");
  const payload = { userId: user.id, role: user.role };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

/**
 * Delete a user (soft-disable).
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await db(TABLE).where({ id }).update({ is_active: false, updated_at: new Date() });
  return result > 0;
}
