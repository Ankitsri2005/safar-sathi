import { Request, Response } from "express";
import * as authService from "../services/auth";

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    const user = await authService.findByUsername(username);

    if (!user || !(await authService.verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Account deactivated" });
    }

    const token = authService.generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        jurisdiction: user.jurisdiction,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const user = await authService.createUser(req.body);
    const token = authService.generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const user = await authService.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      jurisdiction: user.jurisdiction,
    });
  } catch {
    res.status(500).json({ error: "Failed to get user" });
  }
}

export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await authService.listUsers();
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to list users" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const user = await authService.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      jurisdiction: user.jurisdiction,
    });
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
}
