import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";

/**
 * Validate user update payload — prevent privilege escalation.
 * Non-admins cannot change role. Nobody can set role to a value they don't have access to.
 */
export function validateUserUpdate(req: Request, res: Response, next: NextFunction) {
  const { role, jurisdiction, full_name, is_active } = req.body;
  const userRole = req.user?.role;

  // Only admins can change roles
  if (role !== undefined && userRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Only administrators can change user roles" });
  }

  // Validate role value
  if (role !== undefined && !Object.values(UserRole).includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}` });
  }

  // Validate full_name if provided
  if (full_name !== undefined && (typeof full_name !== "string" || full_name.trim().length < 2)) {
    return res.status(400).json({ error: "Full name must be at least 2 characters" });
  }

  // Validate jurisdiction if provided
  if (jurisdiction !== undefined && jurisdiction !== null && typeof jurisdiction !== "string") {
    return res.status(400).json({ error: "Jurisdiction must be a string" });
  }

  // Validate is_active if provided
  if (is_active !== undefined && typeof is_active !== "boolean") {
    return res.status(400).json({ error: "is_active must be a boolean" });
  }

  next();
}

/**
 * Validate password reset — enforce minimum strength.
 */
export function validatePasswordReset(req: Request, res: Response, next: NextFunction) {
  const { password } = req.body;

  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
  }

  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
  }

  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: "Password must contain at least one number" });
  }

  next();
}

/**
 * Validate location ping data.
 */
export function validateLocationPing(req: Request, res: Response, next: NextFunction) {
  const { lat, lng, tourist_id } = req.body;

  if (!tourist_id || typeof tourist_id !== "string") {
    return res.status(400).json({ error: "tourist_id is required" });
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  if (lat === undefined || lat === null || isNaN(numLat) || numLat < -90 || numLat > 90) {
    return res.status(400).json({ error: "lat must be a valid number between -90 and 90" });
  }

  if (lng === undefined || lng === null || isNaN(numLng) || numLng < -180 || numLng > 180) {
    return res.status(400).json({ error: "lng must be a valid number between -180 and 180" });
  }

  req.body.lat = numLat;
  req.body.lng = numLng;

  next();
}
