import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/dashboardController";

const router = Router();
router.use(authenticate);

router.get("/overview", ctrl.getOverview);
router.get("/active-tourists", ctrl.getActiveTourists);
router.get("/analytics", ctrl.getAlertAnalytics);
router.get("/comprehensive", ctrl.getComprehensive);
router.get("/heatmap/tourist", ctrl.getTouristHeatmap);
router.get("/heatmap/alert", ctrl.getAlertHeatmap);

export default router;
