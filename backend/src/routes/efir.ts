import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/efirController";
import { UserRole } from "../types";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.listEfirs);
router.get("/:id", ctrl.getEfirById);
router.get("/:id/download", ctrl.downloadEfir);
router.post("/generate/:alertId", authorize(UserRole.POLICE, UserRole.ADMIN), ctrl.generateEfir);
router.patch("/:id", authorize(UserRole.POLICE, UserRole.ADMIN), ctrl.updateEfirStatus);
router.delete("/:id", authorize(UserRole.ADMIN), ctrl.deleteEfir);

export default router;
