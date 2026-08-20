import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";
import { maskIdNumber, maskPhone } from "../utils/encryption";

/**
 * Middleware to restrict KYC data access.
 * Only admins and verification officers can see full id_number and phone.
 * Other roles see masked versions.
 */
export function restrictKycData(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Only mask for non-privileged roles accessing tourist data
    const userRole = req.user?.role;
    const canSeeFullKyc = userRole === UserRole.ADMIN || userRole === UserRole.VERIFICATION;

    if (canSeeFullKyc || !data) {
      return originalJson(data);
    }

    // Mask single tourist object
    if (data && typeof data === "object" && data.id_number) {
      data.id_number = maskIdNumber(data.id_number);
      if (data.phone) data.phone = maskPhone(data.phone);
    }

    // Mask array of tourist objects
    if (Array.isArray(data)) {
      data = data.map((item) => {
        if (item && typeof item === "object") {
          if (item.id_number) item.id_number = maskIdNumber(item.id_number);
          if (item.phone) item.phone = maskPhone(item.phone);
          // Mask nested tourist objects
          if (item.tourist && typeof item.tourist === "object") {
            if (item.tourist.id_number) item.tourist.id_number = maskIdNumber(item.tourist.id_number);
            if (item.tourist.phone) item.tourist.phone = maskPhone(item.tourist.phone);
          }
        }
        return item;
      });
    }

    // Mask paginated response with .data array
    if (data && typeof data === "object" && Array.isArray(data.data)) {
      data.data = data.data.map((item: any) => {
        if (item && typeof item === "object") {
          if (item.id_number) item.id_number = maskIdNumber(item.id_number);
          if (item.phone) item.phone = maskPhone(item.phone);
        }
        return item;
      });
    }

    return originalJson(data);
  };

  next();
}
