import { Router } from "express";
import * as ctrl from "../controllers/efirController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get("/", ctrl.listEfirs);
router.get("/:id/download", ctrl.downloadEfir);
router.post("/generate/:alertId", authorize(UserRole.POLICE, UserRole.ADMIN), ctrl.generateEfir);
router.patch("/:id", authorize(UserRole.POLICE, UserRole.ADMIN), ctrl.updateEfirStatus);

export default router;
