import { Router } from "express";
import * as ctrl from "../controllers/authController";
import { authenticate, authorize } from "../middleware/auth";
import { loginValidator, createUserValidator } from "../validators";
import { UserRole } from "../types";

const router = Router();

router.post("/login", loginValidator, ctrl.login);
router.post("/register", createUserValidator, ctrl.register);
router.post("/register-admin", authenticate, authorize(UserRole.ADMIN), createUserValidator, ctrl.register);
router.get("/me", authenticate, ctrl.getMe);
router.get("/users", authenticate, authorize(UserRole.ADMIN), ctrl.listUsers);
router.put("/users/:id", authenticate, authorize(UserRole.ADMIN), ctrl.updateUser);

export default router;
