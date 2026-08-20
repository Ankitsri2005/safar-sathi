import { Router } from "express";
import * as ctrl from "../controllers/touristController";
import { authenticate } from "../middleware/auth";
import { registerValidator } from "../validators";

const router = Router();

// Public registration
router.post("/register", registerValidator, ctrl.registerTourist);

// Public QR verification (scan endpoint)
router.get("/verify-id/:touristId/:blockId", ctrl.verifyId);

// Protected routes
router.get("/tourists/:id", authenticate, ctrl.getTourist);
router.get("/digital-ids", authenticate, ctrl.listDigitalIds);
router.get("/digital-ids/:touristId", authenticate, ctrl.getDigitalIdByTourist);
router.post("/location-ping", authenticate, ctrl.locationPing);

export default router;
