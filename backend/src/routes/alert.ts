import { Router } from "express";
import * as ctrl from "../controllers/alertController";
import { authenticate, authorize } from "../middleware/auth";
import { createAlertValidator } from "../validators";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get("/stats", ctrl.getAlertStats);
router.get("/recent", ctrl.getRecentAlerts);
router.get("/", ctrl.listAlerts);
router.get("/:id", ctrl.getAlert);
router.get("/:id/timeline", ctrl.getAlertTimeline);
router.post("/", authorize(UserRole.POLICE, UserRole.ADMIN), createAlertValidator, ctrl.createAlert);
router.patch("/:id", authorize(UserRole.POLICE, UserRole.TOURISM, UserRole.ADMIN), ctrl.updateAlert);
router.patch("/:id/triage", ctrl.updateTriage);

export default router;
