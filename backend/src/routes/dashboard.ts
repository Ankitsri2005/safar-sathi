import { Router } from "express";
import * as ctrl from "../controllers/dashboardController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/overview", ctrl.getOverview);
router.get("/active-tourists", ctrl.getActiveTourists);
router.get("/analytics", ctrl.getAlertAnalytics);

export default router;
