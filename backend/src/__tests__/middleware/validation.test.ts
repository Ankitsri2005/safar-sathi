import { Request, Response, NextFunction } from "express";
import { validateUserUpdate, validatePasswordReset, validateLocationPing } from "../../middleware/validation";
import { UserRole } from "../../types";

function mockReq(body: any = {}, userRole?: UserRole): Request {
  return { body, user: userRole ? { userId: "u1", role: userRole } : undefined } as unknown as Request;
}

function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

describe("Validation Middleware", () => {
  describe("validateUserUpdate", () => {
    it("allows admin to change role", () => {
      const req = mockReq({ role: "police" }, UserRole.ADMIN);
      const res = mockRes();
      const next = mockNext();
      validateUserUpdate(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("prevents non-admin from changing role", () => {
      const req = mockReq({ role: "admin" }, UserRole.POLICE);
      const res = mockRes();
      const next = mockNext();
      validateUserUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Only administrators can change user roles" });
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects invalid role value", () => {
      const req = mockReq({ role: "superadmin" }, UserRole.ADMIN);
      const res = mockRes();
      const next = mockNext();
      validateUserUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects short full_name", () => {
      const req = mockReq({ full_name: "A" }, UserRole.ADMIN);
      const res = mockRes();
      const next = mockNext();
      validateUserUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects non-boolean is_active", () => {
      const req = mockReq({ is_active: "yes" }, UserRole.ADMIN);
      const res = mockRes();
      const next = mockNext();
      validateUserUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("passes valid update payload", () => {
      const req = mockReq({ full_name: "John Doe", jurisdiction: "Gangtok" }, UserRole.POLICE);
      const res = mockRes();
      const next = mockNext();
      validateUserUpdate(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("validatePasswordReset", () => {
    it("rejects missing password", () => {
      const req = mockReq({});
      const res = mockRes();
      const next = mockNext();
      validatePasswordReset(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects short password", () => {
      const req = mockReq({ password: "Ab1" });
      const res = mockRes();
      const next = mockNext();
      validatePasswordReset(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects password without uppercase", () => {
      const req = mockReq({ password: "alllowercase1" });
      const res = mockRes();
      const next = mockNext();
      validatePasswordReset(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects password without lowercase", () => {
      const req = mockReq({ password: "ALLUPPERCASE1" });
      const res = mockRes();
      const next = mockNext();
      validatePasswordReset(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects password without digit", () => {
      const req = mockReq({ password: "NoDigitsHere!" });
      const res = mockRes();
      const next = mockNext();
      validatePasswordReset(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("accepts valid strong password", () => {
      const req = mockReq({ password: "SecurePass1" });
      const res = mockRes();
      const next = mockNext();
      validatePasswordReset(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("validateLocationPing", () => {
    it("rejects missing tourist_id", () => {
      const req = mockReq({ lat: 27.0, lng: 88.5 });
      const res = mockRes();
      const next = mockNext();
      validateLocationPing(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects out-of-range latitude", () => {
      const req = mockReq({ tourist_id: "t1", lat: 100, lng: 88.5 });
      const res = mockRes();
      const next = mockNext();
      validateLocationPing(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects out-of-range longitude", () => {
      const req = mockReq({ tourist_id: "t1", lat: 27.0, lng: 200 });
      const res = mockRes();
      const next = mockNext();
      validateLocationPing(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("accepts valid Sikkim coordinates", () => {
      const req = mockReq({ tourist_id: "t1", lat: 27.35, lng: 88.61 });
      const res = mockRes();
      const next = mockNext();
      validateLocationPing(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("accepts edge-case coordinates", () => {
      const req = mockReq({ tourist_id: "t1", lat: 90, lng: 180 });
      const res = mockRes();
      const next = mockNext();
      validateLocationPing(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("rejects string lat (must be number)", () => {
      const req = mockReq({ tourist_id: "t1", lat: "27.0", lng: 88.5 });
      const res = mockRes();
      const next = mockNext();
      validateLocationPing(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
