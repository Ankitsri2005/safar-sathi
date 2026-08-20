import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { UserRole, JwtPayload } from "../../types";

// We test the auth middleware logic directly since it's pure functions
// Import the actual middleware
import { authenticate, authorize } from "../../middleware/auth";

// Mock jsonwebtoken
jest.mock("jsonwebtoken");
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Helpers to create mock req/res/next
function mockReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
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

describe("Auth Middleware", () => {
  describe("authenticate", () => {
    it("rejects request with no Authorization header", () => {
      const req = mockReq({});
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "No token provided" });
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects request with malformed Authorization header", () => {
      const req = mockReq({ authorization: "Basic abc123" });
      const res = mockRes();
      const next = mockNext();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects invalid/expired token", () => {
      const req = mockReq({ authorization: "Bearer invalid-token" });
      const res = mockRes();
      const next = mockNext();

      mockJwt.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
      expect(next).not.toHaveBeenCalled();
    });

    it("accepts valid token and sets req.user", () => {
      const payload: JwtPayload = { userId: "user-1", role: UserRole.POLICE };
      const token = jwt.sign(payload, config.jwt.secret);

      const req = mockReq({ authorization: `Bearer ${token}` });
      const res = mockRes();
      const next = mockNext();

      mockJwt.verify.mockReturnValue(payload as any);

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(payload);
    });

    it("pins algorithm to HS256 — rejects none algorithm", () => {
      const req = mockReq({ authorization: "Bearer some-token" });
      const res = mockRes();
      const next = mockNext();

      mockJwt.verify.mockImplementation(() => {
        throw new Error("invalid algorithm");
      });

      authenticate(req, res, next);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { algorithms: ["HS256"] }
      );
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("authorize", () => {
    it("allows access for matching role", () => {
      const req = mockReq() as any;
      req.user = { userId: "u1", role: UserRole.ADMIN };
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize(UserRole.ADMIN, UserRole.POLICE);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("denies access for non-matching role", () => {
      const req = mockReq() as any;
      req.user = { userId: "u1", role: UserRole.TOURISM };
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize(UserRole.ADMIN, UserRole.POLICE);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Insufficient permissions" });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 if no user on request", () => {
      const req = mockReq() as any;
      req.user = undefined;
      const res = mockRes();
      const next = mockNext();

      const middleware = authorize(UserRole.ADMIN);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
