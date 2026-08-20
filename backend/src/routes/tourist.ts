import { Router } from "express";
import * as ctrl from "../controllers/touristController";
import { authenticate } from "../middleware/auth";
import { restrictKycData } from "../middleware/kycGuard";
import { validateLocationPing } from "../middleware/validation";
import { registerValidator } from "../validators";

const router = Router();

// Public registration (rate-limited via server.ts publicLimiter)
router.post("/register", registerValidator, ctrl.registerTourist);

// Public QR verification (rate-limited)
router.get("/verify-id/:touristId/:blockId", ctrl.verifyId);

// Protected routes with KYC data masking for non-privileged roles
router.get("/tourists/:id", authenticate, restrictKycData, ctrl.getTourist);
router.get("/digital-ids", authenticate, restrictKycData, ctrl.listDigitalIds);
router.get("/digital-ids/:touristId", authenticate, restrictKycData, ctrl.getDigitalIdByTourist);
router.post("/location-ping", authenticate, validateLocationPing, ctrl.locationPing);

export default router;
