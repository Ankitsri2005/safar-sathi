import { Router } from "express";
import * as ctrl from "../controllers/zoneController";
import { authenticate, authorize } from "../middleware/auth";
import { createZoneValidator } from "../validators";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get("/check", ctrl.checkZone);
router.get("/", ctrl.listZones);
router.get("/:id", ctrl.getZone);
router.post("/", authorize(UserRole.ADMIN), createZoneValidator, ctrl.createZone);
router.put("/:id", authorize(UserRole.ADMIN), ctrl.updateZone);
router.patch("/:id/deactivate", authorize(UserRole.ADMIN), ctrl.deactivateZone);
router.delete("/:id", authorize(UserRole.ADMIN), ctrl.deleteZone);

export default router;
