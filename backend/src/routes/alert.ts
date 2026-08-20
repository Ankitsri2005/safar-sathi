import { Router } from "express";
import * as ctrl from "../controllers/alertController";
import { authenticate, authorize } from "../middleware/auth";
import { createAlertValidator } from "../validators";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get("/", ctrl.listAlerts);
router.get("/recent", ctrl.getRecentAlerts);
router.get("/:id", ctrl.getAlert);
router.post("/", authorize(UserRole.POLICE, UserRole.ADMIN), createAlertValidator, ctrl.createAlert);
router.patch("/:id", authorize(UserRole.POLICE, UserRole.TOURISM, UserRole.ADMIN), ctrl.updateAlert);

export default router;
