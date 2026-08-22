import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/database";
import { config } from "../config";
import { User, UserRole, JwtPayload } from "../types";

const TABLE = "users";

export async function createUser(data: {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  jurisdiction: string;
}): Promise<User> {
  const id = uuidv4();
  const password_hash = await bcrypt.hash(data.password, 12);
  const [user] = await db(TABLE)
    .insert({ id, ...data, password_hash, is_active: true })
    .returning("*");
  return user;
}

export async function findByUsername(username: string): Promise<User | null> {
  const user = await db(TABLE).where({ username }).first();
  return user || null;
}

export async function findById(id: string): Promise<User | null> {
  const user = await db(TABLE).where({ id }).first();
  return user || null;
}

export async function listUsers(): Promise<Omit<User, "password_hash">[]> {
  return db(TABLE).select(
    "id",
    "username",
    "full_name",
    "role",
    "jurisdiction",
    "is_active",
    "created_at",
    "updated_at"
  );
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "full_name" | "role" | "jurisdiction" | "is_active">>
): Promise<User | null> {
  const [user] = await db(TABLE)
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning("*");
  return user || null;
}

export function generateToken(user: User): string {
  const payload: JwtPayload = { userId: user.id, role: user.role };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
