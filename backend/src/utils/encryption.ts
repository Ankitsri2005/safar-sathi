import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT = process.env.ENCRYPTION_SALT || "smart-tourist-safety-2026";

function deriveKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "fallback-encryption-key-change-in-production";
  return crypto.scryptSync(secret, SALT, 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Input format: base64(iv):base64(authTag):base64(ciphertext)
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 3) return encryptedData; // Not encrypted, return as-is

  const key = deriveKey();
  const iv = Buffer.from(parts[0], "base64");
  const tag = Buffer.from(parts[1], "base64");
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Mask an ID number for display: show first 2 and last 2 chars, mask middle with ***
 */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber || idNumber.length < 6) return "***";
  return `${idNumber.slice(0, 2)}${"*".repeat(idNumber.length - 4)}${idNumber.slice(-2)}`;
}

/**
 * Mask a phone number: show last 4 digits only.
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "****";
  return `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

/**
 * Check if a string looks like it's been encrypted (has iv:tag:ciphertext format).
 */
export function isEncrypted(data: string): boolean {
  const parts = data.split(":");
  return parts.length === 3;
}
